import * as THREE from 'three149';
import { OBJLoader } from 'three149/addons/loaders/OBJLoader.js';
import { RGBELoader } from 'three149/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three149/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three149/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three149/addons/postprocessing/ShaderPass.js';
import { ColorCorrectionShader } from 'three149/addons/shaders/ColorCorrectionShader.js';
import * as BufferGeometryUtils from 'three149/addons/utils/BufferGeometryUtils.js';
import { ShaderLibrary } from './shader_library.js';

import {
    blendRotationMatrices,
    CameraMode,
    DepthOfFieldPass,
    Entity,
    extrinsic_matrix_to_matrixWorldInverse,
    FloatTex,
    global_material_overrider,
    global_render_target_injector,
    HairMaterial,
    highPerformance,
    InterpEaseInOut,
    intrinsic_to_fov,
    key_dispose,
    matrixWorldInverse_to_extrinsic_matrix,
    OrbitController,
    RenderTargetInjector,
    SceneDepthRenderer,
    Skybox,
    SSSProfile,
    SSSRenderer,
    VSMShadowRenderer,
} from './utils.js';
import { FXAAToneMapShader } from './shader_parameters.js';
import * as Sentry from "@sentry/react";

const assets_profile_static = {
    roughness_detail: '/assets/juanfu/roughness-detail.jpg',
    env_irradiance: '/assets/env/lapa_4k_panorama_irradiance.hdr',
    env_specular: '/assets/env/lapa_4k_panorama_specular.hdr',
    roughness_ao_thickness: '/assets/juanfu/at.png',
};

class PersistentAssetsLibrary {
    constructor() {
    }

    get(key) {
        const self = this;
        if (self[key] === void 0) {
            console.info(`[ get undefined ] ${key}`);
        }
        return self[key];
    }

    load_assets(profile, callback, project) {
        const self = this;
        function on_progress(xhr) {
        }
        function on_error(err) {
            console.error(err);
        }

        function on_load_obj(obj) {
            self[this.key] = obj?.children[0]?.geometry;
            if (self[this.key]) {
                console.info(`[ loaded ] ${this.key}`);
                on_load_all(loading);
            } else{
                console.error(`[ load failed ] ${this.key}`);
            }
        }

        function on_load_tex(tex) {
            if (this.key == 'diffuse' || this.key == 'hair_diffuse' || this.key == "HEROdiffuse") {
                tex.encoding = THREE.sRGBEncoding;
            }
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.minFilter = THREE.LinearMipMapLinearFilter;
            if (this.postfix == 'hdr') {
                tex.minFilter = THREE.LinearFilter;
            }
            tex.magFilter = THREE.LinearFilter;
            highPerformance && (tex.anisotropy = 16);
            self[this.key] = tex;
            console.info(`[ loaded ] ${this.key}`);

            on_load_all(loading);
        }

        const on_load_all = function (loading) {
            loading.length_current++;
            if (loading.length_current == loading.length_target) {
                console.info('[ loaded all ]');
                const keys = Object.keys(profile);
                if (project) this.update_assets(project, keys);
                if (callback) callback();
            }
        }.bind(this);

        const keys = Object.keys(profile);
        const loading = {
            length_target: keys.length,
            length_current: 0,
        };
        keys.forEach((key) => {
            const path = profile[key];
            let loader;
            let on_load;
            const postfix = path.split('.').pop();
            switch (key) {
                case "model":
                case "eyeballs":
                case "hair_cap":
                case "hair_mesh":
                case "HEROmodel":
                    loader = new OBJLoader();
                    on_load = on_load_obj;
                    break;

                case "roughness_detail":
                case "diffuse":
                case "normal":
                case "roughness_ao_thickness":
                case "roughness":
                case "cap_diffuse":
                case "cap_normal":

                case "cap_alpha":
                case "cap_specular":
                case "hair_diffuse":
                case "hair_alpha":
                case "hair_normal":
                case "hair_roughness":
                case "hair_specular":
                case "hair_scatter":

                case "iris_diffuse":
                case "iris_ao":
                case "eye_normal":
                case "eyesclera_diffuse":
                case "eyesclera_normal":
                case "eyeveins_diffuse":
                case "TilingNoise":
                case "bakein":
                case "HEROdiffuse":
                case "HEROnormal":

                    loader = new THREE.TextureLoader();
                    on_load = on_load_tex;
                    break;

                case "env_irradiance":
                case "env_specular":
                case "eye_mid_plane_displacement":
                    loader = new RGBELoader();
                    on_load = on_load_tex;
                    break;

                default:
                    throw `${key} does not have corresponding loader`;
            }
            loader.load(
                path,
                on_load.bind({ key, path, postfix }),
                on_progress.bind({ key, path, postfix }),
                on_error,
            );
        });
    }

