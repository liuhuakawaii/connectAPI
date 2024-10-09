import * as THREE from 'three149';
import gsap from "gsap";
import { OrbitControls } from './orbitControls';
import { RoundedBoxGeometry } from 'three149/addons/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three149/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three149/addons/math/MeshSurfaceSampler.js';
import { OBJExporter } from 'three149/examples/jsm/exporters/OBJExporter';

class ThreeController {
  constructor(options) {
    window.TCC = this
    this.name = options.name
    this.originMesh = null;
    this.initmodel = options.initmodel
    this.gui = null;
    this.renderTarget = options.renderTarget;
    this.boxParameters = options.meshParameters['bbox'].pos || { x: 100, y: 100, z: 100 };
    this.meshParameters = options.meshParameters
    this.modelType = options.modelType
    this.loadingcb = options.loadingcb
    this.tip = options.tip
    this.translation = options.translation
    this.voxels = options.meshParameters['voxel'].pos;
    this.points = options.meshParameters['pointCloud'].pos
    this.bboxCache = {
      originMesh: null,
      x: this.boxParameters.x,
      y: this.boxParameters.y,
      z: this.boxParameters.z,
      currentOrigin: 'upload'
    }
    this.voxelsCache = [{ name: 'my-cube', originMesh: null, instancedMesh: null, voxels: [] }]
    this.pointsCache = [{ name: 'my-point', originMesh: null, instancedMesh: null, points: [] }]
    this.isAnimation = true;
    this.pcdUncertainty = options.pcdUncertainty || 0.010;
    this.newVoxelIndex = 0
    this.newPointsIndex = 0
    this.oldVoxelIndex = 0
    this.oldPointsIndex = 0
    this.pointsTotalSum = options.sampling || 2048
    this.rayCaster = null
    this.dummy = null
    this.instancedMesh = null
    this.canResize = true
    this.exportOBJ = null
    this.openModal = options.openModal
    this.setMeshParameters = options.setMeshParameters
    this.handleQuitOrthCamera = options.handleQuitOrthCamera
    this.closePortal = options.closePortal
    this.fileLoaderMap = {
      'glb': () => import('three149/examples/jsm/loaders/GLTFLoader').then(module => new module.GLTFLoader()),
      'fbx': () => import('three149/examples/jsm/loaders/FBXLoader').then(module => new module.FBXLoader()),
      'gltf': () => import('three149/examples/jsm/loaders/GLTFLoader').then(module => new module.GLTFLoader()),
      'obj': () => import('three149/examples/jsm/loaders/OBJLoader').then(module => new module.OBJLoader()),
      'dae': () => import('three149/examples/jsm/loaders/ColladaLoader').then(module => new module.ColladaLoader()),
      'stl': () => import('three149/examples/jsm/loaders/STLLoader').then(module => new module.STLLoader()),
      'ply': () => import('three149/examples/jsm/loaders/PLYLoader').then(module => new module.PLYLoader()),
    };
    this.scaleInfo = {
      x: 1,
      y: 1,
      z: 1
    }

    this.mainScene = new SceneInitializer(options.renderTarget, this)
    this.boundingBox = new BoundingBox(this)

    this.transformer = new MeshTransformer(this);
    // PREDEFINED GEOMETRY AND MATERIAL

    this.pcdSphereGeometry = new THREE.SphereGeometry(0.01, 0.05, 0.05);

    // this.defaultMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    // this.bboxMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    // this.voxelMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    // this.pcdMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, emissive: 0x0000ff });

    console.log(options?.textureCache, 'options?.textureCache');
    // const textureLoader = new THREE.TextureLoader();
    this.defaultMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const matcapTexture = options?.textureCache['assets/env/basic_side.jpg'];
    this.bboxMaterial = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture?.clone()
    });
    this.voxelMaterial = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture?.clone(),
    });
    this.pcdMaterial = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec4 vWorldPosition;
      varying vec3 vCameraDirection;

      mat4 inverseModelViewMatrix() {
          mat3 rotationTranspose = transpose(mat3(modelViewMatrix));  // Extracts and transposes the top-left 3x3 part
          vec3 negTranslation = -rotationTranspose * modelViewMatrix[3].xyz;  // modelViewMatrix[3] contains the translation

          return mat4(
              vec4(rotationTranspose[0], 0.0),
              vec4(rotationTranspose[1], 0.0),
              vec4(rotationTranspose[2], 0.0),
              vec4(negTranslation, 1.0)
          );
      }

      void main() {
        vWorldPosition = instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);

        mat4 modelViewMatrixInv = inverseModelViewMatrix();
        vec3 cameraPosition = modelViewMatrixInv[3].xyz;

        // Compute the camera direction vector
        vCameraDirection = normalize(cameraPosition);
      }
      `,
      fragmentShader: `
      varying vec4 vWorldPosition;
      varying vec3 vCameraDirection;
      void main() {

        float mag = dot(vWorldPosition.xyz, vCameraDirection);
        mag = clamp(mag, -1.0, 1.0) * 0.5 + 0.5;

        float minBrightness = 0.5;
        float maxBrightness = 1.0;

        gl_FragColor = vec4(
          mag * ( maxBrightness - minBrightness ) + minBrightness,
          mag * ( maxBrightness - minBrightness ) + minBrightness,
          mag * ( maxBrightness - minBrightness ) + minBrightness,
          1.0
        );
      }
      `,
      side: THREE.DoubleSide
    });

  }

  //homepage init
  async homepageInit() {
    console.log('INIT:', this.modelType)
    if (this.modelType === 'bbox') {
      if (this.initmodel) {
        await this.loadModel(this.initmodel, 'bbox')
      } else {
        this.boundingBox.loadBasicBBox()
      }
      this.loadingcb && this.loadingcb()
      this.mainScene.adjustControlPos(this.modelType)
    } else if (this.modelType === 'voxel') {
      await this.createNewVoxels({ newIndex: 0 })
      await this.loadModel(this.initmodel, 'voxel')
    } else {
      await this.createNewPointCloud({ newIndex: 0 })
      await this.loadModel(this.initmodel, 'pointCloud')
    }
    this.mainScene.adjustCameraPos(this.modelType)
  }

  async homepageUpdateMesh(modelType, modelFile) {
    console.log('UPDATE:', modelType, modelFile);
    this.modelType = modelType;
    this.initmodel = modelFile
    if (this.isAnimation) return
    this.restoreData()
    if (modelType === 'bbox') {
      if (modelFile) {
        await this.loadModel(modelFile, 'bbox')
      } else {
        this.instancedMesh && (this.instancedMesh.visible = false)
        console.log('this.bboxCache', this.bboxCache);
        if (this.bboxCache.originMesh) {
          this.currentOrigin = this.bboxCache.currentOrigin
          this.originMesh = new THREE.Mesh(
            this.bboxCache.originMesh.geometry.clone(),
            this.bboxCache.originMesh.material.clone())
          this.originMesh.position.y = 0;
          this.currentObeject = this.bboxCache
          this.mainScene.scene.add(this.originMesh);
        } else {
          this.boundingBox.loadBasicBBox()
        }
      }
      this.originMesh.visible = true
      this.loadingcb && this.loadingcb()
      this.mainScene.adjustControlPos(this.modelType)
    } else if (modelType === 'voxel') {
      if (!this.voxelsCache[0].voxels.length) {
        await this.createNewVoxels({ newIndex: 0 })
      }
      await this.loadModel(modelFile, 'voxel')
    } else {
      if (!this.pointsCache[0].points.length) {
        await this.createNewPointCloud({ newIndex: 0 })
      }
      await this.loadModel(modelFile, 'pointCloud')
    }
    this.mainScene.adjustCameraPos(modelType)
  }
  //editor page init

  async editorpageInit() {
    await this.createNewVoxels({ newIndex: 0 }) //默认
    await this.createNewPointCloud({ newIndex: 0 })
    this.initModelByParameters()
    await this.editorpageUpdateMesh(this.modelType, this.initmodel)
  }

  initModelByParameters() {
    /**
     * init的时候：
     * 要把已经confirm的存好cache  以便update的时候查找
     * 
     * - 点击3d condition
     *    - 已经confirm/有cache
     *        - 直接展示对应的cache
     *    - 打开upload框
     *        - upload
     *              - bbox caculate出whl
     *              - voxel pcd  渲染
     *        - handcraft
     *              - bbox 一个100*100*100正方体
     *              - voxel pcd 跳转mesheditor
     * 注意file来源：可能是upload也可能是mesheditor
     */

    console.log('---EDITORPAGE initModelByParameters---', this.meshParameters);
    if (this.meshParameters.bbox.confirmed) {
      const bboxParam = this.meshParameters.bbox.pos
      const geometry = new THREE.BoxGeometry(bboxParam.x, bboxParam.y, bboxParam.z)
      this.bboxCache = {
        ...this.bboxCache,
        originMesh: new THREE.Mesh(geometry, this.bboxMaterial),
        x: bboxParam.x,
        y: bboxParam.y,
        z: bboxParam.z,
        file: null
      }
      console.log(this.bboxCache, 'bboxCache 缓存');
    }

    if (this.meshParameters.voxel.confirmed) {
      const voxelParam = this.meshParameters.voxel.pos
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        this.bboxMaterial);

      if (voxelParam.length) {
        const dummy = new THREE.Object3D()

        const instancedMesh = new THREE.InstancedMesh(
          new RoundedBoxGeometry(2 / 16, 2 / 16, 2 / 16, 2, 0.01),
          this.bboxMaterial,
          this.voxels.length
        )
        this.voxelsCache.push({
          name: 'init-voxel',
          originMesh: mesh,
          instancedMesh: instancedMesh,
          dummy: dummy,
          voxels: this.voxels.slice(),
          params: this.meshParameters.voxel.params,
          file: null
        })
        this.newVoxelIndex = this.voxelsCache.length - 1
        console.log(this.voxelsCache, 'voxelsCache 缓存');
      }
    }

    if (this.meshParameters.pointCloud.confirmed) {
      const pointCloudParam = this.meshParameters.pointCloud.pos

      if (pointCloudParam.length) {
        console.log('INIT-POINTCLOUD', pointCloudParam);
        const dummy = new THREE.Object3D()
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 2),
          this.bboxMaterial);
        const instancedMesh = new THREE.InstancedMesh(
          this.pcdSphereGeometry,
          this.pcdMaterial,
          this.pointsTotalSum);

        this.pointsCache.push({
          name: 'init-pointcloud',
          originMesh: mesh,
          instancedMesh: instancedMesh,
          dummy: dummy,
          points: this.points.slice(),
          params: this.meshParameters.pointCloud.params,
          originPoints: this.points.slice(),
          lastPoints: this.points.slice(),
          file: null,
          currentRotation: {
            axisVector: new THREE.Vector3(0, 0, 0),
            angleInRadians: 0,
            accumulationMatrix: new THREE.Matrix4().identity(),
          }

        });
        this.newPointsIndex = this.pointsCache.length - 1

        console.log(this.pointsCache, 'pointsCache 缓存');
      }
    }
  }

  async editorpageUpdateMesh(modelType, modelFile) {
    /**
     * 进入到这里的时候modelFile：无file /来自upload or mesheditor
     * - 无file 
     *    - bbox 
     *        - 有缓存直接展示
     *        - handcraft 生成一个100*100*100正方体
     * - 有file 
     *    - load filemodel
     * 
     */
    console.log('editorpageUpdateMesh:', modelType, modelFile);
    this.modelType = modelType;
    this.initmodel = modelFile
    this.restoreData()
    this.clearModel()
    if (modelType === 'bbox') {
      console.log('bboxCache', this.bboxCache);
      if (modelFile) {
        await this.loadModel(modelFile, modelType)
      } else {
        if (this.bboxCache.originMesh) {
          this.loadLatestModel(modelType)
        } else {
          this.boundingBox.loadBasicBBox()
        }
      }
      this.loadingcb && this.loadingcb()
      this.mainScene.adjustControlPos(this.modelType)
    } else {
      console.log('Cache', this.voxelsCache, this.pointsCache);
      if (modelFile) {
        await this.loadModel(modelFile, modelType)
      } else {
        this.loadLatestModel(modelType)
      }
    }
    this.mainScene.adjustCameraPos(modelType)
    this.isAnimation = false
  }


  restoreData() {
    this.scaleInfo = { x: 1, y: 1, z: 1 }
  }

  async loadLatestModel(type) {
    this.modelType = type
    this.clearModel()
    if (type === 'bbox') {
      this.loadingcb && this.loadingcb()
      this.originMesh = new THREE.Mesh(
        this.bboxCache.originMesh.geometry.clone(),
        this.bboxCache.originMesh.material.clone())
      this.originMesh.position.y = 0;
      this.originMesh.visible = true
      this.currentObeject = this.bboxCache
      this.mainScene.scene.add(this.originMesh);
      if (this.bboxCache?.boundingBoxOringinMesh) {
        this.boundingBoxOringinMesh = this.bboxCache.boundingBoxOringinMesh
        this.boundingBoxOringinMesh.visible = false
        this.mainScene.scene.add(this.boundingBoxOringinMesh);
      }
      this.mainScene.adjustControlPos(this.modelType)
    } else if (type === 'voxel') {
      const cached = this.voxelsCache[this.newVoxelIndex]
      console.log(cached, 'cached');
      this.voxels = cached.voxels.slice()
      this.loadingcb && this.loadingcb()
      this.dummy = cached.dummy
      this.instancedMesh = cached.instancedMesh
      this.originMesh = cached.originMesh
      this.originMesh.visible = false
      this.instancedMesh.visible = true;
      this.currentObeject = this.voxelsCache[this.newVoxelIndex]
      this.mainScene.scene.add(this.instancedMesh);
      this.mainScene.scene.add(this.originMesh);
      this.animateVoxels()
      this.mainScene.adjustControlPos(type)
      return false
    } else {
      const cached = this.pointsCache[this.newPointsIndex]
      console.log(cached, 'cached');
      if (cached.points) {
        this.points = cached.points.slice()
        this.loadingcb && this.loadingcb()
        this.dummy = cached.dummy
        this.instancedMesh = cached.instancedMesh
        this.originMesh = cached.originMesh
        this.originMesh.visible = false
        this.instancedMesh.visible = true;
        this.currentObeject = this.pointsCache[this.newPointsIndex]
        this.mainScene.scene.add(this.instancedMesh);
        this.mainScene.scene.add(this.originMesh);
        this.animatePointCloud()
        this.mainScene.adjustControlPos(type)
        return false
      } else {
        console.error('pointsCache is empty')
      }
    }
    return true
  }

  clearModel() {
    if (this.originMesh) {
      this.originMesh?.geometry?.dispose();
      this.originMesh?.material?.dispose();
      this.mainScene.scene.remove(this.originMesh);
      this.originMesh = null;
    }

    if (this.instancedMesh) {
      this.instancedMesh?.geometry?.dispose();
      this.instancedMesh?.material?.dispose();
      this.mainScene.scene.remove(this.instancedMesh);
      this.instancedMesh = null;
    }
    if (this.boundingBoxOringinMesh) {
      this.boundingBoxOringinMesh?.geometry?.dispose();
      this.boundingBoxOringinMesh?.material?.dispose();
      this.mainScene.scene.remove(this.boundingBoxOringinMesh);
      this.boundingBoxOringinMesh = null;
    }

    this.voxels = [];
    this.points = []
  }

  async loadModel(file, modelType) {
    this.initmodel = file
    this.currentOrigin = 'upload'
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!file) {
          throw new Error('No file found.');
        }
        const extension = file.name.split('.').pop().toLowerCase();
        const fileName = file.name
        this.fileName = fileName
        const cacheResult = this.loadCacheModel({ fileName, modelType })
        if (cacheResult) {
          resolve(fileName)
        } else {
          let loader

          try {
            loader = await this.fileLoaderMap[extension]();
            if (!loader) throw Error("Unsupported file format")
          } catch (e) {
            this.tip({
              type: 'error',
              content: this.translation('TIP_ERR_UNSUPPORT_FILE')
            })
            this.isAnimation = false
            this.loadingcb && this.loadingcb(true)
            return;
          }

          loader.load(event.target.result, async (object) => {
            this.clearModel()
            if (object.scene) object = object.scene
            let mesh = this.makeSingleMeshAndNormalize(object, extension)
            this.originMesh = mesh
            console.log('--LOAD END--');
            if (modelType === 'voxel') {
              this.voxelsCache.push({
                name: fileName,
                voxels: [],
                isMeshEditor: file.isMeshEditor,
                currentOrigin: this.currentOrigin,
                file: file
              })
              this.oldVoxelIndex = this.newVoxelIndex
              this.newVoxelIndex = this.voxelsCache.length - 1
              this.mainScene.adjustControlPos(this.modelType)
              this.generateDepthTexturePNG().then(depthMaps => {
                this.depthMaps = depthMaps
                this.depthMap2Pos(depthMaps)
              });
              this.currentObeject = this.voxelsCache[this.newVoxelIndex]
            } else if (modelType === 'pointCloud') {
              this.pointsCache.push(
                {
                  name: fileName,
                  points: [],
                  isMeshEditor: file.isMeshEditor,
                  currentOrigin: this.currentOrigin,
                  currentRotation: {
                    axisVector: new THREE.Vector3(0, 0, 0),
                    angleInRadians: 0,
                    accumulationMatrix: new THREE.Matrix4().identity(),
                  },
                  file: file
                })
              this.oldPointsIndex = this.newPointsIndex
              this.newPointsIndex = this.pointsCache.length - 1
              if (!file.isMeshEditor) {
                this.checkWatertightness(this.originMesh.geometry)
              }
              this.createNewPointCloud({ mesh: mesh, newIndex: this.newPointsIndex });
              this.mainScene.adjustControlPos(this.modelType)
              this.currentObeject = this.pointsCache[this.newPointsIndex]
            } else {
              // this.showBoundingBox(this.originMesh, this.mainScene.scene)
              this.originMesh.position.y = 0
              this.originMesh.visible = true
              this.mainScene.scene.add(this.originMesh);
              this.bboxCache = {
                ...this.bboxCache,
                originMesh: new THREE.Mesh(
                  this.originMesh.geometry.clone(),
                  this.originMesh.material.clone()
                ),
                currentOrigin: this.currentOrigin,
                file: file,
              }
              this.isAnimation = false
              this.currentObeject = this.bboxCache
            }
            resolve(fileName)
          }, () => {

          }, (err) => {
            console.error('Failed to load object.', err);
            this.tip({
              type: 'error',
              content: this.translation('TIP_ERR_FAIL_LOAD_OBJ')
            })
            this.isAnimation = false
            this.loadingcb && this.loadingcb(true)
            reject()
          });
        }

      };
      reader.readAsDataURL(file);
    })
  }

  showBoundingBox(object, scene) {

    // 删除先前的线框网格
    if (this.boxHelper) {
      scene.remove(this.boxHelper);
      object.traverse((child) => {
        if (child.isLine) {
          scene.remove(child);
        }
      })
    }
    this.boxHelper = new THREE.BoxHelper(object);
    scene.add(this.boxHelper);
    const edges = new THREE.EdgesGeometry(object.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 }) // 0xffff00 是黄色，linewidth 是线条宽度
    );
    object.add(line); // 将线条添加到 mesh 上
  }

  loadCacheModel({ fileName, modelType }) {
    if (modelType === 'bbox') return null
    //如果之前有缓存，但是没有comfirm状态，则删除
    let cachedIndex = (modelType === 'voxel' ? this.newVoxelIndex : this.newPointsIndex)
    if (fileName) {
      cachedIndex = (modelType === 'voxel' ? this.voxelsCache : this.pointsCache).findIndex((item => item.name === fileName))
    }
    const cached = (modelType === 'voxel' ? this.voxelsCache : this.pointsCache)[cachedIndex]

    if (cached) {
      if (!this.meshParameters[modelType].confirmed) {
        console.log('cachedIndex', cachedIndex, this.meshParameters[modelType]);
        (modelType === 'voxel' ? this.voxelsCache : this.pointsCache).splice(cachedIndex, 1)
        return null
      }
      this.clearModel()
      console.log(cached, 'cached');
      modelType === 'voxel' ? (this.oldVoxelIndex = this.newVoxelIndex) : (this.oldPointsIndex = this.newPointsIndex)
      this.dummy = new THREE.Object3D();
      this.originMesh = cached.originMesh.clone()
      this.instancedMesh = cached.instancedMesh.clone()
      if (modelType === 'voxel') {
        this.voxels = cached.originVoxels.slice()
        this.newVoxelIndex = cachedIndex
        this.currentObeject = this.voxelsCache[this.newVoxelIndex]
      } else {
        this.points = cached.originPoints.slice()
        this.newPointsIndex = cachedIndex
        this.currentObeject = this.pointsCache[this.newPointsIndex]
      }
      this.originMesh.visible = false
      this.instancedMesh.visible = true
      this.mainScene.scene.add(this.instancedMesh)
      this.loadingcb && this.loadingcb()
      this.mainScene.adjustControlPos(this.modelType)
      modelType === 'voxel' ? this.animateVoxels() : this.animatePointCloud()
      return true
    } else {
      return null
    }
  }

  makeSingleMeshAndNormalize(object, source_extension) {
    let finalGeometry;

    if (object.isMesh)
      finalGeometry = object.geometry;
    //由于STL文件的坐标系通常为Z轴向上，所以需要旋转使其与其他格式对齐。
    else if (object.isBufferGeometry) { // stl, ply
      const geometry = object;
      if (source_extension == "stl")
        geometry.rotateX(-Math.PI / 2);
      finalGeometry = geometry;
    }
    else if (object.isGroup) { // glb, dae, obj, fbx 其他常见3D格式通常已经采用Y轴向上，不需要额外旋转处理。
      const scene = object;
      scene.updateMatrixWorld(true);

      const geometries = [];
      scene.traverse((object) => {
        if (object.isMesh) {
          const mesh = object;
          const geometry = mesh.geometry.clone();

          const retainOnlyAttribute = (obj, keyToKeep) => {
            for (const key in obj) {
              if (Object.hasOwnProperty.call(obj, key) && key !== keyToKeep) {
                delete obj[key];
              }
            }
          }
          retainOnlyAttribute(geometry.attributes, "position");

          // console.log("merging", geometry)
          geometry.applyMatrix4(mesh.matrixWorld);
          geometries.push(geometry);
        }
      });

      finalGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    }
    finalGeometry.computeVertexNormals(); // not necessary
    let finalMesh
    if (this.modelType === 'bbox') {
      this.normalizeGeometry(finalGeometry, 100); // 先归一化
      finalGeometry.computeBoundingBox();
      const originGeom = finalGeometry.clone()
      finalGeometry = this.calculateBoundingBox(finalGeometry);
      finalGeometry.computeBoundingBox();
      const boundingBoxOringinMesh = new THREE.Mesh(originGeom, this.bboxMaterial);
      this.boundingBoxOringinMesh = boundingBoxOringinMesh
      this.boundingBoxOringinMesh.position.y = 0
      this.bboxCache = {
        ...this.bboxCache,
        boundingBoxOringinMesh: boundingBoxOringinMesh,
      }
      this.mainScene.scene.add(boundingBoxOringinMesh);
      this.boundingBoxOringinMesh.visible = false
      finalMesh = new THREE.Mesh(finalGeometry, this.bboxMaterial);
    } else {
      this.normalizeGeometry(finalGeometry);
      finalMesh = new THREE.Mesh(finalGeometry, this.defaultMaterial);
    }
    return finalMesh;
  }

  calculateBoundingBox(geo) {
    // 创建一个临时网格，应用当前的旋转
    const tempMesh = new THREE.Mesh(geo);
    if (this?.boundingBoxOringinMesh?.rotation) {
      tempMesh.rotation.copy(this.boundingBoxOringinMesh.rotation);
    }
    tempMesh.updateMatrixWorld(true);

    // 创建一个新的几何体，应用世界变换
    const transformedGeometry = geo.clone().applyMatrix4(tempMesh.matrixWorld);

    // 计算变换后的几何体的边界框
    const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(transformedGeometry));
    console.log(boundingBox, 'boundingBox');

    const Xdiff = boundingBox.max.x - boundingBox.min.x;
    const Ydiff = boundingBox.max.y - boundingBox.min.y;
    const Zdiff = boundingBox.max.z - boundingBox.min.z;
    const maxDimension = Math.max(Xdiff, Ydiff, Zdiff);
    const scaleFactor = 100 / maxDimension;  //bbox max size = 100

    this.setMeshParameters(pre => ({
      ...pre,
      ["bbox"]: {
        ...pre.bbox,
        pos: {
          x: parseInt(Xdiff * scaleFactor),
          y: parseInt(Ydiff * scaleFactor),
          z: parseInt(Zdiff * scaleFactor)
        }
      }
    }));

    this.bboxCache = {
      ...this.bboxCache,
      x: parseInt(Xdiff * scaleFactor),
      y: parseInt(Ydiff * scaleFactor),
      z: parseInt(Zdiff * scaleFactor),
      originSize: {
        x: parseInt(Xdiff * scaleFactor),
        y: parseInt(Ydiff * scaleFactor),
        z: parseInt(Zdiff * scaleFactor),
      }
    };

    return new THREE.BoxGeometry(Xdiff * scaleFactor, Ydiff * scaleFactor, Zdiff * scaleFactor);
  }

  normalizeGeometry(geometry, base = 2) {
    const mesh = new THREE.Mesh(geometry);

    let scaleFactor = 1;
    const center = new THREE.Vector3();
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    if (!boundingBox.isEmpty()) {
      this.Xdistance = boundingBox.max.x - boundingBox.min.x;
      this.Ydistance = boundingBox.max.y - boundingBox.min.y;
      this.Zdistance = boundingBox.max.z - boundingBox.min.z;
      const maxDimension = Math.max(this.Xdistance, this.Ydistance, this.Zdistance);
      if (base === 100) {
        scaleFactor = base / maxDimension
      } else {
        scaleFactor = base / maxDimension * 0.95;
      }
      console.log('%c加载尺寸', "color:purple", this.Xdistance, this.Ydistance, this.Zdistance);
      mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      boundingBox.getCenter(center).multiplyScalar(scaleFactor);
      mesh.position.sub(center);
    } else {
      console.error('Bounding box is empty.');
    }
    mesh.updateMatrixWorld(true);
    geometry.applyMatrix4(mesh.matrixWorld);
    console.log(mesh.geometry);
    const boundingBox2 = new THREE.Box3().setFromObject(mesh);
    console.log('%c加载后最终尺寸', "color:blue", boundingBox2);
  }

  generateDepthTexturePNG(multiply = false) {
    return new Promise((resolve) => {
      const scene = new THREE.Scene();

      const depthMaterial = new THREE.ShaderMaterial({
        vertexShader: `
      varying vec4 vWorldPosition;
      void main() {
        vWorldPosition = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      varying vec4 vWorldPosition;
      void main() {
        float depth = vWorldPosition.z * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(depth), 1.0);
      }
    `,
        side: THREE.DoubleSide
      });

      const clonedMesh = this.originMesh.clone();
      clonedMesh.traverse((mesh) => {
        if (mesh && mesh.isMesh) {
          mesh.material = depthMaterial;
        }
      });
      this.originMesh.traverse((mesh) => {
        if (mesh && mesh.isMesh) {
          mesh.material = this.voxelMaterial;
        }
      });
      scene.add(clonedMesh);

      let renderer = new THREE.WebGLRenderer();
      const renderTarget = new THREE.WebGLRenderTarget(256, 256);
      const renderTargetCanvas = document.createElement('canvas');
      renderTargetCanvas.width = 256;
      renderTargetCanvas.height = 256;
      const pixels = new Uint8Array(256 * 256 * 4);

      const directions = [
        { rotation: new THREE.Matrix4().makeRotationY(0), name: 'front' },
        { rotation: new THREE.Matrix4().makeRotationY(Math.PI), name: 'back' },
        { rotation: new THREE.Matrix4().makeRotationY(Math.PI / 2), name: 'right' },
        { rotation: new THREE.Matrix4().makeRotationY(-Math.PI / 2), name: 'left' },
        { rotation: new THREE.Matrix4().makeRotationX(-Math.PI / 2), name: 'top' },
        { rotation: new THREE.Matrix4().makeRotationX(Math.PI / 2), name: 'bottom' }
      ];

      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2);
      camera.position.set(0, 0, 1);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.updateProjectionMatrix();

      const result = [];
      const userMatrix = this.originMesh.matrix.clone();
      console.log(userMatrix, 'userMatrix');
      directions.forEach((direction, index) => {
        let finalMatrix = new THREE.Matrix4();
        if (multiply) {
          finalMatrix.multiplyMatrices(direction.rotation, userMatrix);
        } else {
          finalMatrix.copy(direction.rotation);
        }

        clonedMesh.matrix.copy(finalMatrix);
        clonedMesh.matrixAutoUpdate = false;
        clonedMesh.updateMatrixWorld(true);

        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.readRenderTargetPixels(renderTarget, 0, 0, 256, 256, pixels);

        const flippedPixels = new Uint8Array(16 * 16).fill(0);
        for (let y = 0; y < 256; y++) {
          for (let x = 0; x < 256; x++) {
            const srcIndex = (y * 256 + x) * 4;
            const dstIndex = ((15 - Math.floor(y / 16)) * 16 + Math.floor(x / 16));
            flippedPixels[dstIndex] = Math.max(pixels[srcIndex], flippedPixels[dstIndex]);
          }
        }
        result.push({ name: direction.name, data: flippedPixels });

        // this.takeScreenshot(renderer, renderTarget, pixels);

        if (index === directions.length - 1) {
          renderer.dispose();
          renderTarget.dispose();
          renderer.forceContextLoss();
          renderer = null;
          resolve(result);
        }
      });
    });
  }

  takeScreenshot(renderer, renderTarget, pixels) {
    const renderTargetCanvas = document.createElement('canvas');
    renderTargetCanvas.width = 256;
    renderTargetCanvas.height = 256;
    const renderTargetContext = renderTargetCanvas.getContext('2d');

    // Copy the pixels from the render target to the new canvas
    renderer.readRenderTargetPixels(renderTarget, 0, 0, 256, 256, pixels);

    // Create an ImageData object
    const imageData = renderTargetContext.createImageData(256, 256);
    imageData.data.set(pixels);

    // Put the image data into the context
    renderTargetContext.putImageData(imageData, 0, 0);


    const imgData = renderTargetCanvas.toDataURL('image/png')
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'front_view.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  depthMap2Pos(depthMap, forceSymmetric = false) {
    // const directions = ["front",'back','right','left','top','bottom']
    const voxelsMappingPosArr = new Array(16 * 16 * 16).fill(1)

    for (let i = 0; i < depthMap.length; i++) {
      const unitArray = depthMap[i].data
      const name = depthMap[i].name
      const distance = 16
      unitArray.map((item, index) => {
        item = Math.ceil(((item / 255 * 2 - 1) - (-1)) / (2 / 16)) //16 * 16 中每个元素的depth
        for (let i = 0; i < distance - item; i++) { //在这个面上所在位置depth的值对应的体素块去除
          let position
          if (name === 'front') {
            position = { x: index % 16, y: 15 - Math.floor(index / 16) % 16, z: 15 - i }
          } else if (name === 'back') {
            position = { x: 15 - index % 16, y: 15 - Math.floor(index / 16) % 16, z: i };
          } else if (name === 'right') {
            position = { x: i, y: 15 - Math.floor(index / 16) % 16, z: index % 16 };
          } else if (name === 'left') {
            position = { x: 15 - i, y: 15 - Math.floor(index / 16) % 16, z: 15 - index % 16 };
          } else if (name === 'top') {
            position = { x: index % 16, y: i, z: 15 - Math.floor(index / 16) % 16 };
          } else {
            position = { x: index % 16, y: 15 - i, z: Math.floor(index / 16) % 16 };
          }
          const pos = position.x * 16 * 16 + position.y * 16 + position.z
          voxelsMappingPosArr[pos] = 0
        }
      })
    }

    if (forceSymmetric) {
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          for (let k = 0; k < 16; k++) {
            let i2 = 16 - 1 - i;
            const pos = i * 16 * 16 + j * 16 + k;
            const pos2 = i2 * 16 * 16 + j * 16 + k;
            if (voxelsMappingPosArr[pos] == 1) {
              voxelsMappingPosArr[pos2] = 1;
            }
          }
        }
      }
    }

    this.createNewVoxels({ voxelsMappingPosArr, newIndex: this.newVoxelIndex })
  }

  reCaculateDepthMap2Pos(boolean) {
    this.mainScene.scene.remove(this.instancedMesh);
    this.instancedMesh = null;
    this.depthMap2Pos(this.depthMaps, boolean)
  }

  createNewVoxels({ voxelsMappingPosArr, newIndex }) {
    return new Promise((resolve) => {
      const geometry = new THREE.BoxGeometry(2, 2, 2); // 体素块的边长为2，以适应-1到1的空间
      let mycube = this.voxelsCache[newIndex]
      mycube.originMesh = new THREE.Mesh(geometry, this.voxelMaterial);
      mycube.dummy = new THREE.Object3D();
      const min = -1
      const max = 1
      const voxelSize = (max - min) / 16; // 每个体素的大小
      const pos = new THREE.Vector3();
      let oldVoxels, newVoxels
      if (voxelsMappingPosArr) {
        mycube.transformedVoxels = [];
        mycube.voxels = []
        mycube.originVoxels = []
        if (mycube?.lastVoxels?.length) {
          oldVoxels = mycube.lastVoxels
          newVoxels = mycube.voxels
        }
        mycube.lastVoxels = []
        for (let i = 0; i < 16; i += 1) {
          for (let j = 0; j < 16; j += 1) {
            for (let k = 0; k < 16; k += 1) {
              const target = k + j * 16 + i * 16 * 16;
              mycube.transformedVoxels.push(voxelsMappingPosArr[target]);
              if (voxelsMappingPosArr[target] === 1) {
                pos.set((i + 0.5) * voxelSize - 1, (j + 0.5) * voxelSize - 1, (k + 0.5) * voxelSize - 1);
                mycube.voxels.push({ position: pos.clone() });
                mycube.originVoxels.push({ position: pos.clone() });
                mycube.lastVoxels.push({ position: pos.clone() });
              }
            }
          }
        }
      } else {
        for (let i = 0; i < 16; i += 1) {
          for (let j = 0; j < 16; j += 1) {
            for (let k = 0; k < 16; k += 1) {
              pos.set((i + 0.5) * voxelSize - 1, (j + 0.5) * voxelSize - 1, (k + 0.5) * voxelSize - 1);
              mycube.voxels.push({ position: pos.clone() });
            }
          }
        }
      }
      mycube.instancedMesh = new THREE.InstancedMesh(
        new RoundedBoxGeometry(voxelSize, voxelSize, voxelSize, 2, 0.01),
        //#bfc3ca
        this.voxelMaterial,
        mycube.voxels.length
      );

      if (voxelsMappingPosArr) {
        mycube.primitiveInstancedMesh = new THREE.InstancedMesh(
          new RoundedBoxGeometry(voxelSize, voxelSize, voxelSize, 2, 0.01),
          //#bfc3ca
          this.voxelMaterial,
          mycube.voxels.length
        );

        mycube.scaledOriginMesh = new THREE.Mesh(
          this.originMesh.geometry.clone(),
          this.originMesh.material.clone()
        )
        if (this.scaleInfo) {
          mycube.scaledOriginMesh.scale.set(this.scaleInfo.x, this.scaleInfo.y, this.scaleInfo.z)
          // 应用缩放后的变换矩阵到几何数据
          mycube.scaledOriginMesh.updateMatrixWorld();
          mycube.scaledOriginMesh.geometry.applyMatrix4(mycube.scaledOriginMesh.matrixWorld);
        }
        this.voxels = mycube.voxels
        this.instancedMesh = mycube.instancedMesh
        this.dummy = mycube.dummy
        this.mainScene.scene.add(mycube.instancedMesh);
        this.mainScene.scene.add(this.originMesh);
        this.originMesh.visible = false;
        this.instancedMesh.visible = true;

        this.voxelsCache = this.voxelsCache.map((item, index) =>
          index === newIndex ? {
            ...item,
            voxels: this.voxels,
            originMesh: new THREE.Mesh(
              this.originMesh.geometry.clone(),
              this.originMesh.material.clone()
            ),
            params: mycube.transformedVoxels.slice()
          } : item
        )
        this.loadingcb && this.loadingcb()
        if (oldVoxels?.length > 0) {
          this.animateVoxels('scale', oldVoxels, newVoxels)
          oldVoxels = mycube.voxels
        } else {
          this.animateVoxels()
        }
      }
      resolve(true);
    });
  }

  createNewPointCloud({ mesh = null, newIndex }) {
    return new Promise((resolve) => {
      let myPoint = this.pointsCache[newIndex]
      if (!mesh) {
        for (let i = -1; i < 1; i += 0.2) {
          for (let j = -1; j < 1; j += 0.2) {
            for (let k = -1; k < 1; k += 0.2) {
              myPoint.points.push({ position: new THREE.Vector3(i, j, k) });
            }
          }
        }
        myPoint.dummy = new THREE.Object3D();
      } else {
        const sampler = new MeshSurfaceSampler(mesh).build();
        const tempPosition = new THREE.Vector3();
        myPoint.instancedMesh = new THREE.InstancedMesh(
          this.pcdSphereGeometry,
          this.pcdMaterial,
          this.pointsTotalSum);
        myPoint.primitiveInstancedMesh = new THREE.InstancedMesh(
          this.pcdSphereGeometry,
          this.pcdMaterial,
          this.pointsTotalSum);

        myPoint.scaledOriginMesh = new THREE.Mesh(
          this.originMesh.geometry.clone(),
          this.originMesh.material.clone()
        )

        myPoint.dummy = new THREE.Object3D();
        myPoint.params = []
        myPoint.points = []
        myPoint.originPoints = []
        myPoint.lastPoints = []
        for (let i = 0; i < this.pointsTotalSum; i++) {
          sampler.sample(tempPosition);
          myPoint.points.push({ position: tempPosition.clone() });
          myPoint.originPoints.push({ position: tempPosition.clone() });
          myPoint.lastPoints.push({ position: tempPosition.clone() });
          myPoint.params.push([tempPosition.x, tempPosition.y, tempPosition.z])
        }
        this.points = myPoint.points
        this.instancedMesh = myPoint.instancedMesh
        this.dummy = myPoint.dummy
        this.mainScene.scene.add(myPoint.instancedMesh);
        this.originMesh.traverse((mesh) => {
          if (mesh.isMesh) {
            mesh.material = this.voxelMaterial
          }
        })
        this.mainScene.scene.add(this.originMesh);
        this.originMesh.visible = false;
        this.instancedMesh.visible = true;

        this.pointsCache = this.pointsCache.map((item, index) => {
          return index === newIndex ? {
            ...item,
            points: this.points,
            originMesh: new THREE.Mesh(
              this.originMesh.geometry.clone(),
              this.originMesh.material.clone()
            ),
            params: myPoint.params.slice(0, this.pointsTotalSum)
          } : item
        }
        )
        this.loadingcb && this.loadingcb();
        this.animatePointCloud()
      }

      resolve(true);
    });
  }

  regeneratePCDbySampling() {
    this.isAnimation = true
    // this.pointsCache[this.newPointsIndex] = {
    //   ...this.pointsCache[this.newPointsIndex],
    //   currentRotation: {
    //     axisVector: new THREE.Vector3(0, 0, 0),
    //     angleInRadians: 0,
    //     accumulationMatrix: new THREE.Matrix4().identity(),
    //   }

    // }
    // const newMesh = new THREE.Mesh(
    //   this.originMesh.geometry.clone(),
    //   this.originMesh.material.clone()
    // );
    // this.clearModel()
    // this.originMesh = newMesh
    // this.createNewPointCloud({ mesh: this.originMesh, newIndex: this.newPointsIndex });

    const originPoints = this.pointsCache[this.newPointsIndex]?.allTransformedPoints || this.pointsCache[this.newPointsIndex]?.originPoints
    if (originPoints) {
      const samplingPoints = originPoints.slice(0, this.pointsTotalSum)

      if (this.instancedMesh) {
        this.mainScene.scene.remove(this.instancedMesh)
      }
      const myPoint = this.pointsCache[this.newPointsIndex]
      myPoint.instancedMesh = new THREE.InstancedMesh(
        this.pcdSphereGeometry,
        this.pcdMaterial,
        this.pointsTotalSum
      );
      myPoint.dummy = new THREE.Object3D();
      myPoint.points = samplingPoints;
      myPoint.params = this.normalizePoints(samplingPoints).map(point => [point.position.x, point.position.y, point.position.z]);

      this.points = myPoint.points;
      this.instancedMesh = myPoint.instancedMesh;
      this.dummy = myPoint.dummy;

      this.mainScene.scene.add(myPoint.instancedMesh);

      this.pointsCache[this.newPointsIndex] = {
        ...myPoint,
        points: samplingPoints,
      };

      this.instancedMesh.visible = true
      this.originMesh.visible = false
      this.mainScene.scene.add(this.instancedMesh)
      this.animatePointCloud('customAnimation', originPoints, samplingPoints);
      this.mainScene.adjustControlPos(this.modelType)
    } else {
      // Handle the case when originPoints is undefined
      console.error('originPoints is undefined');
    }

  }

  deepClone(obj, hash = new WeakMap()) {
    // 基本类型和函数直接返回
    if (obj === null || typeof obj !== 'object') return obj;

    // 如果对象已被克隆过，直接返回避免循环引用
    if (hash.has(obj)) return hash.get(obj);

    // 判断对象类型
    const cloneObj = Array.isArray(obj) ? [] : {};

    // 缓存当前对象，防止循环引用
    hash.set(obj, cloneObj);

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloneObj[key] = this.deepClone(obj[key], hash);
      }
    }
    return cloneObj;
  }

  animateVoxels(type = 'default', oldValue, newValue) {
    this.isAnimation = true;
    let oldLen, oldVoxel, newVoxel, newLen, isSameModel;
    if (type === 'default') {
      oldLen = this.voxelsCache[this.oldVoxelIndex].voxels.length;
      oldVoxel = this.voxelsCache[this.oldVoxelIndex].voxels;
      newVoxel = this.voxels;
      newLen = this.voxels.length;
      isSameModel = this.oldVoxelIndex === this.newVoxelIndex;
    } else {
      oldLen = oldValue.length;
      oldVoxel = oldValue;
      newVoxel = newValue;
      newLen = newValue.length;
      isSameModel = false;
    }

    this.instancedMesh.rotation.set(0, 0, 0);

    // Animate voxels data
    for (let i = 0; i < newLen; i++) {
      gsap.killTweensOf(newVoxel[i].position); // Stop any existing animations on the voxel position
      const duration = .5 + .5 * Math.pow(Math.random(), 6);
      let targetPos = newVoxel[i].position;
      let startPos;
      if (isSameModel) {
        // If it's the same model, randomly offset the starting position
        startPos = {
          x: targetPos.x + (Math.random() - 0.5),
          y: targetPos.y + (Math.random() - 0.5),
          z: targetPos.z + (Math.random() - 0.5),
        };
      } else if (oldVoxel[i]) {
        startPos = oldVoxel[i].position;
      } else {
        startPos = oldVoxel[Math.floor(oldLen * Math.random())].position;
      }
      gsap.fromTo(newVoxel[i].position, {
        x: startPos.x,
        y: startPos.y,
        z: startPos.z
      }, {
        delay: .2 * Math.random(),
        duration: duration,
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        ease: "back.out(3)",
        onUpdate: () => {
          this.dummy.position.copy(newVoxel[i].position);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
          this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
      });
    }

    // Ensure the model rotation transition is consistent
    gsap.to(this.instancedMesh.rotation, {
      duration: 1.2,
      y: 2 * Math.PI, // Rotate exactly 360 degrees
      ease: "power2.out",
      onComplete: () => {
        this.instancedMesh.rotation.set(0, 0, 0); // Reset rotation to ensure no cumulative error
      }
    });

    // Show the right number of voxels
    gsap.to(this.instancedMesh, {
      duration: .4,
      count: newLen
    });

    gsap.to({}, {
      duration: 1, // Max transition duration
      onUpdate: () => {
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.voxelsCache = this.voxelsCache.map((item, index) =>
          index === this.newVoxelIndex ?
            {
              ...item,
              instancedMesh: this.instancedMesh.clone()
            }
            : item
        );
      }
    });

    setTimeout(() => {
      this.isAnimation = false;
    }, 300);
  }

  animatePointCloud(type = 'index', oldpoints, newpoints) {
    this.isAnimation = true;
    let oldLen, oldPoints, newPoints, newLen, isSameModel
    if (type === 'index') {
      oldLen = this.pointsCache[this.oldPointsIndex].points.length;
      oldPoints = this.pointsCache[this.oldPointsIndex].points
      newPoints = this.points
      newLen = this.points.length;
      isSameModel = this.oldPointsIndex === this.newPointsIndex
    } else if (type === 'customAnimation') {
      oldLen = oldpoints.length;
      oldPoints = oldpoints
      newPoints = newpoints
      newLen = newpoints.length;
      isSameModel = false
    }

    for (let i = 0; i < newLen; i++) {
      gsap.killTweensOf(newPoints[i].position); // 停止当前点位置的所有动画
      const duration = 0.5 + 0.5 * Math.pow(Math.random(), 6);
      let targetPos = newPoints[i].position
      let startPos
      if (isSameModel) {
        startPos = {
          x: targetPos.x + (Math.random() - 0.5),
          y: targetPos.y + (Math.random() - 0.5),
          z: targetPos.z + (Math.random() - 0.5),
        };
      } else if (oldPoints[i]) {
        startPos = oldPoints[i].position
      } else {
        startPos = oldPoints[Math.floor(oldLen * Math.random())].position
      }

      gsap.fromTo(newPoints[i].position, {
        x: startPos.x,
        y: startPos.y,
        z: startPos.z
      }, {
        delay: 0.4 * Math.random(),
        duration: duration,
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        ease: "Power2.out",
        onUpdate: () => {
          this.dummy.position.copy(newPoints[i].position);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
          this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
      });
    }

    gsap.to({}, {
      duration: 1, // max transition duration
      onUpdate: () => {
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.pointsCache = this.pointsCache.map((item, index) =>
          index === this.newPointsIndex
            ? {
              ...item,
              instancedMesh: this.instancedMesh.clone()
            }
            : item
        );
        setTimeout(() => {
          this.isAnimation = false;
        }, 300);
      }
    });

    setTimeout(() => {
      this.jitterStartMs = Date.now();
      console.log("start jitter");
      newPoints.forEach((_, i) => {
        newPoints[i].positionJitter = new THREE.Vector3(newPoints[i].position.x, newPoints[i].position.y, newPoints[i].position.z);
        jitterPoint.bind(this)(i);
      });


      function generateGaussianRandom(mean = 0, standardDeviation = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * standardDeviation + mean;
      }


      function jitterPoint(i) {
        // Define the range of jitter
        const jitterMagnitudeMin = 0.02; // Adjust the magnitude to suit the scale of your visualization
        const jitterMagnitudeMax = 0.1; // Adjust the magnitude to suit the scale of your visualization
        let jitterMagnitude = this.pcdUncertainty; // Adjust the magnitude to suit the scale of your visualization
        jitterMagnitude = Math.max(Math.min(jitterMagnitude, 0.05), 0);
        jitterMagnitude = jitterMagnitude > 0 ? (jitterMagnitude / 0.05) * (jitterMagnitudeMax - jitterMagnitudeMin) + jitterMagnitudeMin : 0;


        let milliseconds = Date.now() - this.jitterStartMs;
        let cycleMs = 3000;
        let sweepMs = 2000;
        let cycleOffset = milliseconds % cycleMs;

        let isSweeping = cycleOffset < sweepMs;
        let width = 0.2;
        // let sweepPosition = (cycleOffset - (cycleMs - sweepMs) / 2) / sweepMs * 2 - 1;
        let sweepT = Math.max(Math.min(cycleOffset / sweepMs, 1), 0);
        sweepT = sweepT ** 2;

        let sweepPosition = (sweepT * 2 - 1) * (1 + 3 * width);

        let dist = Math.abs(newPoints[i].position.z - sweepPosition);
        let signal = isSweeping ? Math.exp(-((dist / width) ** 2)) : 0;


        // Randomly generate small offsets within the defined range
        const dx = generateGaussianRandom() * jitterMagnitude * signal;
        const dy = generateGaussianRandom() * jitterMagnitude * signal;
        const dz = generateGaussianRandom() * jitterMagnitude * signal;

        // Animate to new jittered position
        gsap.to(newPoints[i].positionJitter, {
          duration: 0.01, // Short duration for a quick jitter effect
          x: newPoints[i].position.x + dx,
          y: newPoints[i].position.y + dy,
          z: newPoints[i].position.z + dz,
          ease: 'none', // This easing gives a smooth oscillation effect


          onUpdate: () => {
            try {
              if (!this.instancedMesh) return;
              this.dummy.position.copy(newPoints[i].positionJitter);
              this.dummy.updateMatrix();
              this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
              this.instancedMesh.instanceMatrix.needsUpdate = true;
            } catch (err) {
              console.error("An error occurred in onUpdate: ", err);
            }
          },
          onComplete: () => {
            if (this.isAnimation || !this.instancedMesh) {
              gsap.killTweensOf(newPoints[i].positionJitter); // 停止当前点位置的所有动画
              return;
            }
            jitterPoint.bind(this)(i);
          } // Call the same function recursively to continue jittering
        });
      }
    }, 300);

  }

  convertToObjFile(type) {
    return new Promise((resolve, reject) => {
      try {
        let orginModel
        if (type === 'voxel') {
          orginModel = this.voxelsCache[this.newVoxelIndex].scaledOriginMesh
        } else {
          orginModel = this.pointsCache[this.newPointsIndex].scaledOriginMesh
        }
        const randomName = this.generateRandomString(6) + ".obj"
        const exporter = new OBJExporter();
        const result = exporter.parse(orginModel);
        const blob = new Blob([result], { type: 'text/plain' });
        const file = new File([blob], randomName, { type: 'text/plain' });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  registerUpdateSliderValueFunction(updateSliderValue) {
    this.updateSliderValue = updateSliderValue;
  }

  recordOriginalMeshRotationAfterOrthoCameraUpdated(info) {
    if (info === undefined) {
      this.infoForMeshRotation = undefined;
      return;
    }
    this.transformer.updateRotation(this.originMesh, this.originMesh.rotation.clone());
    info.currentRotation = this.originMesh.rotation.clone();
    if (this.modelType === 'pointCloud') {
      this.pointsCache[this.newPointsIndex].currentRotation = {
        axisVector: new THREE.Vector3(0, 0, 0),
        angleInRadians: 0,
        accumulationMatrix: new THREE.Matrix4().makeRotationFromEuler(this.originMesh.rotation.clone())
      }
    } else if (this.modelType === 'bbox' && this.currentOrigin == 'upload') {
      this.transformer.updateRotation(this.boundingBoxOringinMesh, this.boundingBoxOringinMesh.rotation.clone());
    }

    this.infoForMeshRotation = info;
    console.log(this.infoForMeshRotation, 'this.infoForMeshRotation');
    this.updateSliderValue && this.updateSliderValue([0, 0, 0]);
  }

  updateOriginalMeshRotationAxisAligned(angle) {
    const angleInRadians = angle * Math.PI / 180;
    if (this.infoForMeshRotation === undefined) return;
    const isHasModel = this.currentOrigin == 'upload'
    const isHome = this.name === 'homecondition'
    const isNeedNormal = this.modelType === 'voxel'

    if (this.modelType === 'bbox') {
      if (isHasModel) {
        this.boundingBoxOringinMesh.rotation.copy(this.infoForMeshRotation.currentRotation);
      } else {
        this.originMesh.rotation.copy(this.infoForMeshRotation.currentRotation);
      }
    }

    const axisVector = new THREE.Vector3(
      this.infoForMeshRotation.orthoCameraAxis === 0 ? 1 : 0,
      this.infoForMeshRotation.orthoCameraAxis === 1 ? 1 : 0,
      this.infoForMeshRotation.orthoCameraAxis === 2 ? 1 : 0
    );

    if (this.modelType === 'bbox') {
      if (isHasModel) {
        this.transformer.rotateMesh(this.boundingBoxOringinMesh, axisVector, angleInRadians, false);
        this.boundingBoxOringinMesh.visible = true;
        this.boundingBoxOringinMesh.position.y = 0
        this.originMesh.visible = false;
      } else {
        this.originMesh.rotateOnWorldAxis(axisVector, angleInRadians);
        this.originMesh.updateMatrixWorld(true); // 确保矩阵更新 
      }
      this.bboxCache.currentRotation = {
        ...this.bboxCache.currentRotation,
        axisVector,
        angleInRadians
      }
    } else {
      this.transformer.rotateMesh(this.originMesh, axisVector, angleInRadians, isNeedNormal);
      if (isHome || (!isHome && isHasModel)) {

        this.originMesh.visible = true;
        this.instancedMesh.visible = false;
      }
      if (this.modelType === 'voxel') {
        this.voxelsCache[this.newVoxelIndex].currentRotation = {
          ...this.voxelsCache[this.newVoxelIndex].currentRotation,
          axisVector,
          angleInRadians
        }
      } else {
        this.pointsCache[this.newPointsIndex].currentRotation = {
          ...this.pointsCache[this.newPointsIndex].currentRotation,
          axisVector,
          angleInRadians
        }
      }
    }
  }

  createBoundingBoxMesh(inputMesh, caculate = false) {
    // 创建一个临时网格，应用当前的旋转
    const geo = inputMesh.geometry.clone();
    const tempMesh = new THREE.Mesh(geo);
    if (this?.boundingBoxOringinMesh?.rotation) {
      tempMesh.rotation.copy(this.boundingBoxOringinMesh.rotation);
    }
    if (this?.boundingBoxOringinMesh?.scale) {
      tempMesh.scale.copy(this.boundingBoxOringinMesh.scale);
    }

    tempMesh.updateMatrixWorld(true);

    // 创建一个新的几何体，应用世界变换
    const transformedGeometry = geo.clone().applyMatrix4(tempMesh.matrixWorld);

    const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(transformedGeometry));
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);

    const material = this.bboxMaterial

    const boundingBoxMesh = new THREE.Mesh(geometry, material);

    // boundingBoxMesh.position.copy(boundingBox.getCenter(new THREE.Vector3()));
    if (caculate) {
      this.setMeshParameters(pre => ({
        ...pre,
        ["bbox"]: {
          ...pre.bbox,
          pos: {
            x: parseInt(Math.min(size.x, 300)),
            y: parseInt(Math.min(size.y, 300)),
            z: parseInt(Math.min(size.z, 300))
          }
        }
      }));
    }


    return { boundingBoxMesh, size };
  }

  updateMeshByRotate() {
    this.isAnimation = true
    console.log('rotate updated');
    const isHasModel = this.currentOrigin == 'upload'

    if (this.instancedMesh) {
      this.mainScene.scene.remove(this.instancedMesh);
      this.instancedMesh = null;
    }
    if (this.modelType === 'voxel') {
      this.generateDepthTexturePNG(true).then(depthMaps => {
        this.depthMaps = depthMaps
        this.depthMap2Pos(depthMaps)
      });
    } else if (this.modelType === 'pointCloud') {
      this.updatePCDByRotateAndScale(
        this.scaleInfo,
        this.pointsCache[this.newPointsIndex].currentRotation,
        false)
      // this.showBoundingBox(this.originMesh, this.mainScene.scene)
    } else if (this.modelType === 'bbox') {
      if (isHasModel) {
        this.mainScene.scene.remove(this.originMesh);
        //new THREE.Mesh(finalGeometry, this.bboxMaterial);
        const { boundingBoxMesh, size } = this.createBoundingBoxMesh(this.boundingBoxOringinMesh, true);
        this.originMesh = boundingBoxMesh
        this.originMesh.position.y = 0;
        this.mainScene.scene.add(this.originMesh);
        this.boundingBoxOringinMesh.visible = false;
        this.originMesh.visible = true;
        this.bboxCache = {
          ...this.bboxCache,
          originMesh: new THREE.Mesh(
            this.originMesh.geometry.clone(),
            this.originMesh.material.clone()
          ),
          x: size.x,
          y: size.y,
          z: size.z
        };
        // 
      } else {
        // 计算变换后的几何体的边界框
        const boundingBox = new THREE.Box3().setFromObject(this.originMesh);

        let Xdiff = boundingBox.max.x - boundingBox.min.x;
        let Ydiff = boundingBox.max.y - boundingBox.min.y;
        let Zdiff = boundingBox.max.z - boundingBox.min.z;

        Xdiff = Math.min(Xdiff, 300);
        Ydiff = Math.min(Ydiff, 300);
        Zdiff = Math.min(Zdiff, 300);

        // 创建新的边界框几何体
        const newGeometry = new THREE.BoxGeometry(Xdiff, Ydiff, Zdiff);

        // 更新originMesh
        this.mainScene.scene.remove(this.originMesh);
        this.originMesh = new THREE.Mesh(newGeometry, this.bboxMaterial);
        this.originMesh.position.y = 0;
        this.mainScene.scene.add(this.originMesh);

        this.setMeshParameters(pre => ({
          ...pre,
          ["bbox"]: {
            ...pre.bbox,
            pos: {
              x: parseInt(Xdiff),
              y: parseInt(Ydiff),
              z: parseInt(Zdiff)
            }
          }
        }));
        // 更新bboxCache
        this.bboxCache = {
          ...this.bboxCache,
          originMesh: new THREE.Mesh(newGeometry.clone(), this.bboxMaterial.clone()),
          x: Xdiff,
          y: Ydiff,
          z: Zdiff
        }
      }
      this.mainScene.adjustControlPos(this.modelType)
      this.isAnimation = false
    }
  }


  updatePCDByRotateAndScale(scaleInfo, rotationInfo, normalize = false) {
    console.log(rotationInfo, 'rotationInfo');
    const { axisVector, angleInRadians } = rotationInfo;
    // 获取点云数据
    const myPoint = this.pointsCache[this.newPointsIndex];
    const toBeTransformedPoints = myPoint.originPoints;
    const currentRotationMatrix = new THREE.Matrix4().makeRotationAxis(axisVector, angleInRadians);

    let cumulativeRotationMatrix = new THREE.Matrix4().identity();

    cumulativeRotationMatrix.multiplyMatrices(currentRotationMatrix, this.pointsCache[this.newPointsIndex].currentRotation.accumulationMatrix);

    const { x: scaleX, y: scaleY, z: scaleZ } = scaleInfo;
    let scaleMatrix = new THREE.Matrix4().makeScale(scaleX, scaleY, scaleZ);

    const transformMatrix = new THREE.Matrix4();
    transformMatrix.multiplyMatrices(cumulativeRotationMatrix, scaleMatrix); // 先缩放后旋转

    let transformedPoints = toBeTransformedPoints.map(point => {
      const vector = new THREE.Vector3(point.position.x, point.position.y, point.position.z);
      vector.applyMatrix4(transformMatrix); // 应用变换矩阵
      return {
        ...point,
        position: { x: vector.x, y: vector.y, z: vector.z }
      };
    });

    if (normalize) {
      transformedPoints = this.normalizePoints(transformedPoints)
    }
    myPoint.instancedMesh = new THREE.InstancedMesh(
      this.pcdSphereGeometry,
      this.pcdMaterial,
      this.pointsTotalSum
    );
    myPoint.dummy = new THREE.Object3D();
    myPoint.points = transformedPoints;
    myPoint.params = this.normalizePoints(transformedPoints).slice(0, this.pointsTotalSum).map(point => [point.position.x, point.position.y, point.position.z]);

    this.points = myPoint.points;
    this.instancedMesh = myPoint.instancedMesh;
    this.dummy = myPoint.dummy;

    this.mainScene.scene.add(myPoint.instancedMesh);

    this.pointsCache[this.newPointsIndex] = {
      ...myPoint,
      points: transformedPoints,
      allTransformedPoints: transformedPoints
    };

    this.loadingcb && this.loadingcb();

    this.originMesh.visible = false;
    this.instancedMesh.visible = true;

    this.animatePointCloud('customAnimation', this.pointsCache[0].points, transformedPoints);
    myPoint.lastPoints = transformedPoints;

  }

  normalizePoints(transformedPoints) {
    let normalizedPoints = [];
    let maxDimension = 0;
    transformedPoints.forEach(point => {
      maxDimension = Math.max(maxDimension, Math.abs(point.position.x), Math.abs(point.position.y), Math.abs(point.position.z));
    });
    const scaleFactor = 0.95 / maxDimension;
    console.log(maxDimension, 'maxDimension', scaleFactor, 'scaleFactor');

    normalizedPoints = transformedPoints.map(point => ({
      ...point,
      position: {
        x: point.position.x * scaleFactor,
        y: point.position.y * scaleFactor,
        z: point.position.z * scaleFactor
      }
    }));
    return normalizedPoints
  }

  updateMeshByScale(type, newValueMap) {
    if (this.instancedMesh) {
      this.mainScene.scene.remove(this.instancedMesh);
      this.instancedMesh = null;
    }
    this.isAnimation = true
    if (type === 'voxel') {
      this.generateDepthTexturePNG(true).then(depthMaps => {
        this.depthMaps = depthMaps
        this.depthMap2Pos(depthMaps)
      });
    } else if (type === 'pointCloud') {
      this.updatePCDByRotateAndScale(
        this.scaleInfo,
        this.pointsCache[this.newPointsIndex].currentRotation,
        false)
      // this.mainScene.adjustControlPos(this.modelType)
    } else if (type === 'bbox') {
      const isHasModel = this.currentOrigin === 'upload'
      console.log(newValueMap, 'newValueMap', type, 'type');
      if (!isHasModel) {
        this.isAnimation = false
        return
      }
      this.mainScene.scene.remove(this.originMesh);
      const { boundingBoxMesh, size } = this.createBoundingBoxMesh(this.boundingBoxOringinMesh);
      this.originMesh = boundingBoxMesh
      this.mainScene.scene.add(this.originMesh);
      this.boundingBoxOringinMesh.visible = false;
      this.originMesh.visible = true;

      // this.showBoundingBox(this.originMesh, this.mainScene.scene)
      this.boundingBox.updateBBoxControls()
      // 更新缓存
      this.bboxCache = {
        ...this.bboxCache,
        originMesh: new THREE.Mesh(
          this.originMesh.geometry.clone(),
          this.originMesh.material.clone()
        ),
        x: size.x,
        y: size.y,
        z: size.z
      };
      this.isAnimation = false
    }
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }


  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  // originalGeometry: THREE.BufferGeometry
  checkWatertightness(originalGeometry) {
    // this.saveMesh(this.originMesh);
    console.log(originalGeometry, 'originalGeometry');
    let origeo = originalGeometry.clone();
    origeo.attributes = { position: origeo.attributes.position };

    let geo = BufferGeometryUtils.mergeVertices(origeo);


    var V = geo.attributes.position.count;
    var F = geo.index ? geo.index.count / 3 : 0;
    // Initialize edge counting
    let edgeCount = new Map();

    // Process geometry to count edges
    if (geo.index) {
      let indices = geo.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        let a = indices[i], b = indices[i + 1], c = indices[i + 2];
        let edges = [
          [Math.min(a, b), Math.max(a, b)],
          [Math.min(b, c), Math.max(b, c)],
          [Math.min(a, c), Math.max(a, c)]
        ];
        edges.forEach(edge => {
          let edgeKey = edge[0] + "_" + edge[1];
          if (edgeCount.has(edgeKey)) {
            edgeCount.set(edgeKey, edgeCount.get(edgeKey) + 1);
          } else {
            edgeCount.set(edgeKey, 1);
          }
        });
      }
    }
    // Counting non-manifold edges
    let nonManifoldEdges = 0;
    edgeCount.forEach((count) => {
      if (count != 2) {
        nonManifoldEdges++;
      }
    });


    var E = edgeCount.size;

    // Step 3: Apply Euler's formula
    var eulerCheck = V - E + F;
    var isWatertight = eulerCheck === 2;

    console.log(`Vertices: ${V}, Edges: ${E}, Faces: ${F}`);
    console.log(`Euler's Check (V - E + F): ${eulerCheck}`);
    console.log(`Is the mesh watertight? ${isWatertight ? "Yes" : "No"}`);
    console.log(`Non-manifold edges: ${nonManifoldEdges}`);

    let isNearManifold = nonManifoldEdges <= 10;

    if (!isNearManifold) {
      // this.tip({
      //   type: 'warning',
      //   content: "Oops! It looks like your uploaded mesh isn't watertight, which can cause issues during point cloud sampling. It is recommended to upload a watertight (manifold) mesh or try using a voxel condition."
      // })
      this.openModal();
    }
  }

  useVoxel() {
    this.clearModel()
    console.log(this.name, 'this.name');
    if (this.name === 'editorcondition') {
      this.editorpageUpdateMesh('voxel', this.initmodel, false)
    } else {
      this.homepageUpdateMesh('voxel', this.initmodel, false)
    }
  }

  useBoudingbox() {
    this.clearModel()
    this.homepageUpdateMesh('bbox', this.initmodel, false)
  }

  usePcd() {
    this.clearModel()
    this.homepageUpdateMesh('pointCloud', this.initmodel, false)
  }

  saveMesh(mesh) {
    const exporter = new OBJExporter();
    const result = exporter.parse(mesh);
    this.download(result, 'mesh.obj', 'text/plain');
  }

  download(data, filename, type) {
    const file = new Blob([data], { type: type });
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  confirmCondition() {
    if (this.modelType === 'bbox') {
      this.bboxCache.originMesh = this.originMesh
      this.bboxCache.boundingBoxOringinMesh = this.boundingBoxOringinMesh
    } else if (this.modelType === 'voxel') {
      this.voxelsCache[this.newVoxelIndex].originMesh = this.originMesh
    } else if (this.modelType === 'pointCloud') {
      this.pointsCache[this.newPointsIndex].originMesh = this.originMesh
    }
  }

  cancelConfirmed(type) {
    this.scaleInfo = { x: 1, y: 1, z: 1 }
    if (type === 'bbox') {
      this.bboxCache.originMesh = null
      this.bboxCache.boundingBoxOringinMesh = null
    } else if (type === 'voxel') {
      this.voxelsCache.splice(1)
    } else if (type === 'pointCloud') {
      this.pointsCache.splice(1)
    }
  }

}

