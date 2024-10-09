import * as THREE from 'three149';
import { Pass } from 'three149/addons/postprocessing/Pass.js';
import { CopyShader } from 'three149/addons/shaders/CopyShader.js';

import { ShaderLibrary } from './shader_library.js';
import { DOFShader, SSSBlurShader, TinyBlurHDREShader, VSMBlurShader, } from './shader_parameters.js';
import * as Sentry from "@sentry/react";

function isPlatformMobile() {
    const e = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
    return e || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);
}

const QueryString = (function () {
    for (var e = {}, t = window.location.search.substring(1), r = t.split('&'), n = 0; n < r.length; n++) {
        const a = r[n].split('=');
        if (typeof e[a[0]] === 'undefined') e[a[0]] = decodeURIComponent(a[1]);
        else if (typeof e[a[0]] === 'string') {
            const i = [e[a[0]], decodeURIComponent(a[1])];
            e[a[0]] = i;
        } else e[a[0]].push(decodeURIComponent(a[1]));
    }
    return e;
}());

const debugMode = QueryString.debug && QueryString.debug !== '0' && QueryString.debug !== 'false';

const highPerformance = !isPlatformMobile() && !QueryString.lowPerformance;

function key_dispose(object) {
    Object.keys(object).forEach((key) => {
        if (object[key] && object[key].dispose) {
            object[key].dispose();
            object[key] = null;
        }
    });
}

class CenteredGaussianCurve {
    constructor(variance) {
        (this._amplitude = 1 / Math.sqrt(2 * variance * Math.PI)), (this._expScale = -1 / (2 * variance));
    }

    getValueAt(x) {
        return this._amplitude * Math.E ** (x * x * this._expScale);
    }

    // fromRadius(e, t) {
    //     t = t || 0.01;
    //     var r = e / Math.sqrt(-2 * Math.log(t));
    //     return new CenteredGaussianCurve(r * r);
    // }
}

// Get the data type that is supported.
const FloatTex = {
    getFloat(e) {
        if (e.extensions.get('OES_texture_float_linear')) return THREE.FloatType;
        throw new Error('Float render targets are unsupported!');
    },
    getHalfOrFloat(e) {
        const t = e.extensions;
        if (t.get('OES_texture_half_float_linear')) return THREE.HalfFloatType;
        if (t.get('OES_texture_float_linear')) return THREE.FloatType;
        throw new Error('Float render targets are unsupported!');
    },
    getHalfOrFloatOrAny(e) {
        const t = e.extensions;
        return t.get('OES_texture_half_float_linear') ? THREE.HalfFloatType : t.get('OES_texture_float_linear') ? THREE.FloatType : THREE.UnsignedByteType;
    },
};

// A render target that can swap
class DoubleBufferTexture {
    constructor(width, height, options) {
        (this._width = width),
            (this._height = height),
            (this._sourceFBO = new THREE.WebGLRenderTarget(width, height, options)),
            (this._targetFBO = new THREE.WebGLRenderTarget(width, height, options)),
            (this._sourceFBO.texture.generateMipmaps = options.generateMipmaps || false),
            (this._targetFBO.texture.generateMipmaps = options.generateMipmaps || false);
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get source() {
        return this._sourceFBO.texture;
    }

    get target() {
        return this._targetFBO;
    }

    swap() {
        const e = this._sourceFBO;
        (this._sourceFBO = this._targetFBO), (this._targetFBO = e);
    }
}

// Render a rectangle
class RectRenderer {
    constructor(renderer, mesh) {
        this._renderer = renderer;
        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this._mesh = mesh || new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
        this._scene.add(this._mesh);
    }

    execute(material, render_target, autoclear, camera) {
        const a = this._renderer.autoClear;
        this._renderer.autoClear = void 0 === autoclear || autoclear;
        this._mesh.material = material;
        this._renderer.setRenderTarget(render_target);
        this._renderer.render(this._scene, camera || this._camera);
        this._renderer.setRenderTarget(null);
        this._renderer.autoClear = a;
    }

    // clear(render_target) {
    //     this._renderer.setRenderTarget(render_target), this._renderer.clear();
    // }
}

// Variance Shadow Mapping: enable derivatives, backside
class VSMMaterial extends THREE.ShaderMaterial {
    constructor(use_float_texture) {
        let t = '';
        use_float_texture && (t += '#define FLOAT_TEX\n');
        super({
            vertexShader: ShaderLibrary.get('shadow_vertex'),
            fragmentShader: t + ShaderLibrary.get('vsm_fragment'),
        });
        (this.extensions.derivatives = true);
        (this.side = THREE.BackSide);
    }
}

// Variance Shadow Mapping: enable derivatives, backside
class VSMHairMaterial extends THREE.ShaderMaterial {
    constructor(use_float_texture) {
        let t = '';
        use_float_texture && (t += '#define FLOAT_TEX\n');
        super({
            uniforms: {
                alphaMap: { value: null },
                alpha_test: { value: 0.5 },
            },
            vertexShader: ShaderLibrary.get('shadow_vertex'),
            fragmentShader: t + ShaderLibrary.get('vsm_hair_fragment'),
        });
        (this.extensions.derivatives = true);
        (this.side = THREE.DoubleSide);
    }
}

class Signal {
    constructor() {
        (this._listeners = []), (this._lookUp = {});
    }

    get hasListeners() {
        return this._listeners.length > 0;
    }

    bind(e, t) {
        this._lookUp[e] = this._listeners.length;
        const listener = t ? e.bind(t) : e;
        this._listeners.push(listener);
    }

    unbind(e) {
        const t = this._lookUp[e];
        this._listeners.splice(t, 1), delete this._lookUp[e];
    }

    dispatch(e) {
        for (let t = this._listeners.length, r = 0; r < t; ++r) this._listeners[r](e);
    }
}

// Sky box mesh
class Skybox extends THREE.Mesh {
    constructor(env_map, width, exposure_exp, hdre) {
        width = width || 1e3;
        const box = new THREE.BoxGeometry(width, width, width);
        box.scale(-1, 1, 1);
        const material = new SkyMaterial({ envMap: env_map, exposure: exposure_exp || 0, hdre });
        super(box, material);
    }

    get texture() {
        return this.material.envMap;
    }