    update_assets(project, keys) {
        keys = keys || [
            'model',
            'diffuse',
            'normal',
            'roughness_ao_thickness',
            'roughness',
        ];
        keys.forEach((key) => {
            let asset = this.get(key);
            if (asset) {
                switch (key) {
                    case "model":
                        if (project.content.face_mesh.geometry) project.content.face_mesh.geometry.dispose();
                        project.content.face_mesh.geometry = asset;
                        break;
                    case "diffuse":
                        project.content.sssMaterialOptions.diffuseMap = asset;
                        project.content.skinMaterial.uniforms.diffuseMap.value = asset;
                        break;
                    case "normal":
                        project.content.sssMaterialOptions.normalMap = asset;
                        project.content.skinMaterial.uniforms.normalMap.value = asset;
                        project.content.sssRenderer._material.uniforms.normalMap.value = asset;
                        break;
                    case "roughness_ao_thickness":
                        project.content.sssMaterialOptions.roughnessAOThicknessMap = asset;
                        project.content.skinMaterial.uniforms.roughnessAOThicknessMap.value = asset;
                        break;
                    case "roughness":
                        project.content.sssMaterialOptions.roughnessMap = asset;
                        project.content.skinMaterial.uniforms.roughnessMap.value = asset;
                        break;


                    case "hair_mesh":
                        if (project.content.hair_mesh.geometry) project.content.hair_mesh.geometry.dispose();

                        asset = BufferGeometryUtils.mergeVertices(asset);
                        asset.computeTangents();

                        project.content.hair_mesh.geometry = asset;
                        break;
                    case "hair_diffuse":
                        project.content.hair_material.uniforms.diffuseMap.value = asset;
                        break;
                    case "hair_alpha":
                        project.content.hair_material.uniforms.alphaMap.value = asset;
                        project.content.depthRenderer._hair_depthMaterial.uniforms.alphaMap.value = asset;
                        project.content.shadowRenderer._hair_vsmMaterial.uniforms.alphaMap.value = asset;
                        break;
                    case "hair_normal":
                        project.content.hair_material.uniforms.normalMap.value = asset;
                        break;
                    case "hair_roughness":
                        project.content.hair_material.uniforms.roughnessMap.value = asset;
                        break;
                    case "hair_specular":
                        project.content.hair_material.uniforms.specular_map.value = asset;
                        break;
                    case "hair_scatter":
                        project.content.hair_material.uniforms.scatter_map.value = asset;
                        break;

                    case "hair_cap":
                        project.content.cap_mesh.geometry = asset;
                        break;
                    case "cap_diffuse":
                        project.content.cap_material.uniforms.diffuseMap.value = asset;
                        break;
                    case "cap_normal":
                        project.content.cap_material.uniforms.normalMap.value = asset;
                        break;
                    case "cap_alpha":
                        project.content.cap_material.uniforms.alphaMap.value = asset;
                        project.content.depthRenderer._hair_depthMaterial.uniforms.alphaMap.value = asset;
                        project.content.shadowRenderer._hair_vsmMaterial.uniforms.alphaMap.value = asset;
                        break;
                    case "cap_specular":
                        project.content.cap_material.uniforms.specular_map.value = asset;
                        break;


                    case "eyeballs":
                        if (project.content.eyeball_mesh.geometry) project.content.eyeball_mesh.geometry.dispose();

                        asset = BufferGeometryUtils.mergeVertices(asset);
                        asset.computeTangents();

                        project.content.eyeball_mesh.geometry = asset;
                        break;
                    case "iris_diffuse":
                        project.content.eyeball_material.uniforms.iris_diffuse.value = asset;
                        break;
                    case "iris_ao":
                        project.content.eyeball_material.uniforms.iris_ao.value = asset;
                        break;
                    case "eye_normal":
                        //project.content.eyeball_material.uniforms.eye_normal.value = asset;
                        project.content.eyeball_material.uniforms.normalMap.value = asset;
                        break;
                    case "eyesclera_diffuse":
                        project.content.eyeball_material.uniforms.eyesclera_diffuse.value = asset;
                        break;
                    case "eyesclera_normal":
                        project.content.eyeball_material.uniforms.eyesclera_normal.value = asset;
                        break;
                    case "eyeveins_diffuse":
                        project.content.eyeball_material.uniforms.eyeveins_diffuse.value = asset;
                        break;
                    case "TilingNoise":
                        project.content.eyeball_material.uniforms.TilingNoise.value = asset;
                        break;
                    case "eye_mid_plane_displacement":
                        project.content.eyeball_material.uniforms.eye_mid_plane_displacement.value = asset;
                        break;
                    case "bakein":
                        project.content.eyeball_material.uniforms.diffuseMap.value = asset;
                        //project.content.eyeball_material.setValues({map:asset});
                        break;
                    case "HEROdiffuse":
                        project.content.HEROmat.uniforms.diffuseMap.value = asset;
                        break;
                    case "HEROnormal":
                        project.content.HEROmat.uniforms.normalMap.value = asset;
                        break;
                    case "HEROmodel":
                        if (project.content.hero_mesh.geometry) project.content.hero_mesh.geometry.dispose();
                        asset = BufferGeometryUtils.mergeVertices(asset);
                        asset.computeTangents();

                        project.content.hero_mesh.geometry = asset;
                        break;
                }
            }
        });
    }
}

