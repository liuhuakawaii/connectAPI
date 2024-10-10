import { useTips } from '../../../../common/GlobalTips'
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { textureCacheAtom } from '../../../../store'
import { useRecoilState } from 'recoil'
import style from './index.module.css'
import * as THREE from 'three149';

//component
import CustomBox from './scence'

//assets
import resetFront from './assets/resetFront.png'
import { AiOutlineClear } from "react-icons/ai";
import { useModal } from '../../../../common/CommonModal'
import { directionMap, MODE_ARRAY, SAMPLING_ARRAY } from '../../../../utils/map'
import textureImg from './assets/basic_side.jpg'
import xdirect from './assets/xdirect.svg'
import ydirect from './assets/ydirect.svg'
import zdirect from './assets/zdirect.svg'
import defaultDirect from './assets/direct.svg'
import symmetric from './assets/symmetric.svg'
import Svg from '../../../../common/Svg'
import ConditionRange from '../../../../common/ConditionRange'
import { createPortal } from 'react-dom'
import { useTranslation } from "react-i18next";
import { Annotation } from '../../../../common/Annotation'
import DraggableInput from '../../../../common/DragableInput'


const ModelPresets = React.forwardRef(({
  setMeshParameters,
  meshParameters,
  uploadImageRaw,
  uploadImgBlob,
  activeIndex,
  setActiveIndex,
  voxelScale,
  setVoxelScale,
  voxelMode,
  setVoxelMode,
  pcdUncertainty,
  setPcdUncertainty,
  updateFlag,
  setUpdateFlag,
  setSelectedShape
}, ref) => {
  const { t } = useTranslation();
  const boundingBoxRef = useRef(null)
  const threeWrapper = useRef(null)
  const boundingWrapperRef = useRef(null)
  const boundingEntryRef = useRef(null)
  const threeController = useRef(null)
  const fileInputRef = useRef(null)
  const [openThreeWrapper, setOpenThreeWrapper] = useState(false)
  const [dragging, setDragging] = useState(false);
  const [fileDropHover, setFileDropHover] = useState(false);
  const [condition, setCondition] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploadStatus,] = useState(true)
  const tip = useTips();
  const meshKeys = Object.keys(meshParameters)
  const meshValues = Object.values(meshParameters)
  const confirmedIndex = meshValues.findIndex((item) => item.confirmed)
  const entryController = useRef(null);
  const [sliderValue, setSliderValue] = useState([0, 0, 0]);
  const [appearAnimation, setAppearAnimation] = useState(false);
  const [rangeDragging, setRangeDragging] = useState(false);
  const [openRange, setOpenRange] = useState(false);
  const [directionAnimation, setDirectionAnimation] = useState(false);
  const [showDirectRange, setShowDirectRange] = useState(false);
  const [openDirectWrapper, setOpenDirectWrapper] = useState(false);
  const [voxelSymmetric, setVoxelSymmetric] = useState(false);
  const showDirectRangeRef = useRef(showDirectRange);
  const [samplingVal, setSamplingVal] = useState(2);
  const [directionIndex, setDirectionIndex] = useState(-1);
  const { openModal, closeModal } = useModal();

  const [textureCache, setTextureCache] = useRecoilState(textureCacheAtom);
  const directWrapperRef = useRef(null);
  const [portal, setPortal] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [directionWrapperCloseFlag, setDirectionWrapperCloseFlag] = useState(true);
  const symmetricRef = useRef(null);
  const svgArray = [
    {
      src: defaultDirect,
    },
    {
      src: xdirect,
      show: false
    },
    {
      src: ydirect,
      show: false
    },
    {
      src: zdirect,
      show: false
    }
  ]


  useEffect(() => {
    const init = async () => {
      try {
        const url = textureImg
        const texture = await preloadTexture(url);
        setTextureCache((prev) => ({
          ...prev,
          [url]: texture
        }));
        // 其他初始化逻辑...
      } catch (error) {
        console.error('Error loading texture:', error);
      }
    }
    init();
  }, [])

  const preloadTexture = async (url) => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {

          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    if (entryController?.current?.entryRef?.current && appearAnimation) {
      // console.log('进入了appearAnimation');
      const entry = entryController.current.entryRef.current;
      entry.style.opacity = '0'
    }
  }, [appearAnimation])

  useEffect(() => {
    if (entryController?.current?.entryRef?.current) {
      // console.log('进入了activeIndex');
      const entry = entryController.current.entryRef.current;
      entry.style.opacity = '1'
    }
  }, [activeIndex])

  useImperativeHandle(ref, () => ({
    handleCloseBoundingBox: handleCloseBoundingBox,
    mainBox: boundingBoxRef.current,
    mustConfirmStatus: openThreeWrapper && !meshParameters[meshKeys[activeIndex]].confirmed,
    handleDragEnter: handleDragEnter,
    handleDragOver: handleDragOver,
    handleDragLeave: handleDragLeave,
    handleFileDrop: handleFileDrop,
    threeWrapper: threeWrapper,
    openThreeWrapper: openThreeWrapper,
    setOpenThreeWrapper: setOpenThreeWrapper,
    threeController: threeController,
    handlerFiles: handlerFiles,
    entryController: entryController
  }))

  const checkDirectionDriver = () => {
    // if (localStorage.getItem('3dconditionDirectAnimation') === 'true') return
    setDirectionAnimation(true)
    setTimeout(() => {
      setDirectionAnimation(false)
      localStorage.setItem('3dconditionDirectAnimation', false)
    }, 8000);
  }

  useEffect(() => {
    if (!openThreeWrapper) {
      setDirectionIndex(-1)
      setOpenRange(false)
      setOpenDirectWrapper(false)
      if (threeController?.current) {
        threeController.current.canResize = false
      }
    }
  }, [openThreeWrapper])

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
              console.log('loadingcb----loadingcb');
              setOpenThreeWrapper(false)
              threeController.current.canResize = false
            }
          },
          tip: tip,
          translation: t,
          closePortal: closePortal,
          updateJSON: updateJSON,
          handleConfirmBoxSize: handleConfirmBoxSize,
          setUpdateFlag: setUpdateFlag
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
      setUpdateFlag(pre => pre + 1)
    }, 500);
  }

  const handleCloseBoundingBox = (e) => {
    const isConfirmed = meshValues.some((item) => item.confirmed)
    if (!openThreeWrapper && !isConfirmed) {
      if (threeWrapper.current && threeWrapper.current.contains(e.target)) return
      // setCondition(false)
    }
    console.log(dragging);
    if (openThreeWrapper && !dragging && !rangeDragging) {
      const rodinUpload = document.getElementById('newRodin-upload')
      console.log(rodinUpload);
      if (boundingWrapperRef.current && boundingWrapperRef.current.contains(e.target)) return
      if (rodinUpload && rodinUpload.contains(e.target)) return
      tip({
        type: 'primary',
        content: t('TIP_PRIMARY_THREEWRAPPER_CHANGE_SAVE'),
        yes: () => handleNoConfirm(),
        no: (f) => f,
      });
    }
  }

  const handleNoConfirm = () => {
    console.log('handleNoConfirm----handleNoConfirm');
    setOpenThreeWrapper(false)
    // const preMeshParameters = JSON.parse(JSON.stringify(meshParameters))
    if (activeIndex === 1) {
      if (meshValues[1].confirmed) {
        setVoxelScale(meshValues[1].voxel_condition_weight)
        setVoxelMode(meshValues[1].voxel_condition_cfg)
      } else {
        setVoxelScale(1.0)
        setVoxelMode(true)
      }
    } else if (activeIndex === 2) {
      if (meshValues[2].confirmed) {
        setPcdUncertainty(meshValues[2].pcd_condition_uncertainty)
      } else {
        setPcdUncertainty(0.01)
      }
    }
    setTimeout(() => {
      setOpenRange(false)
    }, 300);
    if (threeController?.current?.originMesh) {
      threeController.current.originMesh.visible = false
    }
    if (threeController?.current?.instancedMesh) {
      threeController.current.instancedMesh.visible = false
    }
  }

  const handleConfirmBoxSize = async () => {
    if (loading) return
    if (!threeController.current?.originMesh && !threeController.current?.instancedMesh) {
      tip({
        content: t('TIP_WRAN_THREEWRAPPER_DROP_MODEL'),
        type: 'warning',
      })
      return
    }

    if (threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_VOXEL_COMPLETE'), type: 'warning' });
      return;
    }

    // let base64Image;
    // try {
    //   base64Image = await threeController.current.mainScene.exportSnapshot();
    // } catch (error) {
    //   tip({ content: t('TIP_WRAN_THREEWRAPPER_VOXEL_COMPLETE'), type: 'warning' });
    //   return;
    // }

    // setOpenThreeWrapper(false)
    // setTimeout(() => {
    //   setOpenRange(false)
    // }, 300);
    // if (threeController?.current?.originMesh) {
    //   threeController.current.originMesh.visible = false
    // }
    // if (threeController?.current?.instancedMesh) {
    //   threeController.current.instancedMesh.visible = false
    // }
    threeController.current.confirmCondition()
    setTimeout(() => {
      updateJSON()
    }, 100);
  }

  const updateJSON = () => {
    console.log('=========更新了参数========');

    setMeshParameters(prev => {
      return meshKeys.reduce((acc, key, index) => {
        const isActive = index === activeIndex;
        let params = prev[key].params;
        let pos = prev[key].pos;

        if (isActive) {
          if (activeIndex === 1) {
            const voxelCache = threeController.current.voxelsCache[threeController.current.newVoxelIndex];
            params = voxelCache.params;
            pos = voxelCache.voxels;
          } else if (activeIndex === 2) {
            const pointsCache = threeController.current.pointsCache[threeController.current.newPointsIndex];
            params = pointsCache.params;
            pos = pointsCache.points;
          } else if (activeIndex === 0) {
            params = [...Object.values(prev[key].pos), 1];
          }
        }

        const updatedState = {
          ...acc,
          [key]: {
            ...prev[key],
            confirmed: isActive,
            // cover_small: isActive ? base64Image : prev[key].cover_small,
            // cover_big: isActive ? base64Image : prev[key].cover_big,
            params: params,
            pos: pos,
            ...(activeIndex === 1 && {
              voxel_condition_cfg: voxelMode,
              voxel_condition_weight: voxelScale
            }),
            ...(activeIndex === 2) && {
              pcd_condition_uncertainty: pcdUncertainty
            }
          }
        };

        return updatedState;
      }, {});
    });
  }

  const handleResetCamera = () => {
    if (loading) return
    threeController.current.mainScene.restoreCameraInitialPos()
  }

  const openWatertightModal = () => {
    function confirm() {
      closeModal()
    }

    function cancel() {
      closeModal()
      handleClearModel()
    }

    function useVoxel() {
      closeModal()
      setActiveIndex(1)
      threeController.current && threeController.current.useVoxel()
    }


    openModal(<div className='w-full flex flex-col items-center select-none'>
      <div className='text-[rgba(45,45,45,1)] font-bold text-[20px] text-center w-full'>{t('THREEWRAPPER_WATER_MESH_REQUIRED')}</div>
      <p className='text-[14px] text-[rgba(102,102,102,1)]'>{t('THREEWRAPPER_WATER_MESH_TIP_1')}<span className='text-[rgba(45,45,45,1)] font-bold'>{t('THREEWRAPPER_WATER_MESH_TIP_2')}</span>{t('THREEWRAPPER_WATER_MESH_TIP_3')}<span className='text-[rgba(45,45,45,1)] font-bold'>{t('THREEWRAPPER_WATER_MESH_TIP_4')}</span>{t('THREEWRAPPER_WATER_MESH_TIP_5')}</p>
      <div className='flex text-[14px] my-[12px] gap-[12px]'>
        <button onClick={cancel} className='w-[159px] h-[44px] flex-center border-none cursor-pointer transition-300-ease bg-[rgba(176,176,176,0.5)] text-[rgba(48,48,48,1)] hover:bg-[rgba(176,176,176,0.3)] hover:text-[rgba(26,26,26,1)] rounded-[22px]'>{t('THREEWRAPPER_CANCEL')}</button>
        <button onClick={useVoxel} className='w-[159px] h-[44px] flex-center border-none cursor-pointer [background:linear-gradient(180deg,_#6D49FF_0%,_#A347FF_100%)] hover:bg-[linear-gradient(272.06deg,#B166FB_0%,#795EFC_50%,#8067FD_100%)] text-[#fff] rounded-[22px]'>{t('THREEWRAPPER_USE_VOXEL')}</button>
      </div>
      <div onClick={confirm} className='text-[rgba(136,136,136,1)] hover:text-[rgba(45,45,45,1)] transition-300-ease text-[14px] cursor-pointer relative after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:w-[0px] after:h-[1px] after:bg-[rgba(136,136,136,1)] after:transition-300-ease hover:after:w-full'>{t('THREEWRAPPER_BUTTON_CONFIRM')}</div>
    </div>)
  }

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFileDropHover(true);
  }

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFileDropHover(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFileDropHover(false);
  };

  const handleFileDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_WAIT_VOXEL_COMPLETE'), type: 'warning' });
      return;
    }
    setFileDropHover(false);
    const file = [...event.dataTransfer.files][0];
    if (!file) {
      tip({ content: t('TIP_ERR_FILE_UPLOAD'), type: 'error' })
      return
    }
    const ALLOWED_FORMATS = ['glb', 'fbx', 'gltf', 'obj', 'dae', 'stl', 'ply'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_FORMATS.includes(fileExtension)) {
      tip({
        content: t('TIP_ERR_MODELS_FORMATS'),
        type: "error"
      });
      return;
    }
    handlerFiles(file);
  };

  const handlerFiles = (file, condition, changeFlag) => {
    restoreDefaultData();
    console.log(file, condition, 'file, conditionfile, condition');

    if (threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_VOXEL_COMPLETE'), type: 'warning' });
      return;
    }
    !changeFlag && setSelectedShape('add')
    const index = condition !== undefined ? condition : activeIndex;

    if (!openThreeWrapper) {
      handleOpenBoundingBox(file, meshKeys[index]);
    } else {
      setLoading(true);
      boundingWrapperRef.current?.clientHeight;  // 强制渲染一次

      if (index === 2) {
        setRangeVal(0.010);
      }

      setTimeout(() => {
        threeController.current.homepageUpdateMesh(meshKeys[index], file);
      }, 50);
    }
  };

  const handleFileInputChange = (e) => {
    const files = [...e.target.files];
    handlerFiles(files[0]);
    e.target.value = '';
  };

  const handleClearModel = (e) => {
    e && e.stopPropagation()
    if (loading) return
    if (threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_VOXEL_COMPLETE'), type: 'warning' });
      return;
    }
    threeController.current.clearModel()
    console.log('handleClearModel----handleClearModel');

    setOpenThreeWrapper(false)
    setTimeout(() => {
      setOpenRange(false)
    }, 300);
    setCondition(true)
  }

  useEffect(() => {
    if (threeController.current) {
      // restoreDefaultData()
      threeController.current.pointsTotalSum = SAMPLING_ARRAY[samplingVal]
      threeController.current.regeneratePCDbySampling()
      setUpdateFlag(pre => pre + 1)
    }
  }, [samplingVal])

  const handleSetSampling = (index) => {
    if (threeController.current && threeController.current.isAnimation) {
      tip({ content: t('TIP_WRAN_WAIT_VOXEL_COMPLETE'), type: 'warning' });
      return
    }
    setSamplingVal(index)
  }

  const setRangeVal = (val) => {
    if (threeController.current) {
      threeController.current.pcdUncertainty = val
    }
    setPcdUncertainty(val)
  }

  const setVoxelRangeVal = (val) => {
    setVoxelScale(val)
  }

  const handleSetVoxelCfg = (val) => {
    setVoxelMode(val)
  }

  const handleOpenDirectWrapper = () => {
    if (directionWrapperCloseFlag) {
      setOpenDirectWrapper(true)
      setDirectionWrapperCloseFlag(false)
    }
  }

  const handleCloseDirectWrapper = () => {
    setOpenDirectWrapper(false)
    setTimeout(() => {
      setDirectionWrapperCloseFlag(true)
    }, 100);
  }


  const handleToggleDirection = (index) => {
    if (index === directionIndex) {
      return
    }
    if (threeController.current && threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_CAMERA_COMPLETE'), type: 'warning' });
      return
    }
    setDirectionAnimation(false)
    setDirectionIndex(index)
    setTimeout(() => {
      setDirectionWrapperCloseFlag(true)
    }, 100);
    if (index === 0) {
      handleResetCamera()
    } else {
      handleSwitchOrthoCamera(index - 1)
      setOpenDirectWrapper(false)
    }
  }

  useEffect(() => {
    if (directionIndex === -1) {
      setPortal(null);
    }
  }, [directionIndex])

  const handleSwitchOrthoCamera = (index) => {
    if (loading || ![0, 1, 2].includes(index)) return
    if (threeController.current && threeController?.current?.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_CAMERA_COMPLETE'), type: 'warning' });
      return
    }
    setTimeout(() => {
      setShowDirectRange(true)
      openDirectionGIF(index)
    }, 1000);
    threeController.current.mainScene.switchOrthoCamera(threeController.current.recordOriginalMeshRotationAfterOrthoCameraUpdated.bind(threeController.current), index);
  }

  const handleSliderChange = (newValue) => {
    const newSliderValue = [...sliderValue]
    newSliderValue[directionIndex - 1] = +newValue;
    setSliderValue(newSliderValue);
    updateModelBasedOnSlider(newSliderValue);
  };

  const stopRotateByAnimation = () => {
    if (threeController.current && threeController.current.isAnimation) {
      tip({ content: t('TIP_WRAN_THREEWRAPPER_MODEL_ROTATING'), type: 'warning' });
      return true
    }
  }

  useEffect(() => {
    if (updated && threeController.current) {
      threeController.current.updateMeshByRotate()
      setUpdateFlag(pre => pre + 1)
      setTimeout(() => {
        setUpdated(false)
      }, 100);
    }
  }, [updated])

  const updateModelBasedOnSlider = (newSlider) => {
    const value = newSlider[directionIndex - 1]
    threeController.current.updateOriginalMeshRotationAxisAligned(-value);
  };

  const updateSliderValue = (newValue) => {
    setSliderValue(newValue);
  };

  useEffect(() => {
    showDirectRangeRef.current = showDirectRange
  }, [showDirectRange])

  const handleQuitOrthCamera = () => {
    if (showDirectRangeRef.current) {
      setShowDirectRange(false)
      setDirectionIndex(-1)
    }
  }

  const restoreDefaultData = () => {
    setShowDirectRange(false)
    setDirectionIndex(-1)
    setSliderValue([0, 0, 0])
    if (['voxel', 'pointCloud'].includes(meshKeys[activeIndex])) {
      setMeshParameters(prev => {
        return {
          ...prev,
          [meshKeys[activeIndex]]: {
            ...prev[meshKeys[activeIndex]],
            wlhparams: { x: 1, y: 1, z: 1 }
          }
        }
      });

      if (meshKeys[activeIndex] === 'voxel') {
        setVoxelScale(1.0)
        setVoxelMode(true)
        setVoxelSymmetric(false)
      } else {
        setPcdUncertainty(0.01)
      }
    }
  }

  const handleToggleVoxelSymmetric = (e) => {
    if (symmetricRef.current && symmetricRef.current.contains(e.target)) return
    setVoxelSymmetric(pre => !pre)
    threeController.current.reCaculateDepthMap2Pos(!voxelSymmetric)
  }

  const openDirectionGIF = (index) => {
    if (directWrapperRef.current) {
      const { left, top } = directWrapperRef.current.getBoundingClientRect();
      const imgArr = [
        `${process.env.PUBLIC_URL}/assets/rodin/directions/0002.webp`,
        `${process.env.PUBLIC_URL}/assets/rodin/directions/0008.webp`,
        `${process.env.PUBLIC_URL}/assets/rodin/directions/0000.webp`,
      ];
      setPortal(createPortal(
        <div
          className={`fixed z-500 rounded-lg bg-[rgba(255,255,255,0.1)] backdrop-blur-[50px] ${style.gifPortal}`}
          style={{ left: `${left + 54}px`, top: `${top}px` }}
        >
          <div className="w-[190px] h-[196px] rounded-lg shadow-lg relative">
            <div className="absolute w-[8px] h-[8px] bg-[rgba(255,_255,_255,_0.1)] backdrop-filter backdrop-blur-[50px] -left-[8px] top-[10px] [clip-path:polygon(0%_50%,_100%_0%,_100%_100%)] [box-shadow:0_0_10px_rgba(0,_0,_0,_0.1)]"></div>
            <button
              onClick={closePortal}
              className="absolute top-2 right-2 transition-300-ease text-[rgba(255,255,255,0.35)]  hover:text-[rgba(255,255,255,0.5)] px-2 rounded"
            >
              X
            </button>
            <div className="p-1">
              <div className="w-full h-full rounded-lg flex flex-col justify-between items-center">
                <img className='w-[140px] h-[140px]' src={imgArr[index]} alt="direction" />
                <p className=' [background:rgba(0,0,0,0.15)] text-center text-[rgba(255,255,255,0.6)] text-[12px] p-[6px_8px] rounded-[4px_4px_10px_10px] w-full'>{t('THREEWRAPPER_ROTATE_MODEL')}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ));
    }
  };

  const closePortal = (e) => {
    e?.stopPropagation()
    setPortal(null);
  };

  // const updatePortalPosition = () => {
  //   if (directWrapperRef.current) {
  //     const { left, top } = directWrapperRef.current.getBoundingClientRect();
  //     const portalElement = document.querySelector(`.${style.gifPortal}`);
  //     if (portalElement) {
  //       portalElement.style.left = `${left + 54}px`;
  //       portalElement.style.top = `${top}px`;
  //     }
  //   }
  // };

  // useEffect(() => {
  //   window.addEventListener('resize', updatePortalPosition);
  //   return () => {
  //     window.removeEventListener('resize', updatePortalPosition);
  //   };
  // }, []);

  useEffect(() => {
    const handleWheel = () => {
      closePortal();
    };

    if (!openThreeWrapper) {
      closePortal();
    } else {
      document.addEventListener('wheel', handleWheel);
    }
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [openThreeWrapper, closePortal]);

  return (  //openThreeWrapper
    <div
      className={`group/boundingBox select-none relative ${style.boundingBox}`} ref={threeWrapper}>
      {portal}
      <div
        className={`transition-300-ease
      ${!condition ? "w-[0px] h-[100px] sm:h-[128px] md:h-[158px]"
            : openThreeWrapper ? (
              activeIndex === 0 ? "w-[308px] h-[350px] rounded-[16px]"
                : "w-[308px] h-[420px] rounded-[16px]"
            )
              : uploadStatus ? `${activeIndex === 10 ? "h-[200px] w-[268px]" : "h-[300px] w-[100%]"} rounded-2xl`
                : "w-[100px] h-[100px] sm:w-[128px] sm:h-[128px] md:w-[158px] md:h-[158px] rounded-2xl"}`}>
        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          ref={boundingEntryRef}
          className={`group w-full h-full relative bg-[rgba(255,255,255,0.1)] rounded-2xl cursor-pointer overflow-hidden transition-300-ease 
          ${openThreeWrapper || !condition ? "opacity-0 invisible" : "opacity-100 visible"}"}
          `}>
          <Entry
            uploadImageRaw={uploadImageRaw}
            uploadImgBlob={uploadImgBlob}
            ref={entryController}
            fileInputRef={fileInputRef}
            activeIndex={activeIndex}
            meshValues={meshValues}
            meshKeys={meshKeys}
            uploadStatus={uploadStatus}
            fileDropHover={fileDropHover}
            threeController={threeController}
            setOpenThreeWrapper={setOpenThreeWrapper}
            handleOpenBoundingBox={handleOpenBoundingBox}
            setOpenRange={setOpenRange}
          />

        </div>
        <div
          className={`absolute right-0 bottom-0 p-[2px] py-[4px] flex flex-col gap-1 items-center z-10 transition-300-ease w-full h-full rounded-[16px] overflow-hidden bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px] [transition:border-color_0.3s_ease]
          ${openThreeWrapper ? "opacity-100 visible" : "opacity-0 invisible"}
          border-dashed border-2 ${fileDropHover ? "border-[rgba(40,228,240,1)]" : "border-[transparent]"}`}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          ref={boundingWrapperRef}>
          <div className='relative w-[calc(100%-4px)] h-[300px] rounded-[12px] overflow-hidden' ref={boundingBoxRef}>
            <div className='absolute select-none top-0 right-0 py-2 px-[8px] flex flex-col justify-center items-center gap-2 text-sm'>
              <div
                ref={directWrapperRef}
                onClick={handleSwitchOrthoCamera}
                onMouseEnter={handleOpenDirectWrapper}
                onMouseLeave={handleCloseDirectWrapper}
                className={`group/direction w-[30px] h-[30px] relative z-10 cursor-pointer transition-300-ease rounded-full  backdrop-blur-[10px]
              ${directionAnimation && style.directAnimation}
              ${directionIndex !== -1 && style.directChecked}
              ${directionIndex !== -1 ? "bg-[rgba(40,221,232,0.1)]" : "bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.3)]"}`}>
                <div className={` transition-300-ease w-full h-full relative z-10 rounded-full flex-center
                ${!openDirectWrapper ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                ${style.target}`} >
                  <Svg src={directionIndex === -1 ? defaultDirect : svgArray[directionIndex].src}></Svg>
                </div>
                {/* <img className='group-hover/direction:opacity-0 transition-300-ease w-full h-full relative z-10 ' src={resetFront} alt="resetFront" /> */}
                <span className={`absolute flex-center  whitespace-nowrap z-0 top-0 right-0 h-full bg-[rgba(255,255,255,0.1)] rounded-[12px] leading-[30px] text-white text-[12px] pl-[12px] pr-[30px]
                  ${directionAnimation ? style.directionText : "invisible pointer-events-none"}`}>
                  {t('THREEWRAPPER_ROTATE_MODEL_RESULTS')}
                </span>
                <div
                  className={`absolute h-[30px] top-[0px] right-[0px] z-[200] flex items-center gap-[3px] px-[3px] rounded-[14px]  transition-300-ease
                ${openDirectWrapper ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                ${style.svgBoxWrapper}`}
                >
                  {svgArray.map((item, index) => (
                    <div
                      className={`w-[28px] h-[28px] transition-300-ease flex-center rounded-full hover:bg-[rgba(40,221,232,0.1)] relative cursor-pointer
                  ${[0, 1, 2].includes(index) ? style.svgBoxBorder : ""}
                  ${directionIndex === index ? style.svgBoxChecked : ""}
                  ${style.svgBox}`}
                      key={index}
                      onClick={handleToggleDirection.bind(null, index)}>
                      <Svg src={item.src} />
                    </div>
                  ))}
                </div>
              </div>
              <div onClick={handleResetCamera} className='w-[30px] h-[30px] cursor-pointer hidden hover:bg-[rgba(255,255,255,0.3)] transition-300-ease rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px]'>
                <img className='w-full h-full' src={resetFront} alt="resetFront" />
              </div>
              <div onClick={handleClearModel} className='hidden w-[30px] h-[30px] flex-center cursor-pointer hover:bg-[rgba(255,255,255,0.3)] transition-300-ease rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px]'>
                <AiOutlineClear fontSize={16} />
              </div>
              {activeIndex === 1 && (
                <div onClick={handleToggleVoxelSymmetric} className={`group/symmetric relative w-[30px] h-[30px] flex-center cursor-pointer  transition-300-ease rounded-full backdrop-blur-[10px]
                ${voxelSymmetric && style.voxelSymmetric}
                ${voxelSymmetric ? "bg-[rgba(40,221,232,0.1)]" : "bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.3)]"}
                ${style.symmtricBox}`}>
                  <Svg src={symmetric} />
                  <div ref={symmetricRef} className='opacity-0 whitespace-nowrap pointer-events-none translate-x-[calc(-100%-16px)] group-hover/symmetric:pointer-events-auto group-hover/symmetric:opacity-100  group-hover/symmetric:translate-x-[calc(-100%-8px)] transition-300-ease absolute top-0 left-0 leading-[30px] [filter:drop-shadow(0px_0px_6px_rgba(0,0,0,0.2))] [background:rgba(255,255,255,0.1)] h-full px-[6px] rounded-lg before:content-[""] before:absolute before:right-0 before:top-1/2 before:w-0 before:h-0 before:[border:4px_solid_rgba(255,255,255,0.1)] before:[border-left-color:transparent!important] before:[border-bottom-color:transparent!important]  before:[transform:translate(calc(100%-4px),-50%)_rotate(45deg)] before:rounded-[2px]'>{t('THREEWRAPPER_SYMMETRIC')}</div>
                </div>
              )}
            </div>

            <div className={`absolute w-[85%] h-20px top-[12px] left-[12px] transition-300-ease flex gap-[8px] items-center
              ${showDirectRange && directionIndex >= 1 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none "}`}>
              <DraggableInput
                value={sliderValue[directionIndex - 1]}
                onChange={handleSliderChange}
                onStop={stopRotateByAnimation}
                onUpdated={() => setUpdated(true)}
                onDragging={(v) => setDragging(v)}
                min={-180}
                max={180}
                decimalPlaces={0}
              />
              <div className='w-[90%]'>
                <ConditionRange
                  setRangeDragging={setRangeDragging}
                  rangeDragging={rangeDragging}
                  openRange={openRange}
                  fiexed={0}
                  maxRange={180}
                  minRange={-180}
                  useSticky
                  value={sliderValue[directionIndex - 1]}
                  onStop={stopRotateByAnimation}
                  onUpdated={(v) => setUpdated(v || true)}
                  setValue={handleSliderChange} />
              </div>
            </div>
            <div className={`absolute-center text-white flex-center z-[200] w-full h-full bg-[rgba(0,0,0,0.3)] rounded-[16px] transition-300-ease 
              ${loading ? "opacity-100 visible" : "opacity-0 invisible"}`}>
              <span className="text-white">
                {t('THREEWRAPPER_LOADING')}<span className={style.dot}>.</span><span className={style.dot}>.</span><span className={style.dot}>.</span>
              </span>
            </div>
            <BBoxSizeController
              setUpdateFlag={setUpdateFlag}
              activeIndex={activeIndex}
              meshParameters={meshParameters}
              threeController={threeController}
              dragging={dragging}
              setDragging={setDragging}
              setMeshParameters={setMeshParameters}
              handleQuitOrthCamera={handleQuitOrthCamera}
              voxelMode={voxelMode}
              voxelScale={voxelScale}
              pcdUncertainty={pcdUncertainty}
            />
          </div>

          <div className='flex justify-between items-center w-full py-[4px] px-[2px] text-sm'>
            <div className='flex gap-2 items-center'>
              <div className='w-[24px] h-[24px] flex-center bg-[rgba(255,255,255,0.2)] rounded-full'>
                <img className='w-[16px] h-[16px]' src={meshValues[activeIndex].img} alt="" />
              </div>
              <span className=' text-white [letter-spacing:1px]'>{activeIndex > -1 && meshValues[activeIndex]?.entryname?.toLowerCase()}</span>
            </div>
            <button onClick={handleConfirmBoxSize} className='hidden px-[8px] py-[4px] md:px-[12px] md:py-[4px] bg-[rgba(40,228,240,0.3)] rounded-[16px] text-[rgba(40,228,240,1)] transition-300-ease hover:bg-[rgba(40,228,240,0.1)]  [letter-spacing:1px]'>{t('THREEWRAPPER_BUTTON_CONFIRM')}</button>
          </div>
          {
            openThreeWrapper && activeIndex === 1 && (
              <div className='w-full flex flex-col items-center px-[12px] pb-[4px]  text-sm gap-1 text-white select-none'>
                <div className='w-full flex justify-between pt-2 items-center border-t gap-4 border-t-[rgba(31,119,135,0.3)]'>
                  <span className='[letter-spacing:1px] text-[rgba(255,255,255,0.8)] flex flex-row gap-1 items-center'>{t('THREEWRAPPER_SCALE')}<Annotation text={t('THREEWRAPPER_SCALE_TIP')} left='-20px' /></span>
                  <div className='flex gap-2 items-center w-[190px]'>
                    <ConditionRange
                      openRange={openRange}
                      rangeDragging={rangeDragging}
                      setRangeDragging={setRangeDragging}
                      maxRange={1.00}
                      setValue={setVoxelRangeVal}
                      fiexed={1}
                      value={voxelScale} />
                    <span>{voxelScale === 1 ? "1.0" : voxelScale}</span>
                  </div>
                </div>
                <div className='w-full flex justify-between items-center gap-4'>
                  <span className='[letter-spacing:1px] text-[rgba(255,255,255,0.8)] flex flex-row gap-1 items-center'>{t('THREEWRAPPER_MODE')}<Annotation text={t('THREEWRAPPER_MODE_TIP')} left='-20px' /></span>
                  <div className='bg-[rgba(255,255,255,0.1)] w-[190px]  rounded-[29px] p-[3px] flex justify-between items-center'>
                    {MODE_ARRAY.map((item, index) => (
                      <span
                        className={`transition-300-ease cursor-pointer flex-1 rounded-md
                      ${voxelMode === item.params ? "text-[rgb(40,228,240)] bg-[rgba(40,228,240,0.3)]" : "text-white"}
                      ${index === 0 && "rounded-l-[20px]"}
                      ${index === 1 && "rounded-r-[20px]"}`}
                        key={index}
                        onClick={handleSetVoxelCfg.bind(null, item.params)}>{item.name === 'Strict' ? t('THREEWRAPPER_MODE_STRICT') : t('THREEWRAPPER_MODE_ROUGH')}</span>
                    ))}

                  </div>
                </div>
              </div>
            )
          }
          {
            openThreeWrapper && activeIndex === 2 && (
              <div className='w-full flex flex-col items-center px-[12px] pb-[4px]  text-sm gap-1 text-white select-none'>
                <div className='w-full flex justify-between pt-2 items-center border-t gap-4 border-t-[rgba(31,119,135,0.3)]'>
                  <span className='[letter-spacing:1px] text-[rgba(255,255,255,0.8)] flex flex-row gap-1 items-center'>{t('THREEWRAPPER_UNCERTAINTY')}<Annotation text={t('THREEWRAPPER_UNCERTAINTY_TIP')} left='-20px' /></span>
                  <div className='flex gap-2 items-center w-[190px]'>
                    <ConditionRange
                      setRangeDragging={setRangeDragging}
                      rangeDragging={rangeDragging}
                      maxRange={0.050}
                      openRange={openRange}
                      setValue={setRangeVal}
                      value={pcdUncertainty} />
                    <span>{pcdUncertainty == 0.01 ? "0.010" : pcdUncertainty}</span>
                  </div>
                </div>
                <div className='w-full flex justify-between items-center gap-4'>
                  <span className='[letter-spacing:1px] text-[rgba(255,255,255,0.8)] flex flex-row gap-1 items-center'>{t('THREEWRAPPER_SAMPLING')}<Annotation text={t('THREEWRAPPER_SAMPLING_TIP')} left='-20px' /></span>
                  <div className='bg-[rgba(255,255,255,0.1)] w-[190px]  rounded-[29px] p-[3px] flex justify-between items-center'>
                    {SAMPLING_ARRAY.map((item, index) => (
                      <span
                        className={`transition-300-ease cursor-pointer flex-1 rounded-md
                      ${samplingVal === index ? "text-[rgb(40,228,240)] bg-[rgba(40,228,240,0.3)]" : "text-white"}
                      ${index === 0 && "rounded-l-[20px]"}
                      ${index === 2 && "rounded-r-[20px]"}`}
                        key={index}
                        onClick={handleSetSampling.bind(null, index)}>{item}</span>
                    ))}

                  </div>
                </div>
              </div>
            )
          }
          <input ref={fileInputRef} onChange={handleFileInputChange} type="file" id="file-input" accept=".obj,.fbx,.glb,.gltf,.dae,.stl,.ply" style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
})