    set texture(e) {
        this.material.envMap = e;
    }
}

// Panorama for background
class SkyMaterial extends THREE.ShaderMaterial {
    constructor(parameters) {
        const defines = {};
        parameters.envMap instanceof THREE.Texture && (defines.LAT_LONG = '1'), parameters.hdre && (defines.HDRE = '1');
        const uniforms = {
            envMap: { value: parameters.envMap },
            exposure: { value: 2 ** (parameters.exposure || 0) },
        };
        super({
            uniforms,
            defines,
            vertexShader: ShaderLibrary.get('sky_vertex'),
            fragmentShader: ShaderLibrary.get('sky_fragment'),
        });
        this._envMap = parameters.envMap;
    }

    get envMap() {
        return this._envMap;
    }

    set envMap(e) {
        (this._envMap = e), (this.uniforms.envMap.value = e);
    }
}

// Small class that only has a "_entity".
class Component {
    constructor() {
        this._entity = null;
    }

    // onUpdate: null
    get entity() {
        return this._entity;
    }

    onAdded() {
    }

    onRemoved() {
    }
}

// Visualization
class OrbitController extends Component {
    constructor(container, lookat, move_with_keys) {
        super(),
            (this._container = container),
            (this._coords = new THREE.Vector3(0.5 * Math.PI, 0.4 * Math.PI, 2)),
            (this._localAcceleration = new THREE.Vector3(0, 0, 0)),
            (this._localVelocity = new THREE.Vector3(0, 0, 0)),
            (this.lookAtTarget = lookat || new THREE.Vector3(0, 0, 0)),
            (this.zoomSpeed = 2),
            (this.maxRadius = 20),
            (this.minRadius = 0.1),
            (this.dampen = 0.9),
            (this.maxAzimuth = void 0),
            (this.minAzimuth = void 0),
            (this.minPolar = 0.1),
            (this.maxPolar = Math.PI - 0.1),
            (this.moveAcceleration = 0.02),
            (this._m = new THREE.Matrix4()),
            (this._oldMouseX = 0),
            (this._oldMouseY = 0),
            (this._moveWithKeys = move_with_keys),
            (this._moveAcceleration = new THREE.Vector3()),
            (this._moveVelocity = new THREE.Vector3()),
            (this._isDown = false),
            this.mouse_constant = 0.0015;
        this._initListeners();
    }
    static _scaling = navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    ) ? 0.0005 : 0.2

    get radius() {
        return this._coords.z;
    }

    set radius(e) {
        this._coords.z = e;
    }

    get azimuth() {
        return this._coords.x;
    }

    set azimuth(e) {
        this._coords.x = e;
    }

    get polar() {
        return this._coords.y;
    }

    set polar(e) {
        this._coords.y = e;
    }

    onAdded() {
        this._isDown = false;
        const e = /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel';
        this._container.addEventListener(e, this._onMouseWheel, { passive: false }),
            document.addEventListener('mousemove', this._onMouseMove, { passive: false }),
            document.addEventListener('touchmove', this._onTouchMove, { passive: false }),
            this._container.addEventListener('mousedown', this._onMouseDown, { passive: false }),
            this._container.addEventListener('touchstart', this._onTouchDown, { passive: false }),
            document.addEventListener('mouseup', this._onUp, { passive: false }),
            document.addEventListener('touchend', this._onUp), { passive: false },
            this._moveWithKeys && (document.addEventListener('keyup', this._onKeyUp, { passive: false }), document.addEventListener('keydown', this._onKeyDown, { passive: false }));
    }

    onRemoved() {
        const e = /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel';
        this._container.removeEventListener(e, this._onMouseWheel, { passive: false }),
            document.removeEventListener('mousemove', this._onMouseMove, { passive: false }),
            document.removeEventListener('touchmove', this._onTouchMove, { passive: false }),
            this._container.removeEventListener('mousedown', this._onMouseDown, { passive: false }),
            this._container.removeEventListener('touchstart', this._onTouchDown, { passive: false }),
            document.removeEventListener('mouseup', this._onUp, { passive: false }),
            document.removeEventListener('touchend', this._onUp, { passive: false }),
            this._moveWithKeys && (document.removeEventListener('keyup', this._onKeyUp, { passive: false }), document.removeEventListener('keydown', this._onKeyDown, { passive: false }));
    }

    onUpdate(e) {
        if (this._moveWithKeys) {
            (this._moveVelocity.x *= this.dampen),
                (this._moveVelocity.y *= this.dampen),
                (this._moveVelocity.z *= this.dampen),
                (this._moveVelocity.x += this._moveAcceleration.x),
                (this._moveVelocity.y += this._moveAcceleration.y),
                (this._moveVelocity.z += this._moveAcceleration.z);
            const t = new THREE.Vector3();
            t.copy(this._moveVelocity), t.applyQuaternion(this.entity.quaternion.setFromRotationMatrix(this.entity.matrixWorld)), (this.lookAtTarget.x += t.x), (this.lookAtTarget.y += this._moveVelocity.y), (this.lookAtTarget.z += t.z);
        }
        (this._localVelocity.x *= this.dampen),
            (this._localVelocity.y *= this.dampen),
            (this._localVelocity.z *= this.dampen),
            (this._localVelocity.x += this._localAcceleration.x),
            (this._localVelocity.y += this._localAcceleration.y),
            (this._localVelocity.z += this._localAcceleration.z),
            (this._localAcceleration.x = 0),
            (this._localAcceleration.y = 0),
            (this._localAcceleration.z = 0),
            this._coords.add(this._localVelocity),
            (this._coords.y = THREE.MathUtils.clamp(this._coords.y, this.minPolar, this.maxPolar)),
            (this._coords.z = THREE.MathUtils.clamp(this._coords.z, this.minRadius, this.maxRadius)),
            void 0 !== this.maxAzimuth && void 0 !== this.minAzimuth && (this._coords.x = THREE.MathUtils.clamp(this._coords.x, this.minAzimuth, this.maxAzimuth));
        const camera = this.entity;
        const matrix = this._m;
        const position = this._fromSphericalCoordinates(this._coords.z, this._coords.x, this._coords.y);
        position.add(this.lookAtTarget), matrix.lookAt(position, this.lookAtTarget, new THREE.Vector3(0, 1, 0)), matrix.setPosition(position), matrix.decompose(camera.position, camera.quaternion, camera.scale);
    }