const assets_library = new PersistentAssetsLibrary();

// use light, beckmann
class SkinMaterial extends THREE.ShaderMaterial {
    constructor(parameters) {
        const defines = { MIN_VARIANCE: 1e-4, LIGHT_BLEED_REDUCTION: 0.1 };
        parameters.shadowRenderer.floatTexture && (defines.VSM_FLOAT = 1); //是否启用 floatTexture
        const uniforms = {
            sssMap: { value: null },
            transmittanceColor: { value: new THREE.Color(50, 150, 250) },
            sssTopLayerColor: { value: parameters.sssProfile.getBlendColor(0) },
            diffuseMap: { value: parameters.diffuseMap },
            normalMap: { value: parameters.normalMap },
            roughnessAOThicknessMap: { value: parameters.roughnessAOThicknessMap },
            roughnessMap: { value: parameters.roughnessMap },
            irradianceMap: { value: parameters.irradianceMap },
            specularMap: { value: parameters.specularMap },
            shadowMap: { value: parameters.shadowRenderer.shadowMap },
            shadowMapMatrix: { value: parameters.shadowRenderer.shadowMapMatrix },
            probeExposure: {
                value: 2 ** (void 0 === parameters.probeExposure ? 0 : parameters.probeExposure),
            },
            normalSpecularReflectance: { value: 0.027 },
            thicknessRange: { value: parameters.thicknessRange || 0.1 },
            roughnessMapRange: {
                value:
                    void 0 === parameters.roughnessMapRange
                        ? 0.5
                        : parameters.roughnessMapRange,
            },
            roughnessMedian: {
                value:
                    void 0 === parameters.roughnessMedian
                        ? 0.65
                        : parameters.roughnessMedian,
            },
            roughnessDetailMap: { value: parameters.roughnessDetailMap },
            roughnessDetailRange: { value: 0.8 },
            specular_intensity: { value: 0.7 },

            return_stage: { value: 0 },
        };

        // 将 uniforms 合并
        const uniforms_with_lights = THREE.UniformsUtils.merge([
            uniforms,
            THREE.UniformsLib.lights,
        ]);
        super({
            uniforms: uniforms_with_lights, // 使用合并后的 uniforms
            defines,
            lights: true, // 启用光照
            vertexShader: ShaderLibrary.get('skin_vertex'),
            fragmentShader:
                ShaderLibrary.getInclude('include_beckmann')
                + ShaderLibrary.get('skin_fragment'),
        });

        this.isSkinMaterial = true;
        this.type = 'SkinMaterial';

        this.uniforms.diffuseMap.value = parameters.diffuseMap;
        this.uniforms.normalMap.value = parameters.normalMap;
        this.uniforms.roughnessAOThicknessMap.value = parameters.roughnessAOThicknessMap;
        this.uniforms.roughnessMap.value = parameters.roughnessMap;
        this.uniforms.roughnessDetailMap.value = parameters.roughnessDetailMap;
        this.uniforms.irradianceMap.value = parameters.irradianceMap;
        this.uniforms.specularMap.value = parameters.specularMap;
        this.uniforms.shadowMap.value = parameters.shadowRenderer.shadowMap;

        this.uniforms.return_stage.value = 0;
        global_render_target_injector.skin_material = this;

        this.extensions.derivatives = true;
        this._shadowRenderer = parameters.shadowRenderer;
        this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this);
    }

    _onShadowUpdate() {
        this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix;
        this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap;
    }
}

