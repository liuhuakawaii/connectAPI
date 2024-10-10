
import '../../index.css'
import React, { useEffect, useRef, useState } from 'react'

//hooks api
import {
  rodinUploadedImages,
} from '../../store'
import { useRecoilState } from 'recoil'

import * as THREE from 'three149';
import { OBJExporter } from 'three149/examples/jsm/exporters/OBJExporter';

//component
const ModelPresets = React.lazy(() => import('./components/ModelPresets'));

//Assets
import smallBox from './components/ModelPresets/assets/small_box.png'
import bigBox from './components/ModelPresets/assets/big_box.png'
import pointcloud from './components/ModelPresets/assets/pointcloud-home.png'
import voxel from './components/ModelPresets/assets/voxel-home.png'
import bbox from './components/ModelPresets/assets/bbox-home.png'
import voxelCover from './components/ModelPresets/assets/voxelCover.png'
import pointcloudCover from './components/ModelPresets/assets/pointcloudCover.png'
import { pos2Base64 } from '../../utils/format';
import ParamsDisplay from './components/ParamsDisplay';
import { useTips } from '../../common/GlobalTips';
import { useTranslation } from "react-i18next";

import { BiCylinder, BiCube } from "react-icons/bi"
import { ImSphere } from "react-icons/im"
import { TbCone } from "react-icons/tb";
import { LiaRingSolid } from "react-icons/lia";
import { IoAdd } from "react-icons/io5";