    _fromSphericalCoordinates(e, t, r) {
        const n = new THREE.Vector3();
        return (n.x = e * Math.sin(r) * Math.cos(t)), (n.y = e * Math.cos(r)), (n.z = e * Math.sin(r) * Math.sin(t)), n;
    }

    setAzimuthImpulse(e) {
        this._localAcceleration.x = e;
    }

    setPolarImpulse(e) {
        this._localAcceleration.y = e;
    }

    setZoomImpulse(e) {
        this._localAcceleration.z = e;
    }

    _updateMove(e, t) {
        if (void 0 !== this._oldMouseX) {
            const r = e - this._oldMouseX;
            const n = t - this._oldMouseY;
            this.setAzimuthImpulse(this.mouse_constant * r), this.setPolarImpulse(this.mouse_constant * -n);
        }
        (this._oldMouseX = e), (this._oldMouseY = t);
    }

    _initListeners() {
        const e = this;
        (this._onMouseWheel = function (t) {
            const r = t.detail ? -120 * t.detail : t.wheelDelta;
            t.preventDefault();
            e.setZoomImpulse(-r * e.zoomSpeed * 1e-4);
        }),
            (this._onMouseDown = function (t) {
                (e._oldMouseX = void 0), (e._oldMouseY = void 0), (e._isDown = true);
            }),
            (this._onMouseMove = function (t) {
                e._isDown && e._updateMove(t.screenX, t.screenY);
            }),
            (this._onTouchDown = function (t) {
                if (((e._oldMouseX = void 0), (e._oldMouseY = void 0), t.touches.length === 2)) {
                    const r = t.touches[0];
                    const n = t.touches[1];
                    const a = r.screenX - n.screenX;
                    const i = r.screenY - n.screenY;
                    (e._startPitchDistance = Math.sqrt(a * a + i * i)), (e._startZoom = e.radius);
                }
                e._isDown = true;
            }),
            (this._onTouchMove = function (t) {
                if ((t.preventDefault(), e._isDown)) {
                    const r = t.touches.length;
                    if (r === 1) {
                        const n = t.touches[0];
                        e._updateMove(n.screenX, n.screenY);
                    } else if (r === 2) {
                        const a = t.touches[0];
                        const i = t.touches[1];
                        const o = a.screenX - i.screenX;
                        const s = a.screenY - i.screenY;
                        const l = Math.sqrt(o * o + s * s);
                        const h = e._startPitchDistance - l;
                        e.radius = e._startZoom + OrbitController._scaling * h;
                    }
                }
            }),
            (this._onUp = function (t) {
                e._isDown = false;
            }),
            (this._onKeyUp = function (t) {
                switch (t.keyCode) {
                    case 69:
                    case 81:
                        e._moveAcceleration.y = 0;
                        break;
                    case 37:
                    case 65:
                    case 39:
                    case 68:
                        e._moveAcceleration.x = 0;
                        break;
                    case 38:
                    case 87:
                    case 40:
                    case 83:
                        e._moveAcceleration.z = 0;
                }
            }),
            (this._onKeyDown = function (t) {
                switch (t.keyCode) {
                    case 81:
                        e._moveAcceleration.y = -e.moveAcceleration;
                        break;
                    case 69:
                        e._moveAcceleration.y = e.moveAcceleration;
                        break;
                    case 37:
                    case 65:
                        e._moveAcceleration.x = -e.moveAcceleration;
                        break;
                    case 38:
                    case 87:
                        e._moveAcceleration.z = -e.moveAcceleration;
                        break;
                    case 39:
                    case 68:
                        e._moveAcceleration.x = e.moveAcceleration;
                        break;
                    case 40:
                    case 83:
                        e._moveAcceleration.z = e.moveAcceleration;
                }
            });
    }
}

class EntityEngine {
    constructor() {
        (this._updateableEntities = []), (this._updateQueue = []), (this._destroyQueue = []);
    }

    registerEntity(entity) {
        entity._onRequireUpdatesChange.bind(this._onEntityUpdateChange, this), entity._requiresUpdates && this._addUpdatableEntity(entity);
    }

    unregisterEntity(entity) {
        entity._onRequireUpdatesChange.unbind(this), entity._requiresUpdates && this._removeUpdatableEntity(entity);
    }

    destroyEntity(entity) {
        entity._onRequireUpdatesChange.unbind(this), entity._requiresUpdates && this._removeUpdatableEntity(entity), this._destroyQueue.push(entity);
    }

    _onEntityUpdateChange(e) {
        e._requiresUpdates ? this._addUpdatableEntity(e) : this._removeUpdatableEntity(e);
    }

    _addUpdatableEntity(e) {
        this._updateQueue.push({ entity: e, updatable: true });
    }

    _removeUpdatableEntity(e) {
        this._updateQueue.push({ entity: e, updatable: false });
    }

    _processUpdateQueue() {
        const e = this._updateQueue.length;
        if (e !== 0) {
            for (let t = 0; t < e; ++t) {
                const r = this._updateQueue[t];
                const n = r.entity;
                if (r.updatable) this._updateableEntities.push(n);
                else {
                    const a = this._updateableEntities.indexOf(n);
                    this._updateableEntities.splice(a, 1);
                }
            }
            this._updateQueue = [];
        }
    }

    _processDestroyQueue() {
        const e = this._destroyQueue.length;
        if (e !== 0) {
            for (let t = 0; t < e; ++t) {
                const r = this._destroyQueue[t];
                delete r._components, delete r._requiresUpdates, delete r._onRequireUpdatesChange, delete r._update, delete r._updateRequiresUpdates;
            }
            this._destroyQueue = [];
        }
    }

    update(time_delta) {
        this._processUpdateQueue(), this._processDestroyQueue();
        for (let t = this._updateableEntities, r = t.length, n = 0; n < r; ++n) t[n]._update(time_delta);
    }
}

const EntityPrototype = {
    _init(e) {
        (e._components = []),
            (e._requiresUpdates = false),
            (e._onRequireUpdatesChange = new Signal()),
            (e._update = function (e) {
                const t = this._components;
                if (t) {
                    for (let r = t.length, n = 0; n < r; ++n) {
                        const a = t[n];
                        a.onUpdate && a.onUpdate(e);
                    }
                }
            }),
            (e._updateRequiresUpdates = function (e) {
                e !== this._requiresUpdates && ((this._requiresUpdates = e), this._onRequireUpdatesChange.dispatch(this));
            });
    },
};