//HERO-Style
class HeroMaterial extends THREE.ShaderMaterial {
    constructor(options = {}) {
        const {
            diffuseMap = null,
            mainLightPosition = new THREE.Vector3(),
            lightColor = new THREE.Color(1, 1, 1),
            ambientColor = new THREE.Color(0.2, 0.2, 0.2),
            normalMap = null,
            shadowMap = null,
            shadowBias = 0,
        } = options;

        super({
            uniforms: {
                diffuseMap: { value: diffuseMap },
                pointLightPosition: { value: mainLightPosition },
                lightColor: { value: lightColor },
                ambientColor: { value: ambientColor },
                normalMap: { value: normalMap },
                shadowMap: { value: shadowMap },
                shadowBias: { value: shadowBias },
            },
            vertexShader: ShaderLibrary.get('Stylized_vertex'),
            fragmentShader: ShaderLibrary.get('Stylized_fragment'),
        });
    }
}

class SimpleThreeProject {
    #camera_mode = CameraMode.ORBIT;

    constructor(renderer_parameters) {
        this.is_running = false;
        this.clock = new THREE.Clock();
        // renderer
        this.renderer = new THREE.WebGLRenderer();
        const e = window.devicePixelRatio;
        this.renderer.setPixelRatio(e); //设置设备像素比。通常用于避免HiDPI设备上绘图模糊
        this.options = renderer_parameters.options
        // container
        this.container = renderer_parameters.webglContainer
        if (!this.container) {
            throw new Error("Container element does not exist. Terminating process...");
        }
        this.container.appendChild(this.renderer.domElement);

        // scene
        this.scene = new THREE.Scene();

        // camera
        this.camera = new THREE.PerspectiveCamera(
            46.4,
            this.container.clientWidth / this.container.clientHeight,
            0.01,
            100,
        );
        this.camera.position.z = 100;
        this.scene.add(this.camera);

        this.camera_shadow = this.camera.clone(); //clone一个相机
        this.camera.matrixAutoUpdate = false;
        this.camera.updateMatrixWorld = () => { };
        this.content = new SSSSSContent(this);

        // orbit control
        const orbit = new OrbitController(this.container);
        orbit.lookAtTarget.z = 0.03;
        orbit.radius = 0.3;
        orbit.minRadius = 0.05;
        orbit.maxRadius = 0.3;
        orbit.zoomSpeed = 0.05;
        orbit.mouse_constant = 0.0002;
        // orbit.mouse_constant = 0.0008;
        Entity.addComponent(this.camera_shadow, orbit);
        this.orbit = orbit;

        // resize
        const project = this;
        this.resize_handler = function () {
            this.need_resize = true;
        };
        window.addEventListener('resize', this.resize_handler, { passive: false });
        this._resizeCanvas();

        // 解决浏览器大小改变resize问题
        this.need_resize = false;
        setInterval(() => {
            this.resize_handler();
        }, 4000);

    }

    get camera_mode() {
        return this.#camera_mode;
    }

    set camera_mode(mode) {
        this.#camera_mode = mode;
    }