const Entry = React.forwardRef(({ fileInputRef, threeController, setOpenThreeWrapper, meshKeys, meshValues, uploadStatus, openThreeWrapper, fileDropHover, activeIndex, handleOpenBoundingBox, setOpenRange }, ref) => {
  const uploadRef = useRef(null)
  const handcraftRef = useRef(null)
  const uploadRef2 = useRef(null)
  const handcraftRef2 = useRef(null)
  const entryRef = useRef(null)
  const { t } = useTranslation();


  useImperativeHandle(ref, () => ({
    entryRef: entryRef,
    handleUploadModel: handleUploadModel,
    fileInputRef: fileInputRef
  }), [entryRef.current])


  const handleUploadModel = (e) => {

    if (!uploadStatus) {
      e.stopPropagation()
      if (threeController.current && meshValues[activeIndex].confirmed) {
        setOpenThreeWrapper(true)
        setTimeout(() => {
          setOpenRange(true)
          threeController.current.loadLatestModel(meshKeys[activeIndex])
        }, 300);
        return
      } else {
        //
      }
    } else {
      if ((uploadRef.current && uploadRef.current.contains(e.target)) || (uploadRef2.current && uploadRef2.current.contains(e.target))) {
        fileInputRef.current && fileInputRef.current.click()
      } else if ((handcraftRef.current && handcraftRef.current.contains(e.target)) || (handcraftRef2.current && handcraftRef2.current.contains(e.target))) {
        if (activeIndex === 0) {
          if (threeController.current) {
            threeController.current.bboxCache.originMesh = null
          }
          handleOpenBoundingBox()
        } else {
          //
        }
      }
    }
  }

  return (
    <div
      onClick={handleUploadModel}
      ref={entryRef}
      className={`group/voxelEntry w-full h-full relative [transition:opacity_0.3s_ease-in-out]
      ${style.VoxelEntry}`}>
      <div className={`absolute-x-center w-full h-full py-[24px] z-[20] flex justify-evenly transition-300-ease
        ${uploadStatus && activeIndex !== 10 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div ref={uploadRef} className={`group/upload h-full w-[45%] relative z-[20]  items-center justify-center pt-[10px]  flex-col gap-[12px] px-[20px]  rounded-[12px] text-[rgba(255,255,255,0.6)] transition-300-ease hover:text-[rgba(255,255,255,1)] [background:linear-gradient(180deg,rgba(71,71,76,0.5)_50%,rgba(26,101,121,0.5)_100%)] hover:[background:linear-gradient(180deg,rgba(71,71,76,0.8)_50%,rgba(26,101,121,0.8)_100%)]
          outline-2 outline-none  
          ${activeIndex === 0 ? "hidden" : "flex"}
          ${fileDropHover ? "outline-[rgba(40,228,240,1)] outline-dashed " : "outline-[transparent] hover:outline-[rgba(19,186,197,1)] hover:[outline-style:solid]"}`}>
          <span className='text-[18px] font-[700]'>{t('THREEWRAPPER_UPLOAD')}</span>
          <div>
            <svg width="42" height="36" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className='transition-300-ease [opacity:0.6] group-hover/upload:[opacity:1]' d="M13.1999 13.4292V16.1231H18.012C19.6962 15.8782 21.0195 14.2863 21.0195 12.4496C21.0195 10.368 19.4556 8.77614 17.4105 8.77614C16.9293 8.77614 16.5684 8.89859 16.2075 9.02103V8.77614C16.2075 6.08226 14.042 3.87818 11.3954 3.87818C8.74881 3.87818 6.5834 6.08226 6.5834 8.77614C6.5834 9.26593 6.7037 9.63328 6.7037 10.1231C6.4631 10.0006 6.22249 10.0006 5.98189 10.0006C4.29768 10.0006 2.97437 11.3476 2.97437 13.0619C2.97437 14.7761 4.29768 16.1231 5.98189 16.1231H10.7939V13.4292L9.47062 14.7761L7.7864 13.0619L11.9969 8.77614L16.2075 13.0619L14.5232 14.7761L13.1999 13.4292ZM13.1999 16.1231V18.5721H10.7939V16.1231H9.59092V18.5721H5.98189C2.97437 18.5721 0.568359 16.1231 0.568359 13.0619C0.568359 10.6129 2.13227 8.53124 4.17738 7.79655C4.65859 4.24553 7.6661 1.4292 11.3954 1.4292C14.5232 1.4292 17.2902 3.51083 18.2526 6.32716C21.1398 6.6945 23.4255 9.26593 23.4255 12.4496C23.4255 15.6333 21.0195 18.2047 18.012 18.5721H14.4029V16.1231H13.1999Z" fill="white" />
            </svg>
          </div>
          <span className='text-[16px]'>{t('THREEWRAPPER_UPLOAD_MODEL') + meshValues[activeIndex]?.entryname?.toLowerCase() + t('THREEWRAPPER_WATER_MESH_TIP_5')}</span>
        </div>
        <div ref={handcraftRef} className={`group/handcraft  relative z-[20]  transition-300-ease h-full w-[45%]  items-center justify-center gap-[12px] pt-[10px] px-[20px]  outline-none outline-2 hover:outline-[rgba(19,186,197,1)] hover:[outline-style:solid] flex-col rounded-[12px] text-[rgba(255,255,255,0.6)] transition-300-ease hover:text-[rgba(255,255,255,1)] [background:linear-gradient(180deg,rgba(71,71,76,0.5)_50%,rgba(26,101,121,0.5)_100%)] hover:[background:linear-gradient(180deg,rgba(71,71,76,0.8)_50%,rgba(26,101,121,0.8)_100%)]
          ${activeIndex === 0 ? "flex" : "hidden"}`}>
          <span className='text-[18px] font-[700]'>{t('THREEWRAPPER_HANDCRAFT')}</span>
          <div>
            <svg width="42" height="36" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className='transition-300-ease [opacity:0.6] group-hover/handcraft:[opacity:1]' d="M16.7458 18.0423C15.2183 18.9897 13.362 19.2647 11.5831 18.8093L10.6099 18.5579L4.62432 17.0196C3.53936 16.7403 2.84971 15.6274 3.08174 14.5317C3.31377 13.436 4.38155 12.7743 5.46436 13.0536L7.52256 13.5821L5.33545 10.0587L2.82823 6.01746C2.22452 5.04637 2.49092 3.78953 3.4212 3.2116C4.35147 2.63367 5.59541 2.95379 6.19913 3.92488L8.57745 7.75984C8.64834 7.87371 8.79444 7.91238 8.90401 7.84363L13.8776 4.75848C14.9132 4.11394 16.2989 4.47059 16.9692 5.5534L18.7739 8.46023C20.8343 11.7796 19.9255 16.07 16.7458 18.0423Z" fill="white" />
            </svg>
          </div>
          <span className='text-[16px]'>{t('THREEWRAPPER_CREATE_MODEL') + meshValues[activeIndex]?.entryname?.toLowerCase() + t('THREEWRAPPER_WATER_MESH_TIP_5')}</span>
        </div>
      </div>
      <div className={`absolute left-0 transition-300-ease w-full h-[30%] opacity-0 [background:linear-gradient(180deg,rgba(31,119,135,0)_0%,rgba(31,119,135,0.3)_100%)]
          ${openThreeWrapper ? "opacity-100 bottom-[-10px]" : "bottom-[-100%] opacity-0"}`}></div>
    </div>
  )
})

const BBoxSizeController = ({
  meshParameters,
  threeController,
  setMeshParameters,
  dragging,
  setDragging,
  activeIndex,
  handleQuitOrthCamera,
  voxelMode,
  voxelScale,
  pcdUncertainty,
  setUpdateFlag
}) => {
  const [inputFocusedByClick, setInputFocusedByClick] = useState(false)
  const [isFocused, setIsFocused] = useState(false);
  const isChangedRef = useRef(false)
  const { t } = useTranslation();
  const keyMap = ['bbox', 'voxel', 'pointCloud']
  const valueMap = ['pos', 'wlhparams', 'wlhparams']
  const isComposingRef = useRef(false);
  const tip = useTips()

  const validateInput = (value) => {
    // 允许空输入、数字、一个小数点，以及末尾的小数点
    return /^(\d*\.?\d*|\d+\.)$/.test(value);
  };

  const transformInput = (axis, value) => {
    let numberValue = parseFloat(value);
    if (isNaN(numberValue)) return null;

    if (keyMap[activeIndex] === 'bbox') {
      numberValue = Math.max(1, Math.min(300, numberValue));
    }
    return Math.round(numberValue * 100) / 100;
  };

  const handleInput = (axis, e) => {
    if (isComposingRef.current) return;

    const value = e.target.value;

    if (validateInput(value)) {
      e.target.value = value;
      e.target.dataset.lastValidValue = value;

      // 对于非bbox情况，允许输入任何数字和小数点
      if (keyMap[activeIndex] !== 'bbox') {
        changeWLH(axis, value);
        let numberValue = parseFloat(value);

        // 只有当输入是一个完整的数字时才进行范围检查和更新
        if (!isNaN(numberValue) && /^-?\d+(\.\d+)?$/.test(value)) {
          if (numberValue < 0.1 || numberValue > 3) {
            tip({
              content: t('TIP_WRAN_SIZE_LIMIT'),
              type: 'warning',
            });
          } else {
            const transformedValue = Math.round(numberValue * 100) / 100;
            e.target.value = transformedValue;
            changeWLH(axis, transformedValue);
            updateThreeController(axis, transformedValue);
          }
        }
      } else {
        // 对于bbox情况，保持原有逻辑
        if (/^-?\d+(\.\d+)?$/.test(value)) {
          const transformedValue = transformInput(axis, value);
          if (transformedValue !== null) {
            changeWLH(axis, transformedValue);
            updateThreeController(axis, transformedValue);
          }
        }
      }
    } else {
      console.log('不合法输入');
      // 如果输入不合法，恢复到上一个有效值
      e.target.value = e.target.dataset.lastValidValue || '';
    }
  };
  const handleCompositionStart = () => {
    console.log('handleCompositionStart');
    isComposingRef.current = true;
  }

  const handleCompositionEnd = (axis, event) => {
    isComposingRef.current = false;
    const value = event.target.value;
    validateInput(value);
  }
  // console.log(meshParameters, 'fasfasfasf');

  // const changeWLH = (axis, newValue) => {
  //   // console.log(activeIndex, 'activeIndex');

  //   setMeshParameters(prev => {
  //     return keyMap.reduce((acc, key, index) => {
  //       const isActive = index === activeIndex;
  //       let params = prev[key].params;
  //       let pos = prev[key].pos;

  //       if (isActive) {
  //         if (activeIndex === 1) {
  //           const voxelCache = threeController.current.voxelsCache[threeController.current.newVoxelIndex];
  //           params = voxelCache.params;
  //           pos = voxelCache.voxels;
  //         } else if (activeIndex === 2) {
  //           const pointsCache = threeController.current.pointsCache[threeController.current.newPointsIndex];
  //           params = pointsCache.params;
  //           pos = pointsCache.points;
  //         } else if (activeIndex === 0) {
  //           params = [...Object.values(prev[key].pos), 1];
  //         }

  //         // Update the specific axis value for the active item
  //         // if (valueMap[activeIndex] === 'wlhparams') {
  //         //   params = {
  //         //     ...params,
  //         //     [axis?.toLowerCase()]: newValue
  //         //   };
  //         // } else if (valueMap[activeIndex] === 'pos') {
  //         //   pos = {
  //         //     ...pos,
  //         //     [axis?.toLowerCase()]: newValue
  //         //   };
  //         // }
  //       }

  //       const updatedState = {
  //         ...acc,
  //         [key]: {
  //           ...prev[key],
  //           confirmed: isActive,
  //           params: params,
  //           pos: pos,
  //           ...(activeIndex === 1 && {
  //             voxel_condition_cfg: voxelMode,
  //             voxel_condition_weight: voxelScale,
  //             [valueMap[activeIndex]]: {
  //               ...prev[keyMap[activeIndex]][valueMap[activeIndex]],
  //               [axis?.toLowerCase()]: newValue
  //             }
  //           }),
  //           ...(activeIndex === 2 && {
  //             pcd_condition_uncertainty: pcdUncertainty,
  //             [valueMap[activeIndex]]: {
  //               ...prev[keyMap[activeIndex]][valueMap[activeIndex]],
  //               [axis?.toLowerCase()]: newValue
  //             }
  //           })
  //         }
  //       };

  //       return updatedState;
  //     }, {});
  //   });
  // };

  const changeWLH = (axis, newValue) => {
    setMeshParameters(prev => ({
      ...prev,
      [keyMap[activeIndex]]: {
        ...prev[keyMap[activeIndex]],
        [valueMap[activeIndex]]: {
          ...prev[keyMap[activeIndex]][valueMap[activeIndex]],
          [axis?.toLowerCase()]: newValue
        }
      }
    }));
  }

  const updateThreeController = async (axis, value) => {
    const newValueMap = { ...meshParameters[keyMap[activeIndex]][valueMap[activeIndex]], [axis?.toLowerCase()]: value };
    threeController.current.boundingBox.updateWHLOrScaleMesh(newValueMap, keyMap[activeIndex]);
    await threeController.current.updateMeshByScale(keyMap[activeIndex]);
    setUpdateFlag(pre => pre + 1)
  }

  const handleMouseDown = (axis, e) => {
    if (threeController.current.isAnimation) return
    handleQuitOrthCamera()
    if (isFocused) return
    setDragging(true)
    const startX = e.clientX;
    const currentValue = meshParameters[keyMap[activeIndex]][valueMap[activeIndex]][axis?.toLowerCase()];
    document.onmousemove = (e) => {
      isChangedRef.current = true;
      const endX = e.clientX;
      const diff = endX - startX;
      let newValue;
      if (keyMap[activeIndex] === 'bbox') {
        newValue = Math.floor(Math.max(1, Math.min(300, currentValue + diff / 5)));
      } else {
        newValue = Math.max(0.1, Math.min(3, currentValue + (diff / 50)));
        newValue = Number(formatNum(newValue))
      }
      changeWLH(axis, newValue)
      const newValueMap = { ...meshParameters[keyMap[activeIndex]][valueMap[activeIndex]], [axis.toLowerCase()]: newValue }
      threeController.current.boundingBox.updateWHLOrScaleMesh(newValueMap, keyMap[activeIndex]);
    }
    document.onmouseup = async () => {
      document.onmousemove = null;
      document.onmouseup = null;
      setTimeout(() => {
        console.log(dragging);
        setDragging(false)
      }, 100);
      if (!isChangedRef.current) return
      isChangedRef.current = false
      if (!isFocused) {
        await threeController.current.updateMeshByScale(keyMap[activeIndex])
      }
    }
  };

  const formatNum = (num) => {
    let value = Math.round(parseFloat(num) * 100) / 100;
    let arrayNum = value.toString().split(".");
    if (arrayNum.length == 1) {
      return value.toString() + ".00";
    }
    if (arrayNum.length > 1) {
      if (arrayNum[1].length < 2) {
        return value.toString() + "0";
      }
      return value;
    }
  }

  const handleInputMouseDown = (e) => {
    if (isFocused) return
    e.preventDefault();
    setInputFocusedByClick(true)
  }

  const handleInputClick = (e) => {
    if (inputFocusedByClick) {
      e.target.focus();
      setInputFocusedByClick(false)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }
  return (
    <div className='absolute select-none py-2 bottom-0 w-full flex justify-center items-center gap-2'>
      {Object.entries(meshParameters[keyMap[activeIndex]][valueMap[activeIndex]]).map((param) => (
        <React.Fragment key={param[0]}>
          <div onMouseDown={handleMouseDown.bind(null, param[0])} className='w-[22%] justify-between bg-[rgba(0,0,0,0.2)] text-screen-sm px-2 py-1 flex items-center rounded-[6px] border border-transparent transition-300-ease hover:border-[rgba(255,255,255,0.5)]'>
            <label className=' cursor-ew-resize   text-[rgba(255,255,255,0.5)]'>{directionMap[param[0]].toUpperCase()}</label>
            <input
              onFocus={handleFocus}
              onBlur={handleBlur}
              onMouseDown={handleInputMouseDown}
              onClick={handleInputClick}
              onInput={(e) => handleInput(param[0], e)}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={(e) => handleCompositionEnd(param[0], e)}
              className={`w-[65px] pl-[4px] text-white outline-none bg-transparent text-center select-none ${style.bboxinput}`}
              value={param[1]}
              type="text" />
          </div>
          {param[0] !== 'z' && <span className='text-[rgba(255,255,255,0.2)]'>x</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

ModelPresets.displayName = 'ModelPresets'
Entry.displayName = 'Entry'
export default ModelPresets