const Entity = {
    ENGINE: new EntityEngine(),
    isEntity(e) {
        return !!e._components;
    },
    convert(entity) {
        Entity.isEntity(entity) || (EntityPrototype._init(entity), Entity.ENGINE.registerEntity(entity));
    },
    destroy(entity) {
        Entity.ENGINE.destroyEntity(entity);
    },
    addComponents(entity, component_list) {
        for (let r = 0; r < component_list.length; ++r) Entity.addComponent(entity, component_list[r]);
    },
    removeComponents(entity, component_list) {
        for (let r = 0; r < component_list.length; ++r) Entity.removeComponent(entity, component_list[r]);
    },
    addComponent(entity, component) {
        if (component._entity) throw new Error('Component already added to an entity!');
        Entity.convert(entity), entity._components.push(component), entity._updateRequiresUpdates(this._requiresUpdates || !!component.onUpdate), (component._entity = entity), component.onAdded();
    },
    hasComponent(entity, component) {
        return entity._components && entity._components.indexOf(component) >= 0;
    },
    removeComponent(entity, component) {
        if (!Entity.hasComponent(entity, component)) throw new Error('Component wasn\'t added to this entity!');
        component.onRemoved();
        for (var r = false, n = entity._components.length, a = 0, i = [], o = 0; o < n; ++o) {
            const s = entity._components[o];
            s !== component && ((i[a++] = s), (r = r || !!component.onUpdate));
        }
        (entity._components = a === 0 ? null : i), (component._entity = null), entity._updateRequiresUpdates(r);
    },
};

function verifyExtension(mainProject, extension) {
    const t = mainProject.renderer.extensions.get(extension);
    return t || showError(`This requires the WebGL ${extension} extension!`), t;
}

function showError(e) {
    var e = document.getElementById('errorContainer');
    (e.style.display = 'block'), (e = document.getElementById('errorMessage')), (e.innerHTML = e);
}

class LinearDepthMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: { cameraNear: { value: 0 }, rcpCameraRange: { value: 0 } },
            vertexShader: ShaderLibrary.get('linear_depth_vertex'),
            fragmentShader: ShaderLibrary.get('linear_depth_fragment'),
        });
    }

    get cameraNear() {
        return this.uniforms.cameraNear.value;
    }

    set cameraNear(e) {
        this.uniforms.cameraNear.value = e;
    }

    get rcpCameraRange() {
        return this.uniforms.rcpCameraRange.value;
    }

    set rcpCameraRange(e) {
        this.uniforms.rcpCameraRange.value = e;
    }
}

class LinearHairDepthMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                cameraNear: { value: 0 },
                rcpCameraRange: { value: 0 },
                alphaMap: { value: null },
                alpha_test: { value: 0.5 },
                // depthMap_prev: { value: null },
                // screen_size: { value: new THREE.Vector2(1, 1) },
                layer: { value: new Number(0) },
            },
            vertexShader: ShaderLibrary.get('linear_depth_vertex'),
            fragmentShader: ShaderLibrary.get('linear_hair_depth_fragment'),
        });
        this.side = THREE.DoubleSide;
    }

    get cameraNear() {
        return this.uniforms.cameraNear.value;
    }

    set cameraNear(e) {
        this.uniforms.cameraNear.value = e;
    }

    get rcpCameraRange() {
        return this.uniforms.rcpCameraRange.value;
    }

    set rcpCameraRange(e) {
        this.uniforms.rcpCameraRange.value = e;
    }
}

// Render depth map
class SceneDepthRenderer {
    constructor(scene, camera, renderer, scale) {
        this._renderer = renderer;
        this._scene = scene;
        this._camera = camera;
        this._scale = scale || 1;
        this._depthMaterial = new LinearDepthMaterial();
        this._hair_depthMaterial = new LinearHairDepthMaterial();

        global_material_overrider.override_setting.depth.face = this._depthMaterial;
        global_material_overrider.override_setting.depth.hair = this._hair_depthMaterial;
    }

    get texture() {
        return this?._renderTarget?.texture;
    }

    resize(width, height) {
        width = Math.ceil(width * this._scale);
        height = Math.ceil(height * this._scale);
        if (!(this._renderTarget && this._renderTarget.width === width && this._renderTarget.height === height)) {
            (this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                generateMipmaps: false,
                depthBuffer: true,
                stencilBuffer: false,
            }));
        }

        if (!(this._renderTarget2 && this._renderTarget2.width === width && this._renderTarget2.height === height)) {
            (this._renderTarget2 = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                generateMipmaps: false,
                depthBuffer: true,
                stencilBuffer: false,
            }));
        }

        // this._hair_depthMaterial.uniforms.screen_size.value.set(width, height);
        // console.log(this._hair_depthMaterial.uniforms.screen_size.value);

        this.width = width;
        this.height = height;
    }

    render() {
        this._depthMaterial.cameraNear = this._camera.near;
        this._depthMaterial.rcpCameraRange = 1 / (this._camera.far - this._camera.near);
        this._hair_depthMaterial.cameraNear = this._camera.near;
        this._hair_depthMaterial.rcpCameraRange = 1 / (this._camera.far - this._camera.near);
        this._renderer.setClearColor(16777215, 1);
        global_material_overrider.override('depth');
        this._hair_depthMaterial.uniforms.layer.value = 0;
        this._renderer.setRenderTarget(this._renderTarget);
        if (global_render_target_injector.render_type === RenderTargetInjector.Type.DEPTH_MAP) {
            this._renderer.setRenderTarget(null);
        }
        this._renderer.clear();
        try {
            this._renderer.render(this._scene, this._camera);
        } catch (e) {
            // Comment this cuz there is nothing we can do about it xD
            // Sentry.captureException(e)
            console.error(e);
            window.location.replace('https://hyperhuman.deemos.com/error');
        }
        this._renderer.setRenderTarget(null);

        // this._hair_depthMaterial.uniforms.layer.value = 1;
        // this._hair_depthMaterial.uniforms.depthMap_prev.value = this._renderTarget.texture;
        // this._renderer.setRenderTarget(this._renderTarget2);

        // this._hair_depthMaterial.uniforms.screen_size.value.set(this.width / this._scale, this.height / this._scale);
        // this._renderer.setRenderTarget(null);

        // this._renderer.clear();
        // this._renderer.render(this._scene, this._camera);
        // this._renderer.setRenderTarget(null);

        global_material_overrider.unoverride();
        this._renderer.setClearColor(0, 1);
    }

    dispose() {
        key_dispose(this);
    }
}