    _resizeCanvas() {
        if (this.renderer) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            if (width === 0 || height === 0) return;
            // renderer
            this.renderer.setSize(width, height);
            this.renderer.domElement.style.width = `${width}px`;
            this.renderer.domElement.style.height = `${height}px`;

            // camera
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            // content
            this.content && this.content.resize(width, height);
        }
    }

    resizeCanvas() {
        this.renderer.domElement.style.borderRadius = '16px';
        this.renderer.domElement.style.position = 'absolute'
    }

    stop() {
        this.is_running = false;
    }

    start() {
        this.is_running = true;
        this._requestAnimationFrame();
    }

    _render() {
        if (this.is_running) {
            if (this.need_resize) {
                this._resizeCanvas();
                this.need_resize = false;
            }
            const time_delta = this.clock.getDelta() * 1000;
            this._requestAnimationFrame();
            Entity.ENGINE.update(time_delta);
            this.update_camera();// 必须在更新实体后更新相机
            this.content && this.content.update(time_delta);

            if (global_render_target_injector.render_type.startsWith('SKIN_')) {
                this.renderer.render(this.scene, this.camera);
            }

            if (
                global_render_target_injector.render_type
                === RenderTargetInjector.Type.FINAL_COMPOSE
            ) {
                this.content && this.content.effectComposer
                    ? this.content.effectComposer.render(time_delta / 1e3)
                    : this.renderer.render(this.scene, this.camera);
            }

            // this._stats && (this._renderStats.update(this.renderer), this._stats.update());
            // this._stats && (this._stats.update());
            // if (window.stats) window.stats.update();

            const current_position = this.content.face_mesh.position;
            const scale = 0.5 ** (time_delta / 100);
            const next_position = new THREE.Vector3(
                current_position.x * scale,
                current_position.y * scale,
                current_position.z * scale,
            );
            this.content.face_mesh.position.set(
                next_position.x,
                next_position.y,
                next_position.z,
            );
            this.content.hero_mesh.position.set(
                next_position.x,
                next_position.y,
                next_position.z,
            );

        }
    }

    _requestAnimationFrame() {
        const project = this;
        requestAnimationFrame(() => {
            project._render();
        });
    }

    dispose() {
        this.containerNaNpxoveChild(this.renderer.domElement);
        key_dispose(this);
    }

    hide_scene() {
        const project = this;
        project.content.face_mesh.visible = false;
        project.content.hair_mesh.visible = false;
        project.content.hero_mesh.visible = false;
        project.orbit._coords.set(
            (Math.random() * 0.4 + 0.3) * Math.PI,
            (Math.random() * 0.2 + 0.3) * Math.PI,
            2,
        );
    }

    show_scene() {
        const project = this;
        if (['us-comic', 'cartoon'].includes(project.options)) {
            project.content.face_mesh.visible = false;
            project.content.hero_mesh.visible = true;
            project.content.hero_mesh.position.set(0.5, 0, 0);
        } else {
            project.content.hero_mesh.visible = false;
            project.content.face_mesh.visible = true;
            project.content.face_mesh.position.set(0.5, 0, 0);
        }
        project.content.hair_mesh.visible = false;
        project.resize_handler();
    }

    clean_scene() {
        const project = this;
        if (project.content.face_mesh.geometry) {
            project.content.face_mesh.geometry.dispose();
        }
        project.content.face_mesh.geometry = new THREE.BufferGeometry();
    }

    update_scene(parameters, key) {
        //simple project part
        if (parameters.scene_option.camera.fov) {
            this.camera.fov = parameters.scene_option.camera.fov;
        }

        //light\skybox and others are defined in static_project.content
        if (parameters.scene_option.light.intensity) {
            this.content.mainLight.intensity = parameters.scene_option.light.intensity;
        }

        if (parameters.scene_option.skybox) {
            load_profile(parameters.scene_option.skybox)
            this.content.skybox = new Skybox(assets_library.get("env_specular"), 30, this.probeExposure)
        }

        if (parameters.face_option) {

            if (key == "HERO") {
                this.content.face_mesh.visible = false;
                this.content.hero_mesh.visible = true;
                load_profile(parameters.face_option.profile);
            } else if (key == "SSS") {
                this.content.face_mesh.visible = true;
                this.content.hero_mesh.visible = false;
                load_profile(parameters.face_option.profile);
            }

            if (parameters.face_option.parameters) {
                ;//make other changes
            }
        }
    }

    _update_fov(fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }

    _update_extrinsic(extrinsic_matrix) {
        this.camera.matrixWorldInverse.copy(
            extrinsic_matrix_to_matrixWorldInverse(extrinsic_matrix),
        );
    }

    update_camera_from_calibration_matrix(intrinsic, extrinsic) {
        this.blend_time = 1000;
        this.blend_start = Date.now();

        this.extrinsic_source = matrixWorldInverse_to_extrinsic_matrix(
            this.camera.matrixWorldInverse,
        );
        this.fov_source = this.camera.fov;

        if (intrinsic && extrinsic) {
            const fuck_scale = 0.005;
            const extrinsic_matrix = new THREE.Matrix4().set(
                extrinsic[0][0],
                extrinsic[0][1],
                extrinsic[0][2],
                extrinsic[0][3] * fuck_scale,
                extrinsic[1][0],
                extrinsic[1][1],
                extrinsic[1][2],
                extrinsic[1][3] * fuck_scale,
                extrinsic[2][0],
                extrinsic[2][1],
                extrinsic[2][2],
                extrinsic[2][3] * fuck_scale,
                0.0,
                0.0,
                0.0,
                1.0,
            );

            this.extrinsic_target = extrinsic_matrix;
            this.fov_target = intrinsic_to_fov(intrinsic);

            this.camera_mode = CameraMode.FIXED;
        } else if (this.camera_mode == CameraMode.FIXED) {
            this.extrinsic_target = null;
            this.fov_target = this.camera_shadow.fov;

            this.camera_mode = CameraMode.FIXED2ORBIT;
        }
    }

    update_camera() {
        this.camera_shadow.updateProjectionMatrix();
        this.camera_shadow.updateMatrix();
        this.camera_shadow.updateMatrixWorld(true);

        let extrinsic_target = null;

        switch (this.camera_mode) {
            case CameraMode.ORBIT:
                this.camera.matrixWorldInverse.copy(
                    this.camera_shadow.matrixWorldInverse,
                );
                this.camera.projectionMatrix.copy(this.camera_shadow.projectionMatrix);

                break;

            case CameraMode.FIXED2ORBIT:
                extrinsic_target = matrixWorldInverse_to_extrinsic_matrix(
                    this.camera_shadow.matrixWorldInverse,
                );
            case CameraMode.FIXED:
                extrinsic_target = extrinsic_target || this.extrinsic_target;

                const now = Date.now();
                let percent = (now - this.blend_start) / this.blend_time;
                if (percent >= 1 && this.camera_mode == CameraMode.FIXED2ORBIT) {
                    this.camera_mode = CameraMode.ORBIT;
                }
                if (percent > 1) percent = 1;
                if (!this.blend_time || percent < 0 || percent > 1) return;

                percent = InterpEaseInOut(0, 1, percent, 2);

                const fov = ((Math.atan(
                    1
                    / ((1 / Math.tan((this.fov_source / 2 / 180) * Math.PI))
                        * (1 - percent)
                        + (1 / Math.tan((this.fov_target / 2 / 180) * Math.PI)) * percent),
                )
                    * 2)
                    / Math.PI)
                    * 180;
                this._update_fov(fov);

                const extrinsic = blendRotationMatrices(
                    this.extrinsic_source,
                    extrinsic_target,
                    percent,
                );
                extrinsic.setPosition(
                    new THREE.Vector3()
                        .setFromMatrixPosition(this.extrinsic_source)
                        .multiplyScalar(1 - percent)
                        .add(
                            new THREE.Vector3()
                                .setFromMatrixPosition(extrinsic_target)
                                .multiplyScalar(percent),
                        ),
                );

                this._update_extrinsic(extrinsic);

                break;

            default:
                break;
        }

        const fuck_scale = 0.005;
        const zfront = fuck_scale * 20;
        const zback = -2;
        const znear = zfront + this.camera.matrixWorldInverse.elements[14];
        const zfar = zback + this.camera.matrixWorldInverse.elements[14];
        const far = -zfar;
        let near = -znear;

        near = Math.max(near, 0.001);
        this.camera.near = near;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();
    }

    lock_lights(lockFlag) {
        const project = this;
        this.lightLock = lockFlag
    }
}