class SceneInitializer {
  constructor(renderTarget, parent) {
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.renderTarget = renderTarget;
    this.threeController = parent

    this.initialCameraPosition = null; // 用于保存初始相机位置
    this.initialCameraQuaternion = null; // 用于保存初始相机朝向（旋转）
    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initLights();
    this.initGridHelper();
    this.render();
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.renderTarget.clientWidth, this.renderTarget.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x444444, 1);
    this.renderTarget.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(30, this.renderTarget.clientWidth / this.renderTarget.clientHeight, 1, 3000);
    this.camera.position.set(500, 400, 800);//model加载完之后更新位置
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 300;//model加载完之后更新
    this.controls.maxDistance = 2000;//model加载完之后更新
    this.controls.enablePan = false //右键拖拽
    this.controls.addEventListener('change', () => {
      this.renderer.render(this.scene, this.camera);
    });

    this.isViewTransitioning = false;
    this.controls.addEventListener('start', () => {
      this.threeController.handleQuitOrthCamera()
      this.threeController.name === "homecondition" && this.threeController.closePortal()
      this.isViewTransitioning = false;
    });
    this.controls.zoomSpeed = 0.5;
  }

  initLights() {
    //0xbfc3ca  0xffffff
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 50);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight2.position.set(-100, -150, -220);
    this.scene.add(directionalLight2);
  }

  initGridHelper() {
    const size = 2000;
    const divisions = 100;
    const gridHelper = new THREE.GridHelper(size, divisions, 0xCCCCCC, 0xCCCCCC);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    gridHelper.name = 'gridHelper'
    this.scene.add(gridHelper);

    const voxelsize = 2000;
    const voxeldivisions = 2000;
    const voxelgridHelper = new THREE.GridHelper(voxelsize, voxeldivisions, 0xCCCCCC, 0xCCCCCC);
    voxelgridHelper.material.opacity = 0.2;
    voxelgridHelper.material.transparent = true;
    voxelgridHelper.name = 'voxelgridHelper'
    this.scene.add(voxelgridHelper);
  }

  onWindowResize() {
    if (this.threeController.canResize) {
      setTimeout(() => {
        this.camera.aspect = this.renderTarget.clientWidth / this.renderTarget.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.renderTarget.clientWidth, this.renderTarget.clientHeight);
        this.renderer.render(this.scene, this.camera);
      }, 300);
    }
  }

  getDiagonalLength(type) {
    const bboxDistance = 2
    switch (type) {
      case 'bbox': {

        return Math.sqrt(this.threeController.bboxCache.x ** 2 + this.threeController.bboxCache.y ** 2 + this.threeController.bboxCache.z ** 2) * bboxDistance
      }

      case 'voxel': {
        let boundingBox = new THREE.Box3().setFromObject(this.threeController.originMesh);
        let diagonalLength = 10
        if (!boundingBox.isEmpty()) {
          const maxDimension = Math.max(
            boundingBox.max.x - boundingBox.min.x,
            boundingBox.max.y - boundingBox.min.y,
            boundingBox.max.z - boundingBox.min.z
          );

          diagonalLength = maxDimension * 3;
        } else {
          console.error('Bounding box is empty.');
        }
        return diagonalLength
      }
      case 'pointCloud': {
        let boundingBox = new THREE.Box3().setFromObject(this.threeController.originMesh);
        let diagonalLength = 10
        if (!boundingBox.isEmpty()) {
          const maxDimension = Math.max(
            boundingBox.max.x - boundingBox.min.x,
            boundingBox.max.y - boundingBox.min.y,
            boundingBox.max.z - boundingBox.min.z
          );

          diagonalLength = maxDimension * 3;
        } else {
          console.error('Bounding box is empty.');
        }
        return diagonalLength
      }
    }
  }

  getFrontCameraPosition(type) {
    const diagonalLength = this.getDiagonalLength(type);
    console.log("当前的3d condition类型", type);
    console.log("更新boundingbox对角线距离", diagonalLength);
    switch (type) {
      case 'bbox':
        return new THREE.Vector3(0.5 * diagonalLength, 0.4 * diagonalLength, 0.8 * diagonalLength);
      case 'voxel':
        return new THREE.Vector3(0.7 * diagonalLength, 0.6 * diagonalLength, 0.9 * diagonalLength);
      case 'pointCloud':
        return new THREE.Vector3(0.7 * diagonalLength, 0.6 * diagonalLength, 0.9 * diagonalLength);
    }
  }


  animateCamera(targetPosition, duration, toTop = false, successCallback = null, specialX = false) {
    this.threeController.isAnimation = true;
    this.controls.enabled = false;
    const camera = this.camera;
    const startTime = Date.now();
    const startPosition = camera.position.clone();
    const startRotation = camera.quaternion.clone();
    this.isViewTransitioning = true;

    // 计算目标旋转
    const targetRotation = new THREE.Quaternion();
    let lookAtMatrix = new THREE.Matrix4().lookAt(targetPosition, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
    targetRotation.setFromRotationMatrix(lookAtMatrix);

    function animate() {
      function vectorLerp(startVec, endVec, alpha) { //线性插值两个向量。
        return startVec.clone().lerp(endVec, alpha);
      }

      function easeInOutPoly(t, order = 2) { //计算缓动（easing）效果的值。
        if (t < 0.5) {
          return Math.pow(2, order - 1) * Math.pow(t, order);
        } else {
          return 1 - Math.pow(-2 * t + 2, order) / 2;
        }
      }

      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const t2 = easeInOutPoly(t, 2);

      let currentPosition = vectorLerp(startPosition, targetPosition, t2);
      if (toTop) {
        const positionZY = vectorLerp(new THREE.Vector3(0, 0, this.controls.minDistance), new THREE.Vector3(0, this.controls.minDistance, 0), t);
        const positionAZ = vectorLerp(startPosition, new THREE.Vector3(0, 0, this.controls.minDistance), t);
        currentPosition = vectorLerp(positionAZ, positionZY, t2);
      } else if (specialX) {
        const positionZX = vectorLerp(new THREE.Vector3(0, 0, this.controls.minDistance), new THREE.Vector3(this.controls.minDistance, 0, 0), t);
        const positionAZ = vectorLerp(startPosition, new THREE.Vector3(0, 0, this.controls.minDistance), t);
        currentPosition = vectorLerp(positionAZ, positionZX, t2);
      }
      camera.position.copy(currentPosition);

      // 使用球面插值进行旋转
      camera.quaternion.slerpQuaternions(startRotation, targetRotation, t2);

      if (this.isViewTransitioning) {
        if (t < 1) {
          requestAnimationFrame(animate.bind(this));
        } else {

          this.controls.enabled = true;
          successCallback && successCallback();
          this.isViewTransitioning = false;
          this.threeController.isAnimation = false;
        }
      }
    }

    animate.bind(this)();
  }

  restoreCameraInitialPos() {
    const newPosition = this.initialCameraPosition;
    this.animateCamera(newPosition, 1000);
  }

  switchOrthoCamera(isDoneCallback, index) {
    const oldY = this.switchIndex % 3 == 1
    const newX = index % 3 == 0
    const specialX = oldY && newX
    this.switchIndex = index
    // this.switchIndex === undefined ? (this.switchIndex = 0) : ++this.switchIndex;
    const newPosition = new THREE.Vector3(
      (this.switchIndex % 3 == 0) * this.controls.minDistance,
      (this.switchIndex % 3 == 1) * this.controls.minDistance,
      (this.switchIndex % 3 == 2) * this.controls.minDistance
    );

    // this.orthoCameraAxis = undefined;
    isDoneCallback && isDoneCallback(undefined);
    let successCallback = () => {
      console.log("successCallback", ["X", "Y", "Z"][this.switchIndex % 3]);
      // this.orthoCameraAxis = this.switchIndex % 3;
      isDoneCallback && isDoneCallback({
        orthoCameraAxis: this.switchIndex % 3
      });
    }

    this.animateCamera(newPosition, 1000, this.switchIndex % 3 == 1, successCallback, specialX);
  }

  adjustControlPos(type) {
    this.controls.target = this.threeController.originMesh.position;
    const maxDim = this.getDiagonalLength(type)
    this.controls.minDistance = maxDim
    this.controls.maxDistance = 5 * maxDim;
    this.controls.zoomSpeed = 0.1 / maxDim;
    this.controls.target = this.threeController.originMesh.position;
    this.controls.update();
    switch (type) {
      case 'bbox': {
        this.scene.getObjectByName("gridHelper").visible = true;
        this.scene.getObjectByName("voxelgridHelper").visible = false;
        this.controls.enableZoom = true
      }
        break;
      case 'voxel': {
        this.scene.getObjectByName("gridHelper").visible = false;
        this.scene.getObjectByName("voxelgridHelper").visible = true;
        this.controls.enableZoom = false
      }
        break;
      case 'pointCloud': {
        this.scene.getObjectByName("gridHelper").visible = false;
        this.scene.getObjectByName("voxelgridHelper").visible = true;
        this.controls.enableZoom = false
      }
        break;
      default:
        break;
    }
  }

  adjustCameraPos(type) {
    const newPosition = this.getFrontCameraPosition(type)
    if (type === 'bbox') {
      this.camera.position.set(...newPosition);
      this.camera.lookAt(this.threeController.originMesh.position);
    }
    this.initialCameraPosition = newPosition;
    this.initialCameraQuaternion = this.camera.quaternion.clone();
    console.log('更新后的camera Position', newPosition);
    this.restoreCameraInitialPos()

  }

  exportSnapshot() {
    return new Promise((resolve, reject) => {
      if (this.threeController.isAnimation) {
        reject(new Error("Animation in progress, cannot export snapshot."));
        return;
      }
      // 创建一个新的渲染器，设置alpha为true以支持透明背景
      const exportRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      exportRenderer.setSize(this.renderTarget.clientWidth, this.renderTarget.clientHeight);
      exportRenderer.setPixelRatio(window.devicePixelRatio);
      exportRenderer.setClearColor(0x000000, 0); // 这里将透明度设置为0
      const tempScene = this.scene.clone();
      const tempCamera = new THREE.PerspectiveCamera(30, this.renderTarget.clientWidth / this.renderTarget.clientHeight, 1, 3000);

      const newPosition = this.getFrontCameraPosition(this.threeController.modelType)
      if (['voxel', 'pointCloud'].includes(this.threeController.modelType)) {
        tempScene.scale.set(1.2, 1.2, 1.2);
      }
      tempCamera.position.set(...newPosition);
      tempCamera.lookAt(this.threeController.originMesh.position);
      // tempCamera.quaternion.copy(this.initialCameraQuaternion);
      tempCamera.updateProjectionMatrix();

      const gridHelper = tempScene.getObjectByName("gridHelper");
      const voxelgridHelper = tempScene.getObjectByName("voxelgridHelper");
      if (gridHelper) {
        tempScene.remove(gridHelper);
      }
      if (voxelgridHelper) {
        tempScene.remove(voxelgridHelper);
      }

      exportRenderer.render(tempScene, tempCamera);
      // 导出为base64格式，确保包含透明度信息
      const imgData = exportRenderer.domElement.toDataURL("image/png");
      // if (this.threeController.modelType === 'voxel') {
      //   console.log(this.threeController.newVoxelIndex);
      //   this.threeController.meshParameters['voxel'].params = this.threeController.voxelsCache[this.threeController.newVoxelIndex].params
      // }
      exportRenderer.dispose();
      resolve(imgData)
    });
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    // 移除其它资源例如材质、几何体等
  }
}