class VSMShadowRenderer {
    constructor(scene, renderer, light, texture_size) {
        (texture_size = void 0 === texture_size ? 1024 : texture_size), (this.onUpdate = new Signal());
        const a = FloatTex.getHalfOrFloatOrAny(renderer);
        this._floatTexture = a !== THREE.UnsignedByteType;

        this._vsmMaterial = new VSMMaterial(this._floatTexture);
        this._hair_vsmMaterial = new VSMHairMaterial(this._floatTexture);
        global_material_overrider.override_setting.shadow.face = this._vsmMaterial;
        global_material_overrider.override_setting.shadow.hair = this._hair_vsmMaterial;

        this._rectRenderer = new RectRenderer(renderer);
        this._shadowMap = new DoubleBufferTexture(texture_size, texture_size, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: a,
        });
        this._light = light;
        this._renderer = renderer;
        this._scene = scene;
        this._lightCamera = new THREE.OrthographicCamera(-0.3, 0.3, -0.3, 0.3, -1, 1);
        this._size = texture_size;
        this._focusObject = scene;
        this.shadowMapMatrix = new THREE.Matrix4();
        VSMBlurShader.defines = this._floatTexture ? { FLOAT_TEX: 1 } : void 0;
        this.blur = new THREE.ShaderMaterial(VSMBlurShader);
    }

    get shadowMap() {
        return this._shadowMap.source;
    }

    get size() {
        return this._size;
    }

    get floatTexture() {
        return this._floatTexture;
    }

    constrain(e) {
        this._focusObject = e;
    }

    render() {
        const light_camera = this._lightCamera;
        light_camera.position.copy(this._light.position);
        light_camera.lookAt(new THREE.Vector3(0, 0, 0));
        light_camera.position.set(0, 0, 0);
        light_camera.updateMatrixWorld();
        const t = new THREE.Matrix4();
        t.copy(light_camera.matrixWorld).invert();
        const bounding_box = new THREE.Box3();
        bounding_box.setFromObject(this._focusObject);
        bounding_box.applyMatrix4(t);
        (light_camera.left = bounding_box.min.x - 0.01);
        (light_camera.right = bounding_box.max.x + 0.01);
        (light_camera.top = bounding_box.min.y - 0.01);
        (light_camera.bottom = bounding_box.max.y + 0.01);
        (light_camera.near = -bounding_box.max.z - 0.01);
        (light_camera.far = -bounding_box.min.z + 0.01);
        light_camera.updateProjectionMatrix();
        this.shadowMapMatrix.copy(light_camera.matrixWorld).invert();
        this.shadowMapMatrix.multiplyMatrices(light_camera.projectionMatrix, this.shadowMapMatrix);

        this._renderer.setClearColor(0xffffff);
        global_material_overrider.override('shadow');
        this._renderer.setRenderTarget(this._shadowMap.target);
        if (global_render_target_injector.render_type === RenderTargetInjector.Type.SHADOW_MAP) {
            this._renderer.setRenderTarget(null);
        }
        this._renderer.render(this._scene, this._lightCamera);
        this._renderer.setRenderTarget(null);
        global_material_overrider.unoverride();

        this._shadowMap.swap();
        this._renderer.setClearColor(0);
        const { uniforms } = this.blur;

        uniforms.step.value.set(1 / this._size, 0);
        uniforms.tDiffuse.value = this._shadowMap.source;
        this._rectRenderer.execute(this.blur, this._shadowMap.target);
        this._shadowMap.swap();

        uniforms.step.value.set(0, 1 / this._size);
        uniforms.tDiffuse.value = this._shadowMap.source;
        if (global_render_target_injector.render_type === RenderTargetInjector.Type.SHADOW_MAP_BLUR) {
            this._rectRenderer.execute(this.blur, null);
        } else {
            this._rectRenderer.execute(this.blur, this._shadowMap.target);
        }
        this._shadowMap.swap();

        this.onUpdate.dispatch();
    }

    dispose() {
        key_dispose(this);
    }
}

// SSS curves? It is four Gaussian distributions.
class SSSProfile {
    constructor(width, range) {
        this._gaussianTexture = new THREE.DataTexture(null, width, 1, THREE.RGBAFormat, THREE.FloatType, null, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
        this.generateMipmap = false;
        this._range = range;
        this._layers = [];
        this._width = width;
    }

    get gaussianLookUp() {
        return this._gaussianTexture;
    }

    get range() {
        return this._range / 1e3;
    }

    get distanceMapping() {
        return 1e3 / this._range;
    }

    getBlendColor(e) {
        return e >= this._layers.length ? new THREE.Color() : this._layers[e].blend;
    }

    addLayer(variance, color) {
        if (this._layers.length === 4) throw new Error('Doesn\'t support more than 4 layers!');
        this._layers.push({ gauss: new CenteredGaussianCurve(variance), blend: color });
    }

    generate() {
        for (var data = [], step = this._range / this._width, num_layers = this._layers.length, n = 0; n < this._width; ++n) {
            for (var x = n * step, l = 0; l < num_layers; ++l) {
                // for (var x = n * step, r = 0, g = 0, b = 0, l = 0; l < num_layers; ++l) {
                const curve = this._layers[l];
                const pdf = curve.gauss.getValueAt(x);
                const color = curve.blend;
                // (r += pdf * color.r), (g += pdf * color.g), (b += pdf * color.b),
                data.push(pdf);
            }
            for (l = num_layers; l < 4; ++l) data.push(0);
        }
        (this._gaussianTexture.image.data = new Float32Array(data)), (this._gaussianTexture.needsUpdate = true);
    }
}

// only render SSS, depthMap+nearfar+unproject
class SSSRenderer {
    constructor(scene, camera, renderer, depth_renderer, sss_material_options, scale) {
        this._scale = scale || 0.5;
        this._camera = camera;
        this._renderer = renderer;
        this._scene = scene;
        this.depthRenderer = depth_renderer;
        this._floatTexType = FloatTex.getHalfOrFloatOrAny(renderer);
        this._rectRenderer = new RectRenderer(renderer);
        this._material = new SSSMaterial(sss_material_options);
        global_material_overrider.override_setting.sss.face = this._material;
        // global_material_overrider.override_setting.sss.hair = new HairSSSMaterial();

        this._renderTarget = new DoubleBufferTexture(1, 1, {
            type: this._floatTexType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            generateMipmaps: false,
            depthBuffer: true,
            stencilBuffer: false,
        });

        // console.log(sss_material_options.sssProfile.gaussianLookUp);

        this.sssBlur = new THREE.ShaderMaterial(SSSBlurShader);
        this.sssBlur.uniforms.sssProfileMap.value = sss_material_options.sssProfile.gaussianLookUp;
        this.sssBlur.uniforms.color1.value = sss_material_options.sssProfile.getBlendColor(1);
        this.sssBlur.uniforms.color2.value = sss_material_options.sssProfile.getBlendColor(2);
        this.sssBlur.uniforms.color3.value = sss_material_options.sssProfile.getBlendColor(3);
        this.sssBlur.uniforms.sssProfileScale.value = sss_material_options.sssProfile.distanceMapping;
        this.sssBlur.uniforms.sssRange.value = sss_material_options.sssProfile.range;
        this.sssBlur.depthWrite = false;
        this.sssBlur.depthTest = false;
    }

