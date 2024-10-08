import { useState, useEffect, useRef } from 'react'
import { MdCheckBox, MdCloud, MdFileUpload } from 'react-icons/md'
import { BiCylinder, BiCube } from "react-icons/bi"
import { ImSphere } from "react-icons/im"

export default function ConnectAPI() {
  const fileInputRef = useRef(null)
  const threeController = useRef(null)
  const [selectedCondition, setSelectedCondition] = useState('BoundingBox')
  const [generatedCode, setGeneratedCode] = useState('')
  const [selectedShape, setSelectedShape] = useState(null)
  const [modelParameters, setModelParameters] = useState({ scale: 1, rotation: 0 })
  const [loading, setLoading] = useState(false)


  const handleExampleClick = (shape) => {
    setSelectedShape(shape)
    // Simulating shape conversion
    setTimeout(() => {
      setGeneratedCode(`Converting to ${shape}...`)
    }, 500)
  }

  const handleConditionChange = (condition) => {
    setSelectedCondition(condition)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    // Here you would handle the actual file drop
    setGeneratedCode('Processing dropped file...')
  }

  const handleParameterChange = (param, value) => {
    setModelParameters(prev => ({ ...prev, [param]: value }))
  }

  useEffect(() => {
    // Generate code based on selected options and parameters
    const code = `
      {
        "shape": "${selectedShape || 'None'}",
        "condition": "${selectedCondition}",
        "parameters": ${JSON.stringify(modelParameters)}
      }
    `
    setGeneratedCode(code)
  }, [selectedShape, selectedCondition, modelParameters])


  const handleFileInputChange = (e) => {
    const files = [...e.target.files];
    handlerFiles(files[0]);
    e.target.value = '';
  };

  const handlerFiles = (file) => {
    restoreDefaultData()
    if (!openThreeWrapper) {
      handleOpenBoundingBox(file, meshKeys[activeIndex])
    } else {
      setLoading(true)
      boundingWrapperRef.current?.clientHeight  // 强制渲染一次
      if (activeIndex === 2) {
        setRangeVal(0.010)
      }
      setTimeout(() => {
        threeController.current.homepageUpdateMesh(meshKeys[activeIndex], file)
      }, 50);
    }
  }

  const handleOpenBoundingBox = (modelFile, type) => {
    setOpenThreeWrapper(true)
    setTimeout(() => {
      setOpenRange(true)
    }, 300);
    setLoading(true)
    setTimeout(() => {
      if (!threeController.current) {
        const options = {
          name: "homecondition",
          renderTarget: boundingBoxRef.current,
          meshParameters,
          modelType: type || meshKeys[activeIndex],
          initmodel: modelFile,
          setMeshParameters: setMeshParameters,
          pcdUncertainty: meshValues[2].pcd_condition_uncertainty,
          sampling: SAMPLING_ARRAY[samplingVal],
          textureCache: textureCache,
          openModal: openWatertightModal,
          handleQuitOrthCamera: handleQuitOrthCamera,
          loadingcb: (close) => {
            setLoading(false)
            if (close) {
              setOpenThreeWrapper(false)
              threeController.current.canResize = false
            }
          },
          tip: tip,
          translation: t,
          closePortal: closePortal,
        }
        threeController.current = new CustomBox(options)
        threeController.current.homepageInit()
        checkDirectionDriver()
      } else {
        threeController.current.canResize = true
        threeController.current.mainScene.onWindowResize()
        threeController.current.homepageUpdateMesh(meshKeys[activeIndex], modelFile)
      }
      threeController.current.registerUpdateSliderValueFunction(updateSliderValue);
    }, 500);
  }

  return (
    <div className="min-h-screen rounded-xl bg-[rgba(0,0,0,0.1)] text-blue-100 p-8 flex items-center justify-center">
      <div className="bg-black bg-opacity-50 p-8 rounded-xl shadow-2xl max-w-4xl w-full backdrop-filter backdrop-blur-sm border border-blue-500 border-opacity-30">
        <h2 className="text-4xl font-bold mb-8 text-center text-blue-300 animate-pulse">3D Converter</h2>

        {/* Examples */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-blue-200">Examples</h3>
          <div className="flex justify-around">
            {['cube', 'sphere', 'cylinder'].map((shape) => (
              <button
                key={shape}
                onClick={() => handleExampleClick(shape)}
                className={`p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 ${selectedShape === shape ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
              >
                {shape === 'cube' && <BiCube className="w-12 h-12 text-blue-400" />}
                {shape === 'sphere' && <ImSphere className="w-12 h-12 text-green-400" />}
                {shape === 'cylinder' && <BiCylinder className="w-12 h-12 text-purple-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-blue-200">Conditions</h3>
          <div className="flex justify-around">
            {['BoundingBox', 'Voxel', 'PointCloud'].map((condition) => (
              <button
                key={condition}
                onClick={() => handleConditionChange(condition)}
                className={`px-6 py-3 rounded-lg transition-all duration-300 ease-in-out ${selectedCondition === condition
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 hover:bg-gray-700'
                  }`}
              >
                {condition === 'BoundingBox' && <MdCheckBox className="w-8 h-8 inline-block mr-2" />}
                {condition === 'Voxel' && <BiCube className="w-8 h-8 inline-block mr-2" />}
                {condition === 'PointCloud' && <MdCloud className="w-8 h-8 inline-block mr-2" />}
                {condition}
              </button>
            ))}
          </div>
        </div>

        {/* Model Upload and Parameters */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-blue-200">Upload Model & Adjust Parameters</h3>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-blue-500 p-8 text-center rounded-lg cursor-pointer hover:border-blue-400 transition-colors mb-4"
          >
            <MdFileUpload className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <p className="text-blue-200">Drag and drop your 3D model here, or click to select files</p>
            <input ref={fileInputRef} onChange={handleFileInputChange} type="file" id="file-input" accept=".obj,.fbx,.glb,.gltf,.dae,.stl,.ply" style={{ display: 'none' }} />
          </div>
          <div className="flex justify-between">
            <div>
              <label className="block text-blue-200 mb-2">Scale</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={modelParameters.scale}
                onChange={(e) => handleParameterChange('scale', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-blue-200 mb-2">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={modelParameters.rotation}
                onChange={(e) => handleParameterChange('rotation', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Generate Code */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-200">Generated Code</h3>
          <div className="bg-gray-800 p-4 rounded-lg mb-4 relative">
            <pre className="text-sm text-blue-100 overflow-x-auto">{generatedCode}</pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(generatedCode)}
            className="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white font-semibold shadow-lg shadow-blue-500/50 hover:shadow-blue-500/75"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}