const defaultMeshParameters = {
  'bbox': {
    entryname: 'Bounding Box',
    img: bbox,
    cover_small: smallBox,
    cover_big: bigBox,
    default_cover: smallBox,
    originFile: null,
    confirmed: false,
    params: [100, 100, 100, 1],
    pos: { x: 100, y: 100, z: 100 },
    rotation: [0, 0, 0]
  },
  'voxel': {
    entryname: 'Voxel',
    img: voxel,
    default_cover: voxelCover,
    cover_small: null,
    cover_big: null,
    confirmed: false,
    originFile: null,
    params: [],
    pos: [],
    voxel_condition_cfg: true,
    voxel_condition_weight: 1.00,
    wlhparams: { x: 1, y: 1, z: 1 },
    rotation: [0, 0, 0]
  },
  'pointCloud': {
    entryname: 'Point Cloud',
    img: pointcloud,
    default_cover: pointcloudCover,
    cover_small: null,
    cover_big: null,
    originFile: null,
    confirmed: false,
    params: [],
    pos: [],
    wlhparams: { x: 1, y: 1, z: 1 },
    pcd_condition_uncertainty: 0.010,
    rotation: [0, 0, 0]
  }
}
function NewRodin() {
  const { t } = useTranslation();
  const tip = useTips();
  const rodinPageRef = useRef(null);
  const ShapesGeneratorRef = useRef(null);
  const ParamsDisplayRef = useRef(null);
  const boundingBoxRef = useRef(null);
  const [uploadImgBlob] = useRecoilState(rodinUploadedImages);
  const [uploadImageRaw] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [meshParameters, setMeshParameters] = useState(defaultMeshParameters);
  const meshValues = Object.values(meshParameters);

  const [updateFlag, setUpdateFlag] = useState(0);
  const [voxelScale, setVoxelScale] = useState(meshValues[1]?.voxel_condition_weight);
  const [voxelMode, setVoxelMode] = useState(meshValues[1]?.voxel_condition_cfg);
  const [pcdUncertainty, setPcdUncertainty] = useState(meshValues[2]?.pcd_condition_uncertainty);

  const [selectedShape, setSelectedShape] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ShapesGeneratorRef.current) {
      ShapesGeneratorRef.current = new ShapesGenerator();
      handleExampleClick('cube');
    }
  }, []);

  const handleExampleClick = (shape) => {
    const b = boundingBoxRef.current;
    const ShapesGeneratorController = ShapesGeneratorRef.current;

    setSelectedShape(shape);
    if (shape === 'add') {
      b.entryController.current.fileInputRef.current.click();
      return;
    }

    if (ShapesGeneratorController) {
      const shapeCreators = {
        cube: ShapesGeneratorController.createCube,
        sphere: ShapesGeneratorController.createSphere,
        cylinder: ShapesGeneratorController.createCylinder,
        cone: ShapesGeneratorController.createCone,
        torus: ShapesGeneratorController.createTorus
      };

      const createShape = shapeCreators[shape];
      if (createShape) {
        createShape.call(ShapesGeneratorController).then(data => {
          b.handlerFiles(data);
        });
      }
    }
  };

  const handleConditionChange = (condition) => {
    const threeController = boundingBoxRef?.current?.threeController?.current;
    console.log(threeController?.isAnimation, 'threeController?.isAnimation');

    if (threeController?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_VOXEL_COMPLETE'), type: 'warning' });
      return;
    }

    setActiveIndex(condition);

    if (boundingBoxRef?.current?.openThreeWrapper && condition !== activeIndex) {
      if (threeController) {
        const actions = {
          0: () => threeController.useBoudingbox(),
          1: () => threeController.useVoxel(),
          2: () => threeController.usePcd()
        };
        if (selectedShape === 'add') {
          actions[condition]?.();
        } else {
          const b = boundingBoxRef.current;
          const ShapesGeneratorController = ShapesGeneratorRef.current;
          const shapeCreators = {
            cube: ShapesGeneratorController.createCube,
            sphere: ShapesGeneratorController.createSphere,
            cylinder: ShapesGeneratorController.createCylinder,
            cone: ShapesGeneratorController.createCone,
            torus: ShapesGeneratorController.createTorus
          };

          const createShape = shapeCreators[selectedShape];
          if (createShape) {
            createShape.call(ShapesGeneratorController).then(data => {
              b.handlerFiles(data, condition);
            });
          }
        }
        setTimeout(() => {
          setUpdateFlag(prev => prev + 1);
        }, 300);
      }
    }
  };

  const handCopyCode = () => {
    ParamsDisplayRef.current.handleCopy();
  };

  const renderShapeButton = (shape) => {
    const icons = {
      cube: <BiCube className="w-12 h-12 text-blue-400" />,
      sphere: <ImSphere className="w-12 h-12 text-green-400" />,
      cylinder: <BiCylinder className="w-12 h-12 text-purple-400" />,
      cone: <TbCone className="w-12 h-12 text-yellow-400" />,
      torus: <LiaRingSolid className="w-12 h-12 text-pink-400" />,
      add: <IoAdd className="w-12 h-12 text-white" />
    };

    return (
      <button
        key={shape}
        onClick={() => handleExampleClick(shape)}
        className={`p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${selectedShape === shape && selectedShape !== 'add'
          ? 'bg-[#4a00e0] shadow-lg shadow-blue-500/50'
          : 'bg-[rgba(255,255,255,0.2)] hover:bg-gray-700'
          }`}
      >
        {icons[shape]}
      </button>
    );
  };

  const renderConditionButton = (condition, index) => (
    <button
      key={condition.entryname}
      onClick={() => handleConditionChange(index)}
      className={`px-6 py-3 flex items-center gap-3 rounded-lg transition-all duration-300 ease-in-out border [background:linear-gradient(180deg,rgba(71,71,76,0.5)_50%,rgba(26,101,121,0.5)_100%)] 
        ${activeIndex === index
          ? '[border-color:#28e4f0]'
          : '[border-color:transparent] transition-300-ease  transition-300-ease hover:text-[rgba(255,255,255,1)]  hover:[background:linear-gradient(180deg,rgba(71,71,76,0.8)_50%,rgba(26,101,121,0.8)_100%)]'
        }`}
    >
      <img src={condition.img} className='w-[28px]' alt={condition.entryname} />
      <span>{condition.entryname}</span>
    </button>
  );

  return (
    <div ref={rodinPageRef} className='flex relative flex-col items-center transition-300-ease-in-out min-h-[100vh] overflow-x-hidden overflow-y-scroll [-webkit-overflow-scrolling:auto]'>
      {/* Background gradients */}
      <div className='fixed z-[-1] left-[10vw] top-[-10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,#C111FF4D,transparent,#121317)] bg-no-repeat blur-[100px]' />
      <div className='fixed z-[-1] left-[-10%] top-[10%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,#11F1FF80,transparent,#121317)] bg-no-repeat blur-[100px]' />
      <div className='fixed z-[-10] right-[-10%] top-[20%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,#11F1FF80,transparent,#121317)] bg-no-repeat blur-[100px]' />
      <div className='fixed z-[-10] right-0 bottom-[-10vw] w-[100vw] h-[100vw] rounded-full bg-[radial-gradient(circle,#11F1FF80,transparent,#121317)] bg-no-repeat blur-[100px]' />

      <div className="min-h-screen w-[960px] rounded-xl bg-[rgba(0,0,0,0.1)] text-blue-100 p-8 flex items-center justify-center">
        <div className="bg-black bg-opacity-50 p-8 rounded-xl shadow-2xl max-w-4xl w-full backdrop-filter backdrop-blur-sm border border-blue-500 border-opacity-30">
          <h2 className="text-4xl font-bold mb-8 text-center text-blue-300 animate-pulse">3D Converter</h2>

          {/* Examples */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-200">Examples</h3>
            <div className="flex justify-around">
              {['cube', 'sphere', 'cylinder', 'cone', 'torus', 'add'].map(renderShapeButton)}
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-200">Conditions</h3>
            <div className="flex justify-around">
              {meshValues.map(renderConditionButton)}
            </div>
          </div>

          {/* Model Upload and Parameters */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-200">Upload Model & Adjust Parameters</h3>
            <ModelPresets
              ref={boundingBoxRef}
              uploadImageRaw={uploadImageRaw}
              uploadImgBlob={uploadImgBlob}
              meshParameters={meshParameters}
              activeIndex={activeIndex}
              voxelScale={voxelScale}
              voxelMode={voxelMode}
              pcdUncertainty={pcdUncertainty}
              updateFlag={updateFlag}
              setUpdateFlag={setUpdateFlag}
              setMeshParameters={setMeshParameters}
              setActiveIndex={setActiveIndex}
              setVoxelScale={setVoxelScale}
              setVoxelMode={setVoxelMode}
              setPcdUncertainty={setPcdUncertainty}
            />
          </div>

          {/* Generate Code */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-blue-200">Generated Code</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-4 relative">
              <ParamsDisplay
                copied={copied}
                ref={ParamsDisplayRef}
                meshValues={meshValues}
                activeIndex={activeIndex}
                voxelScale={voxelScale}
                voxelMode={voxelMode}
                pcdUncertainty={pcdUncertainty}
                boundingBoxRef={boundingBoxRef}
                updateFlag={updateFlag}
                setCopied={setCopied}
              />
            </div>
            <button
              onClick={handCopyCode}
              className="w-full py-3 bg-[rgba(74,0,224,1)] rounded-lg hover:bg-[rgba(74,0,224,1)] transition-colors text-white font-semibold shadow-lg shadow-blue-500/50 hover:shadow-blue-500/75"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


class ShapesGenerator {
  constructor() {
    this.createShapescene = new THREE.Scene();
    this.currentShape = null;
  }

  async createCube(size = 100) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    return await this.createShape(geometry);
  }

  async createSphere(radius = 50, widthSegments = 32, heightSegments = 32) {
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    return await this.createShape(geometry);
  }

  async createCylinder(radiusTop = 50, radiusBottom = 50, height = 100, radialSegments = 32) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    return await this.createShape(geometry);
  }

  async createCone(radius = 50, height = 100, radialSegments = 32) {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    return await this.createShape(geometry);
  }

  async createTorus(radius = 50, tube = 20, radialSegments = 16, tubularSegments = 100) {
    const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    return await this.createShape(geometry);
  }

  createShape(geometry) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    if (this.currentShape) {
      this.createShapescene.remove(this.currentShape);
    }
    this.currentShape = new THREE.Mesh(geometry, material);
    this.createShapescene.add(this.currentShape);
    return new Promise((resolve, reject) => {
      try {
        if (!this.currentShape) {
          throw new Error('还没有创建任何形状');
        }
        const randomName = this.generateRandomString(6) + ".obj";
        const exporter = new OBJExporter();
        const result = exporter.parse(this.createShapescene);
        const blob = new Blob([result], { type: 'text/plain' });
        const file = new File([blob], randomName, { type: 'text/plain' });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

export default NewRodin