class BoundingBox {
  constructor(threeController) {
    this.threeController = threeController
    this.mainScene = threeController.mainScene
  }

  loadBasicBBox() {
    this.threeController.currentOrigin = 'handcraft'
    const geometry = new THREE.BoxGeometry(
      this.threeController.boxParameters.x,
      this.threeController.boxParameters.y,
      this.threeController.boxParameters.z
    )
    this.threeController.originMesh = new THREE.Mesh(
      geometry,
      this.threeController.bboxMaterial);
    this.threeController.originMesh.position.y = 0;
    this.threeController.originMesh.visible = true
    this.mainScene.scene.add(this.threeController.originMesh);

    this.threeController.bboxCache = {
      ...this.threeController.bboxCache,
      originMesh: new THREE.Mesh(
        this.threeController.originMesh.geometry.clone(),
        this.threeController.originMesh.material.clone()),
      x: this.threeController.boxParameters.x,
      y: this.threeController.boxParameters.y,
      z: this.threeController.boxParameters.z,
      currentOrigin: 'handcraft'
    }
    this.threeController.currentObeject = this.threeController.bboxCache
    this.threeController.isAnimation = false
  }

  updateWHLOrScaleMesh(newValue, type) {
    const isHome = this.threeController.name === 'homecondition'
    const isHasModel = this.threeController.currentOrigin === 'upload'

    if (type === 'bbox') {
      if (isHasModel) {
        this.scaleBoxWithShowOriginModel(newValue, type)
      } else {
        this.scaleBox(newValue)
      }
    } else {
      this.threeController.scaleInfo = { ...newValue }
      const isNeedNormal = this.threeController.modelType === 'voxel'
      if (isHome || isHasModel) {
        if (this.threeController.instancedMesh) {
          this.mainScene.scene.remove(this.threeController.instancedMesh);
        }
        // this.threeController.instancedMesh.visible = true
        this.threeController.originMesh.visible = true

        //PLAN A
        this.threeController.transformer.scaleMesh(
          this.threeController.originMesh,
          new THREE.Vector3(newValue.x, newValue.y, newValue.z),
          isNeedNormal)
        if (!isNeedNormal) {
          const diagonalLength = this.mainScene.getDiagonalLength(this.threeController.modelType);
          this.mainScene.controls.minDistance = diagonalLength
          this.mainScene.controls.maxDistance = diagonalLength;
          this.mainScene.controls.target = this.threeController.originMesh.position;
          this.mainScene.controls.update();
        }
        //PLAN B
        // this.threeController.transformer.updateMeshByRotateAndScale(
        //   this.threeController.originMesh,
        //   new THREE.Vector3(newValue.x, newValue.y, newValue.z),
        //   this.threeController.pointsCache[this.threeController.newPointsIndex].currentRotation,
        //   true)
      }
    }
  }