// init shadowRenderer
// init depthRenderer
// init sssprofile
// init camera controller
// init directional lights and add to scene
// init skybox, SkinMaterial, geometry+skinmaterial
class SSSSSContent {
    constructor(project) {
        console.info('---SSSSSContent render---');
        this.animateLight = true;
        this.probeExposure = 0;
        this.time = 0;
        this.shadowsInvalid = true;
        //从传入的项目实例中获取渲染器、场景和相机
        this.renderer = project.renderer;
        this.scene = project.scene;
        this.camera = project.camera;
        this.options = project.options;
        this.camera_shadow = project.camera_shadow;
        this.container = project.container;

        // 创建一个缓冲
        this.render_target = new THREE.WebGLRenderTarget(1, 1, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: FloatTex.getHalfOrFloatOrAny(this.renderer),
            stencilBuffer: false,
        })
        // 创建效果合成器，并添加一些处理过程
        this.effectComposer = new EffectComposer(this.renderer, this.render_target);
        this.effectComposer.addPass(new RenderPass(this.scene, this.camera));

        //深度场景效果
        this.dof = new DepthOfFieldPass(
            this.camera,
            this.scene,
            null,
            FloatTex.getHalfOrFloatOrAny(this.renderer),
        );
        this.dof.focusPosition.set(0, 0, 0);
        this.dof.enabled = false;// 是否启用深度场景效果