    get texture() {
        return this._renderTarget.source;
    }

    resize(e, t) {
        const r = Math.ceil(e * this._scale);
        const n = Math.ceil(t * this._scale);
        this._renderTarget = new DoubleBufferTexture(r, n, {
            type: this._floatTexType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            generateMipmaps: false,
            depthBuffer: true,
            stencilBuffer: false,
        });
    }

    render() {
        global_material_overrider.override('sss');
        this._renderer.setRenderTarget(this._renderTarget.target);
        this._renderer.clear();
        if (global_render_target_injector.render_type === RenderTargetInjector.Type.SSS) {
            this._renderer.setRenderTarget(null);
        }
        this._renderer.render(this._scene, this._camera);
        this._renderer.setRenderTarget(null);
        this._renderTarget.swap();
        global_material_overrider.unoverride();

        const { uniforms } = this.sssBlur;
        uniforms.depthMap.value = this.depthRenderer.texture;
        uniforms.cameraNear.value = this._camera.near;
        uniforms.cameraRange.value = this._camera.far - this._camera.near;
        uniforms.unprojectionMatrix.value.copy(this._camera.projectionMatrix).invert();

        uniforms.tDiffuse.value = this._renderTarget.source;
        uniforms.step.value.set(1 / this._renderTarget.width, 0);
        this._rectRenderer.execute(this.sssBlur, this._renderTarget.target);
        this._renderTarget.swap();

        uniforms.tDiffuse.value = this._renderTarget.source;
        uniforms.step.value.set(0, 1 / this._renderTarget.height);
        if (global_render_target_injector.render_type === RenderTargetInjector.Type.SSS_BLUR) {
            this._rectRenderer.execute(this.sssBlur, null);
        } else {
            this._rectRenderer.execute(this.sssBlur, this._renderTarget.target);
        }
        this._renderTarget.swap();
    }

    dispose() {
        key_dispose(this);
    }
}

// Use light, GGX BRDF, irradianceMap+normalMap+shadowMap
class SSSMaterial extends THREE.ShaderMaterial {
    constructor(parameters) {
        const defines = { MIN_VARIANCE: -1e-4, LIGHT_BLEED_REDUCTION: 0.5 };
        const uniforms = {
            irradianceMap: { value: parameters.irradianceMap },
            probeExposure: { value: 2 ** (void 0 === parameters.probeExposure ? 0 : parameters.probeExposure) },
            normalMap: { value: parameters.normalMap },
            shadowMap: { value: parameters.shadowRenderer.shadowMap },
            shadowMapMatrix: { value: parameters.shadowRenderer.shadowMapMatrix },
        };
        const uniforms_with_lights = THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]);
        super({
            uniforms: uniforms_with_lights,
            defines,
            lights: true,
            vertexShader: ShaderLibrary.get('sss_vertex'),
            fragmentShader: ShaderLibrary.getInclude('include_ggx') + ShaderLibrary.get('sss_fragment'),
        });
        this.uniforms.shadowMap.value = parameters.shadowRenderer.shadowMap;
        this.extensions.derivatives = true;
        this.uniforms.irradianceMap.value = parameters.irradianceMap;
        this.uniforms.normalMap.value = parameters.normalMap;
        this._shadowRenderer = parameters.shadowRenderer;
        this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this);
    }

    _onShadowUpdate() {
        this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix;
        this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap;
    }
}