  scaleBoxWithShowOriginModel(newValue, type) {
    this.threeController.whlInfo = { ...newValue };
    this.threeController.boundingBoxOringinMesh.visible = true;
    this.threeController.originMesh.visible = false;
    const originSize = this.threeController.bboxCache.originSize
    // 更新 boundingBoxOringinMesh 的尺寸
    const scale = new THREE.Vector3(
      newValue.x / originSize.x,
      newValue.y / originSize.y,
      newValue.z / originSize.z
    );
    this.threeController.transformer.scaleMesh(
      this.threeController.boundingBoxOringinMesh,
      new THREE.Vector3(scale.x, scale.y, scale.z),
      false)
    this.threeController.boundingBoxOringinMesh.position.y = 0

    this.threeController.bboxCache = {
      ...this.threeController.bboxCache,
      x: newValue.x,
      y: newValue.y,
      z: newValue.z,
    }
    this.threeController.mainScene.adjustControlPos(type)
  }



  scaleBox(newValue) {
    if (!this.threeController.originMesh) {
      console.error('Origin mesh is not initialized.');
      return;
    }
    this.threeController.boxParameters = newValue;
    if (this.threeController.originMesh.geometry) {
      this.threeController.originMesh.geometry.dispose();
    }
    this.threeController.originMesh.geometry = new THREE.BoxGeometry(
      this.threeController.boxParameters.x,
      this.threeController.boxParameters.y,
      this.threeController.boxParameters.z
    );
    this.threeController.originMesh.visible = true;
    this.threeController.originMesh.position.y = 0;
    const diagonalLength = this.mainScene.getDiagonalLength('bbox');
    this.mainScene.controls.minDistance = diagonalLength;
    this.mainScene.controls.maxDistance = diagonalLength * 2;
    this.mainScene.controls.target = this.threeController.originMesh.position;
    this.throttle(() => {
      this.threeController.bboxCache = {
        ...this.threeController.bboxCache,
        originMesh: new THREE.Mesh(
          this.threeController.originMesh.geometry.clone(),
          this.threeController.originMesh.material.clone()
        ),
        x: this.threeController.bboxCache.x,
        y: this.threeController.bboxCache.y,
        z: this.threeController.bboxCache.z
      };
    }, 200)();
    this.mainScene.controls.update();
  }