        // this.dof.enabled = true;
        // this.dof.focusRange = 1;
        // this.dof.focusFalloff = 0.02;
        this.effectComposer.addPass(this.dof);

        // 添加抗锯齿处理过程
        this.fxaa = new ShaderPass(FXAAToneMapShader);
        this.fxaa.uniforms.whitePoint.value = 1.7;
        this.fxaa.renderToScreen = true;
        this.effectComposer.addPass(this.fxaa);

        // 添加颜色校正处理过程
        this.effectColor = new ShaderPass(ColorCorrectionShader);
        this.effectColor.uniforms.powRGB.value.set(1, 1, 1);
        // this.effectColor.uniforms['mulRGB'].value.set(0.95, 0.97, 1.05);
        this.effectColor.uniforms.mulRGB.value.set(0.95, 0.97, 1.02);
        this.effectComposer.addPass(this.effectColor);

        // sss profile // 子表面散射(SSS)配置
        this.sssProfile = new SSSProfile(256, 1.2);
        this.sssProfile.addLayer(0.0064, new THREE.Color(0.2405, 0.4474, 0.6157));
        this.sssProfile.addLayer(0.0452, new THREE.Color(0.1158, 0.3661, 0.3439));
        this.sssProfile.addLayer(
            0.2719 - 0.0516,
            new THREE.Color(0.1836, 0.1864, 0),
        );
        this.sssProfile.addLayer(2.0062 - 0.2719, new THREE.Color(0.46, 0, 0.0402));
        this.sssProfile.generate();

        // light
        let color = 16774638;
        color = 0xffffff;
        this.mainLight = new THREE.DirectionalLight(color, 0.5);
        this.mainLight.position.set(0, 0, 1);
        // this.mainLight.castShadow = true
        this.scene.add(this.mainLight);

        // shadow and depth
        this.shadowRenderer = new VSMShadowRenderer(
            this.scene,
            this.renderer,
            this.mainLight,
            2048,
        );
        this.depthRenderer = new SceneDepthRenderer(
            this.scene,
            this.camera,
            this.renderer,
            0.5,
        );
        // 子表面散射材料选项
        this.sssMaterialOptions = {
            diffuseMap: null,
            normalMap: null,
            roughnessAOThicknessMap: assets_library.get('roughness_ao_thickness'),
            roughnessMap: null,
            roughnessDetailMap: assets_library.get('roughness_detail'),
            irradianceMap: assets_library.get('env_irradiance'),
            specularMap: assets_library.get('env_specular'),
            sssProfile: this.sssProfile,
            probeExposure: this.probeExposure,
            shadowRenderer: this.shadowRenderer,
        };

        // 子表面散射渲染器
        this.sssRenderer = new SSSRenderer(
            this.scene,
            this.camera,
            this.renderer,
            this.depthRenderer,
            this.sssMaterialOptions,
            0.5,
        );

        // skybox
        this.skybox = new Skybox(
            assets_library.get('env_specular'),
            2,
            this.probeExposure,
        );
        this.camera.add(this.skybox);

        // mesh
        // let face_geometry = assets_library.get("model");
        this.skinMaterial = new SkinMaterial(this.sssMaterialOptions);

        this.face_mesh = new THREE.Mesh(undefined, this.skinMaterial);
        this.face_mesh.name = 'face_mesh'
        this.face_mesh.scale.set(0.005, 0.005, 0.005);
        this.face_mesh.visible = (!['us-comic', 'cartoon'].includes(this.options))
        this.scene.add(this.face_mesh);
        this.shadowRenderer.constrain(this.face_mesh);// 阴影渲染器约束面部网格