class DepthOfFieldPass extends Pass {
    constructor(camera, scene, r, n) {
        super();
        (this._depthTexture = r),
            (this._focusPosition = new THREE.Vector3()),
            (this._focusFalloff = 0.5),
            (this._focusRange = 0.5),
            (this._v = new THREE.Vector3()),
            (this._camera = camera),
            (this._scene = scene),
            (this._textureType = n),
            (this._strength = 1),
            (this.copy = new THREE.ShaderMaterial(CopyShader)),
            (this.blur = new THREE.ShaderMaterial(TinyBlurHDREShader)),
            (this.composite = new THREE.ShaderMaterial(DOFShader)),
            (this._postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)),
            (this._postScene = new THREE.Scene()),
            (this._postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)),
            this._postScene.add(this._postQuad),
            (this.focusRange = 2),
            (this.focusFalloff = 5);
    }

    get depthTexture() {
        return this._depthTexture;
    }

    set depthTexture(e) {
        this._depthTexture = e;
    }

    get focusPosition() {
        return this._focusPosition;
    }

    set focusPosition(e) {
        this._focusPosition = e;
    }

    get focusFalloff() {
        return this._focusFalloff;
    }

    set focusFalloff(e) {
        (this._focusFalloff = e), (this.composite.uniforms.focusFalloff.value = e / (this._camera.far - this._camera.near));
    }

    get focusRange() {
        return this._focusRange;
    }

    set focusRange(e) {
        (this._focusRange = e), (this.composite.uniforms.focusRange.value = e / (this._camera.far - this._camera.near));
    }

    get strength() {
        return this._strength;
    }

    set strength(e) {
        (this._strength = e), (this.composite.uniforms.strength.value = e), (this.enabled = this._strength !== 0);
    }

    render(renderer, write_buffer, read_buffer, delta_time, mask_active) {
        this._v.copy(this._focusPosition), this._v.applyMatrix4(this._camera.matrixWorldInverse), (this.composite.uniforms.focusDepth.value = (-this._v.z - this._camera.near) / (this._camera.far - this._camera.near));
        const i = this.smallBlurRadiusTex.width;
        const o = this.smallBlurRadiusTex.height;
        (this._postQuad.material = this.copy);
        (this.copy.uniforms.tDiffuse.value = read_buffer.texture);
        renderer.setRenderTarget(this.smallBlurRadiusTex2);
        renderer.render(this._postScene, this._postCamera);
        renderer.setRenderTarget(null);
        (this._postQuad.material = this.blur);
        (this.blur.uniforms.tDiffuse.value = this.smallBlurRadiusTex2.texture);
        (this.blur.uniforms.sampleStep.value.x = 1 / i);
        (this.blur.uniforms.sampleStep.value.y = 1 / o);
        renderer.setRenderTarget(this.smallBlurRadiusTex);
        renderer.render(this._postScene, this._postCamera);
        renderer.setRenderTarget(null);
        (this.blur.uniforms.tDiffuse.value = this.smallBlurRadiusTex.texture);
        (this.blur.uniforms.sampleStep.value.x = 1.5 / i);
        (this.blur.uniforms.sampleStep.value.y = 1.5 / o);
        renderer.setRenderTarget(this.largeBlurRadiusTex);
        renderer.render(this._postScene, this._postCamera);
        renderer.setRenderTarget(null);
        (this._postQuad.material = this.composite);
        (this.composite.uniforms.depth.value = this._depthTexture);
        (this.composite.uniforms.source.value = read_buffer.texture);
        (this.composite.uniforms.blurred1.value = this.smallBlurRadiusTex.texture);
        (this.composite.uniforms.blurred2.value = this.largeBlurRadiusTex.texture);
        renderer.setRenderTarget(write_buffer);
        renderer.render(this._postScene, this._postCamera);
        renderer.setRenderTarget(null);
    }

    setSize(e, t) {
        if (((e = Math.floor(e)), (t = Math.floor(t)), this.resolutionX !== e || this.resolutionY !== t)) {
            (this.resolutionX = e), (this.resolutionY = t);
            const options = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: this._textureType,
            };
            let width = e >> 1;
            let height = t >> 1;
            (this.smallBlurRadiusTex = new THREE.WebGLRenderTarget(width, height, options)),
                (this.smallBlurRadiusTex2 = new THREE.WebGLRenderTarget(width, height, options)),
                (width = e >> 2),
                (height = t >> 2),
                (this.largeBlurRadiusTex = new THREE.WebGLRenderTarget(width, height, options)),
                (this.smallBlurRadiusTex.texture.generateMipmaps = false),
                (this.largeBlurRadiusTex.texture.generateMipmaps = false);
        }
    }
}

class RenderTargetInjector {
    static Type = {
        FINAL_COMPOSE: 'FINAL_COMPOSE',

        DEPTH_MAP: 'DEPTH_MAP',
        SHADOW_MAP: 'SHADOW_MAP',
        SHADOW_MAP_BLUR: 'SHADOW_MAP_BLUR',
        SSS: 'SSS',
        SSS_BLUR: 'SSS_BLUR',

        SKIN_SSS: 'SKIN_SSS',
        SKIN_TRANSMISSION: 'SKIN_TRANSMISSION',
        SKIN_SHADOWDIFFUSE: 'SKIN_SHADOWDIFFUSE',

        SKIN_FINAL: 'SKIN_FINAL',
    };

    constructor() {
        this.render_type = RenderTargetInjector.Type.FINAL_COMPOSE;

        this.skin_material = null;
        this.enabled = false;
        document.addEventListener('keyup', this._onKeyUp.bind(this), { passive: false });
    }

    _onKeyUp(event) {
        if (!this.enabled) return;

        switch (event.keyCode) {
            case 48 + 0:
            case 96 + 0:
                this.render_type = RenderTargetInjector.Type.FINAL_COMPOSE;
                if (this.skin_material) this.skin_material.uniforms.return_stage.value = 0;
                break;

            case 48 + 1:
            case 96 + 1:
                this.render_type = RenderTargetInjector.Type.DEPTH_MAP;
                break;
            case 48 + 2:
            case 96 + 2:
                this.render_type = RenderTargetInjector.Type.SHADOW_MAP;
                break;
            case 48 + 3:
            case 96 + 3:
                this.render_type = RenderTargetInjector.Type.SHADOW_MAP_BLUR;
                break;
            case 48 + 4:
            case 96 + 4:
                this.render_type = RenderTargetInjector.Type.SSS;
                break;
            case 48 + 5:
            case 96 + 5:
                this.render_type = RenderTargetInjector.Type.SSS_BLUR;
                break;

            case 48 + 6:
            case 96 + 6:
                this.render_type = RenderTargetInjector.Type.SKIN_SSS;
                if (this.skin_material) this.skin_material.uniforms.return_stage.value = 1;
                break;
            case 48 + 7:
            case 96 + 7:
                this.render_type = RenderTargetInjector.Type.SKIN_TRANSMISSION;
                if (this.skin_material) this.skin_material.uniforms.return_stage.value = 2;
                break;
            case 48 + 8:
            case 96 + 8:
                this.render_type = RenderTargetInjector.Type.SKIN_SHADOWDIFFUSE;
                if (this.skin_material) this.skin_material.uniforms.return_stage.value = 3;
                break;

            default:
                this.render_type = RenderTargetInjector.Type.SKIN_FINAL;
                if (this.skin_material) this.skin_material.uniforms.return_stage.value = 0;
        }

    }
}