  updateBBoxControls() {
    const diagonalLength = this.mainScene.getDiagonalLength('bbox');
    this.mainScene.controls.minDistance = diagonalLength;
    this.mainScene.controls.maxDistance = diagonalLength * 2;
    this.mainScene.controls.target = this.threeController.originMesh.position;
    this.mainScene.controls.update();
  }

  throttle(fn, delay = 200) {
    let timer = null;
    return function (...args) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
}

class MeshTransformer {
  constructor(threeController) {
    this.meshStates = new WeakMap();
    this.threeController = threeController;
  }

  getState(mesh) {
    if (!this.meshStates.has(mesh)) {
      console.log('初始化状态');
      this.meshStates.set(mesh, {
        originalGeometry: mesh.geometry.clone(),
        initialRotation: new THREE.Euler(),
        currentRotation: new THREE.Euler(),
        initialScale: new THREE.Vector3(1, 1, 1),
        currentScale: new THREE.Vector3(1, 1, 1),
        originalBoundingBox: new THREE.Box3().setFromObject(mesh),
        axisVector: new THREE.Vector3(0, 0, 0),
        angleInRadians: 0,
        accumulationMatrix: new THREE.Matrix4().identity(),
      });
    }
    return this.meshStates.get(mesh);
  }

  normalizeObject(object) {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);
    const minTargetSize = 1.9;