        //hair暂时不用
        this.hair_material = new HairMaterial(this.sssMaterialOptions);
        this.hair_mesh = new THREE.Mesh(undefined, this.hair_material);
        this.hair_mesh.name = 'hair_mesh'
        this.hair_mesh.renderOrder = 1;
        this.hair_mesh.scale.set(0.005, 0.005, 0.005);
        this.hair_mesh.visible = false
        this.scene.add(this.hair_mesh);

        this.HEROmat = new HeroMaterial({
            mainLightPosition: this.mainLight.position,
            shadowMap: this.shadowMap
        })

        this.hero_mesh = new THREE.Mesh(undefined, this.HEROmat);
        this.hero_mesh.name = 'hero_mesh'
        this.hero_mesh.scale.set(0.005, 0.005, 0.005);
        this.hero_mesh.renderOrder = 1;
        this.hero_mesh.visible = (['us-comic', 'cartoon'].includes(this.options))
        this.scene.add(this.hero_mesh);

        // 设置全局材质覆盖器
        global_material_overrider.face_mesh = this.face_mesh;
        global_material_overrider.skybox_mesh = this.skybox;
        global_material_overrider.hair_mesh = this.hair_mesh;
        global_material_overrider.hero_mesh = this.hero_mesh;
    }

    resize(width, height) {
        this.sssRenderer.resize(width, height);
        const r = window.devicePixelRatio || 1;
        width *= r;
        height *= r;

        // 调整抗锯齿处理器的分辨率
        this.fxaa
            && this.fxaa.uniforms.rcpRenderTargetResolution.value.set(
                1 / width,
                1 / height,
            );

        this.effectComposer.setSize(width, height);// 调整效果合成器尺寸
        this.depthRenderer.resize(width, height);// 调整深度渲染器尺寸
        this.dof.depthTexture = this.depthRenderer.texture;// 设置深度场景效果的深度纹理
    }

    update(time_delta) {
        if (this.animateLight) {
            this.time += time_delta;
            if (!window.static_project.lightLock) {
                this.mainLight.position.set(
                    // Math.cos(5e-4 * this.time), Math.sin(5e-4 * this.time), Math.sin(2e-4 * this.time)
                    Math.cos(5e-4 * this.time),
                    Math.sin(3e-4 * this.time) + 1.25,
                    Math.sin(2e-4 * this.time) + 1.2,
                );
            } else {
                this.mainLight.position.set(0, 0, 1)
            }
            this.shadowsInvalid = true;
        }
        this.depthRenderer.render();

        this.skybox.visible = false;
        if (this.shadowsInvalid) {
            this.shadowRenderer.render();
            this.shadowsInvalid = false;
        }
        this.sssRenderer.render();
        this.skinMaterial.uniforms.sssMap.value = this.sssRenderer.texture;
        this.skybox.visible = true;

        // directions to the camera
        // var t = 0.055,
        // 设置景深焦点位置
        const t = 0.01;
        const dx = this.camera.matrix.elements[8];
        const dy = this.camera.matrix.elements[9];
        const dz = this.camera.matrix.elements[10];
        this.dof.focusPosition.set(dx * t, dy * t, dz * t);
        const i = this.camera.position.length();
        // this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.002);
        this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.5);
        this.dof.focusFalloff = Math.max(2 * this.dof.focusRange, 0.008);
        // this.dof.focusFalloff = 0;
    }

    dispose() {
        EntityNaNpxoveComponent(this.camera, this.orbit);
        Entity.destroy(this.camera);
        Entity.ENGINE.update(1);
        key_dispose(this.sssMaterialOptions);
        key_dispose(this);
    }
}

let static_project;

function build_project(webglContainer, options, callback) {
    //load static assets
    assets_library.load_assets(assets_profile_static, () => {
        try {
            //Create a new three project
            static_project = new SimpleThreeProject({ webglContainer, options });
            static_project.start();
            window.static_project = static_project;
            if (callback) callback(); //show_scene
        } catch {
            Sentry.captureException()
            console.info("[ Terminated ]")
        }
    });
}

function load_profile(profile, options, webglContainer, callback) {
    if (!static_project) {
        build_project(webglContainer, options, () => assets_library.load_assets(profile, callback, static_project));
    } else assets_library.load_assets(profile, callback, static_project);
}

export {
    global_render_target_injector, build_project, load_profile,
};