class HairMaterial extends THREE.ShaderMaterial {
    constructor(parameters) {
        const defines = { MIN_VARIANCE: -1e-4, LIGHT_BLEED_REDUCTION: 0.5, USE_TANGENT: true };
        const uniforms = {
            diffuseMap: { value: null },
            alphaMap: { value: null },
            alpha_test: { value: 0.5 },
            normalMap: { value: null },
            irradianceMap: { value: parameters.irradianceMap },
            specularMap: { value: parameters.specularMap },
            shadowMapMatrix: { value: null },
            shadowMap: { value: null },
            roughnessMap: { value: null },

            specular_map: { value: null },
            scatter_map: { value: null },

            tangent_shift_0: { value: 0.2 },
            specular_exp_0: { value: 100 },
            tangent_shift_1: { value: 0 },
            specular_exp_1: { value: 50 },
        };

        const uniforms_with_lights = THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]);
        super({
            uniforms: uniforms_with_lights,
            defines,
            lights: true,
            vertexShader: ShaderLibrary.get('hair_vertex'),
            fragmentShader: ShaderLibrary.getInclude('include_beckmann') + ShaderLibrary.get('hair_fragment'),
        });
        // super({ uniforms: uniforms_with_lights, defines: defines, lights: true, vertexShader: ShaderLibrary.get("hair_vertex"), fragmentShader: ShaderLibrary.getInclude("include_ggx") + ShaderLibrary.get("hair_fragment") });

        this.isHairMaterial = true;
        this.type = 'HairMaterial';

        // this.onBeforeCompile = (shader) => {
        //     shader.defines.USE_TANGENT = "1";
        //     console.log(shader);
        // }

        this.side = THREE.DoubleSide;
        // this.transparent = true;
        // this.depthTest = false;
        // this.depthWrite = false;

        if (this.transparent) {
            this.uniforms.alpha_test.value = 0;
        }

        this._shadowRenderer = parameters.shadowRenderer;
        this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this);
    }

    _onShadowUpdate() {
        this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix;
        this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap;
    }
}

class MaterialOverrider {
    constructor() {
        this.face_mesh = null;
        this.hair_mesh = null;
        this.skybox_mesh = null;

        this.override_setting = {
            depth: {
                face: null,
                hair: null,
            },
            shadow: {
                face: null,
                hair: null,
            },
            sss: {
                face: null,
                hair: null,
            },
        };

        this.material_face = null;
        this.material_hair = null;
        this.skybox_hair = null;
        this.type = null;
    }

    override(type) {
        if (type in this.override_setting) {
            this.material_face = this.face_mesh.material;
            if (this.override_setting[type].face) {
                this.face_mesh.material = this.override_setting[type].face;
            }

            this.material_skybox = this.skybox_mesh.material;
            if (this.override_setting[type].face) {
                this.skybox_mesh.material = this.override_setting[type].face;
            }

            this.material_hair = this.hair_mesh.material;
            if (this.override_setting[type].hair) {
                this.hair_mesh.material = this.override_setting[type].hair;
            } else {
                this.hair_mesh.visible = false;
            }
        } else {
            throw `unknown override type ${type}`;
        }
        this.type = type;
    }

    unoverride() {
        const { type } = this;
        if (!this.override_setting[type].hair) {
            // this.hair_mesh.visible = true;
        }

        this.face_mesh.material = this.material_face;
        this.skybox_mesh.material = this.material_skybox;
        this.hair_mesh.material = this.material_hair;

        this.material_face = null;
        this.material_skybox = null;
        this.material_hair = null;
        this.type = null;
    }
}

const CameraMode = {
    ORBIT: 0,
    FIXED: 1,
    FIXED2ORBIT: 2,
    MAX: 3,
};

function intrinsic_to_fov(intrinsic) {
    const focalLengthX = intrinsic[0][0];
    const focalLengthY = intrinsic[1][1];
    const fov = 2 * Math.atan(512 / (2 * focalLengthY)) / Math.PI * 180;
    return fov;
}

function matrixWorldInverse_to_extrinsic_matrix(matrixWorldInverse) {
    return new THREE.Matrix4().makeRotationX(-Math.PI).multiply(matrixWorldInverse);
}

function extrinsic_matrix_to_matrixWorldInverse(extrinsic_matrix) {
    return new THREE.Matrix4().makeRotationX(Math.PI).multiply(extrinsic_matrix);
}

function blendRotationMatrices(matrix1, matrix2, alpha) {
    // Convert the rotation matrices to quaternions
    const quat1 = new THREE.Quaternion().setFromRotationMatrix(matrix1);
    const quat2 = new THREE.Quaternion().setFromRotationMatrix(matrix2);

    // Slerp (spherical linear interpolation) between the two quaternions
    const blendedQuat = quat1.slerp(quat2, alpha);

    // Convert the blended quaternion back to a rotation matrix
    const blendedMatrix = new THREE.Matrix4().makeRotationFromQuaternion(blendedQuat);

    return blendedMatrix;
}

function InterpEaseInOut(A, B, Alpha, Exp) {
    function InterpEaseIn(A, B, Alpha, Exp) {
        return (B - A) * Alpha ** Exp + A;
    }

    function InterpEaseOut(A, B, Alpha, Exp) {
        return (B - A) * (1 - (1 - Alpha) ** Exp) + A;
    }

    function Lerp(A, B, Alpha) {
        return (1 - Alpha) * A + Alpha * B;
    }

    if (Alpha < 0.5) {
        const easedIn = InterpEaseIn(0, 1, Alpha * 2, Exp) * 0.5;
        return Lerp(A, B, easedIn);
    }
    const easedOut = InterpEaseOut(0, 1, Alpha * 2 - 1, Exp) * 0.5 + 0.5;
    return Lerp(A, B, easedOut);
}

const global_material_overrider = new MaterialOverrider();
const global_render_target_injector = new RenderTargetInjector();

export {
    CenteredGaussianCurve,
    FloatTex,
    DoubleBufferTexture,
    RectRenderer,
    Signal,
    Skybox,
    OrbitController,
    Entity,
    verifyExtension,
    VSMMaterial,
    SceneDepthRenderer,
    VSMShadowRenderer,
    SSSProfile,
    SSSRenderer,
    DepthOfFieldPass,
    isPlatformMobile,
    QueryString,
    debugMode,
    global_render_target_injector,
    RenderTargetInjector,
    key_dispose,
    highPerformance,
    HairMaterial,
    global_material_overrider,
    CameraMode,
    intrinsic_to_fov,
    matrixWorldInverse_to_extrinsic_matrix,
    extrinsic_matrix_to_matrixWorldInverse,
    blendRotationMatrices,
    InterpEaseInOut,
};