    let scale;
    if (maxDimension > minTargetSize) {
      scale = minTargetSize / maxDimension;
    } else if (maxDimension < minTargetSize) {
      scale = minTargetSize / maxDimension;
    } else {
      scale = 1;
    }

    object.scale.multiplyScalar(scale);
    object.updateMatrixWorld(true);
    return scale;
  }

  applyTransforms(mesh, state) {
    const transformedGeometry = state.originalGeometry.clone();
    // 应用缩放
    const scaleMatrix = new THREE.Matrix4().makeScale(
      state.currentScale.x,
      state.currentScale.y,
      state.currentScale.z
    );
    transformedGeometry.applyMatrix4(scaleMatrix);

    // 应用旋转
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(state.currentRotation);
    transformedGeometry.applyMatrix4(rotationMatrix);

    // 更新 mesh 的几何体
    mesh.geometry.dispose();
    mesh.geometry = transformedGeometry;

    // 重置 mesh 的变换
    // mesh.position.set(0, 0, 0);
    // mesh.rotation.copy(state.currentRotation);
    // mesh.scale.copy(state.currentScale);
    // mesh.rotation.set(0, 0, 0);
    // mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();
  }

  bBoxNormalize(mesh, maxSize = 300) {
    // 更新物体的世界矩阵
    mesh.updateMatrixWorld(true);

    // 计算包围盒
    const boundingBox = new THREE.Box3().setFromObject(mesh);

    // 获取包围盒的尺寸
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    // 计算每个方向上的缩放因子
    const scaleX = size.x > maxSize ? maxSize / size.x : 1;
    const scaleY = size.y > maxSize ? maxSize / size.y : 1;
    const scaleZ = size.z > maxSize ? maxSize / size.z : 1;

    // 找出最小的缩放因子（最大的缩放效果）
    const minScale = Math.min(scaleX, scaleY, scaleZ);

    // 如果不需要缩放，直接返回
    if (minScale === 1) {
      return mesh;
    }

    // 应用缩放
    mesh.scale.multiplyScalar(minScale);

    // 更新物体的世界矩阵
    mesh.updateMatrixWorld(true);

    return mesh;
  }

  rotateMesh(mesh, axis, angleRadians, normalize = false, boundingBoxNormalize = false) {
    const state = this.getState(mesh);
    console.log('rotateMeshrotateMesh');
    // 保存当前旋转状态
    mesh.rotation.copy(state.currentRotation);
    mesh.rotateOnWorldAxis(axis, angleRadians);
    mesh.updateMatrixWorld(true);
    // 更新包围盒
    // this.threeController.showBoundingBox(mesh, this.threeController.mainScene.scene);
    if (normalize) {
      this.normalizeObject(mesh);
    }
    if (boundingBoxNormalize) {
      this.bBoxNormalize(mesh)
    }

    // state.currentRotation.copy(mesh.rotation);
    // this.applyTransforms(mesh, state);
    return mesh;
  }
  // 原模型方案
  scaleMesh(mesh, scaleVector, normalize = false, boundingBoxNormalize = false) {
    const state = this.getState(mesh);

    // 始终基于初始比例进行缩放
    let newScale = new THREE.Vector3().copy(state.initialScale);
    newScale.multiply(scaleVector);
    mesh.scale.copy(newScale);
    mesh.updateMatrixWorld(true);

    if (normalize) {
      this.normalizeObject(mesh);
    }

    if (boundingBoxNormalize) {
      this.bBoxNormalize(mesh)
    }


    state.currentScale.copy(newScale);
    // mesh.scale.set(newScale.x, newScale.y, newScale.z);
    // mesh.updateMatrixWorld(true);

    // this.applyTransforms(mesh, state);
    return mesh;
  }

  // updateMeshByRotateAndScale(mesh, scaleInfo, rotationInfo, normalize = false) {
  //   console.log(rotationInfo, 'rotationInfo');
  //   const { axisVector, angleInRadians } = rotationInfo;
  //   const { x: scaleX, y: scaleY, z: scaleZ } = scaleInfo;

  //   // Get the current state of the mesh
  //   const state = this.getState(mesh);
  //   const { accumulationMatrix } = state;

  //   // Create current rotation matrix
  //   const currentRotationMatrix = new THREE.Matrix4().makeRotationAxis(axisVector, angleInRadians);

  //   // Calculate cumulative rotation matrix
  //   let cumulativeRotationMatrix = new THREE.Matrix4().identity();
  //   cumulativeRotationMatrix.multiplyMatrices(currentRotationMatrix, accumulationMatrix);

  //   // Create scale matrix
  //   let scaleMatrix = new THREE.Matrix4().makeScale(scaleX, scaleY, scaleZ);

  //   // Create transform matrix
  //   const transformMatrix = new THREE.Matrix4();
  //   transformMatrix.multiplyMatrices(cumulativeRotationMatrix, scaleMatrix); // Scale first, then rotate

  //   // Apply transform matrix to mesh
  //   mesh.matrix.copy(transformMatrix);
  //   mesh.matrixAutoUpdate = false;
  //   mesh.updateMatrixWorld(true);

  //   if (normalize) {
  //     const normalizeObject = (object, targetSize = 1.9) => {
  //       const boundingBox = new THREE.Box3().setFromObject(object);
  //       const size = new THREE.Vector3();
  //       boundingBox.getSize(size);
  //       const maxRadius = Math.max(size.x, size.y, size.z) / 2;
  //       if (Math.abs(maxRadius) <= 1) {
  //         return 1;
  //       } else {
  //         const scale = targetSize / Math.max(size.x, size.y, size.z);
  //         return scale;
  //       }
  //     }

  //     const scaleFactor = normalizeObject(mesh);
  //     console.log(scaleFactor, 'scaleFactor');

  //     // Apply normalization scale
  //     const normalizeMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor);
  //     mesh.matrix.multiply(normalizeMatrix);
  //     mesh.updateMatrixWorld(true);
  //   }

  //   // Update the state
  //   // this.setState(mesh, {
  //   //   ...state,
  //   //   accumulationMatrix: cumulativeRotationMatrix
  //   // });
  // }

  resetMesh(mesh) {
    const state = this.getState(mesh);

    state.currentRotation.set(0, 0, 0);
    state.currentScale.copy(state.initialScale);

    this.applyTransforms(mesh, state);
    return mesh;
  }

  updateRotation(mesh, newRotation) {
    const state = this.getState(mesh);
    state.currentRotation.copy(newRotation);
    // this.applyTransforms(mesh, state);
  }

  getCurrentRotation(mesh) {
    const state = this.getState(mesh);
    return state.currentRotation.clone();
  }

  getCurrentScale(mesh) {
    const state = this.getState(mesh);
    return state.currentScale.clone();
  }
}


export default ThreeController
