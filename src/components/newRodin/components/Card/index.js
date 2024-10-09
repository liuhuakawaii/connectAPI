import React, { useContext, useEffect, useRef, useState } from "react";
import { Carousel } from "../Carousel";
import vector from '../../assets/Vector.png'
// import { ImageOverlay } from "../../../../common/ImageOverlay";
import { AvatarImage } from "../../../../common/AvatarImage";
import { CardClickContext } from "../../../../utils/context";
import Like from "../Like";
import { Private } from "../Private";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { logInfoAtom, showLoginAtom } from "../../../../store";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";
import { useThrottle } from "../../../../utils/hooks";
import { checkMobile } from "../../../../utils/format";
import Restricted from "../../../../utils/restricted";

const STATUS = {
  DEFAULT: "DEFAULT",
  SDF: 'SDF',
  VIDEO: 'VIDEO',
  VIDEO_PLAY: 'VIDEO_PLAY',
  STORY: 'STORY',
  LOADING: 'LOADING',
}

export const RodinCard = ({ keyIndex, card, cacheCardList, setCacheCardList, hoverID, setHoverID }) => {
  const handleCardClick = useContext(CardClickContext);
  const [cardStatus, setCardStatus] = useState(STATUS.DEFAULT);
  const [startX, setStartX] = useState(0);
  const [loading, setLoading] = useState(true);
  const fakeProgressTimer = useRef(null)
  const [progressPercent, setProgressPercent] = useState(0);
  const [openProgress, setOpenProgress] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [startXFlag, setStartXFlag] = useState(false);
  const SDFViewerRef = useRef(null)
  const hoverStayTimer = useRef(null)
  const changeStatusTimer = useRef(null)
  const ToolsRef = useRef(null)
  const setShowLogin = useSetRecoilState(showLoginAtom);
  const logInfo = useRecoilValue(logInfoAtom);

  const changeStatus = () => {
    switch (card.step) {
      case 'ModelRefine':
      case 'TextureGenerate':
      case 'TextureRefine': setCardStatus(STATUS.VIDEO)
        break;
      case 'ModelGenerate': setCardStatus(STATUS.SDF)
        break;
      default: setCardStatus(STATUS.VIDEO)
        break;
    }
  }

  const fakeProgressStart = (speed = 2) => {
    fakeProgressTimer.current = setInterval(() => {
      setProgressPercent(pre => {
        const nextPercentage = pre + speed
        if (nextPercentage >= 90) {
          return 90
        }
        return nextPercentage
      })
    }, 50);
  }

  const completeFakeProgress = () => {
    setProgressPercent(100)
    clearInterval(fakeProgressTimer.current)
    fakeProgressTimer.current = null
  }

  const resetFakeProgress = () => {
    setOpenProgress(false)
    setProgressPercent(0)
    clearInterval(fakeProgressTimer.current)
    fakeProgressTimer.current = null
  }

  const delaySwitchAnimation = (cb) => {
    setFadeOut(true)
    changeStatusTimer.current = setTimeout(cb, 250);
  }

  const clearDelaySwitchAnimation = () => {
    clearTimeout(changeStatusTimer.current)
    changeStatusTimer.current = null
  }

  const statusSwitchingJudgment = async (step, task_uuid) => {
    try {
      if (step === 'ModelGenerate') {
        setOpenProgress(true)
        fakeProgressStart()
        setCacheCardList(pre => {
          return pre.map((item) => {
            if (item.task_uuid === task_uuid) {
              return { ...item, SDFcached: true }
            }
            return item
          })
        })
        try {
          await loadSDFImg(card.video_url)
        } catch (error) {
          console.error("Unable to load SDF image", error)
        }
      } else {
        setOpenProgress(true)
        fakeProgressStart()
        setCacheCardList(pre => {
          return pre.map((item) => {
            if (item.task_uuid === task_uuid) {
              return { ...item, VIDEOcached: true }
            }
            return item
          })
        })
        try {
          await loadVideo(card.video_url)
        } catch (error) {
          console.error("Unable to load video", error)
        }
      }
    } catch (error) {
      // Always catching event as exception
      Sentry.captureException(error)
      console.error(error);
    }
  }

  const handleMouseEnter = async (card) => {
    const isMobile = checkMobile()

    if (isMobile) {
      return;
    }
    try {
      const { task_uuid } = card
      setStartXFlag(true)
      const index = cacheCardList.findIndex((item) => item.task_uuid === task_uuid)
      if (hoverStayTimer.current) {
        clearTimeout(hoverStayTimer.current)
      }
      clearDelaySwitchAnimation()
      setHoverID(task_uuid)
      if (cacheCardList[index]?.SDFcached || cacheCardList[index]?.VIDEOcached) {
        delaySwitchAnimation(() => {
          changeStatus()
        })
      } else {
        statusSwitchingJudgment(card.step, task_uuid)
      }
    } catch (error) {
      Sentry.captureException(error)
      console.error(error);
    }
  };

  const loadSDFImg = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;
      image.onload = () => {
        completeFakeProgress()
        delaySwitchAnimation(() => {
          setFadeOut(false)
          setOpenProgress(false)
          changeStatus()
          resolve();
        })
      };
      image.onerror = (error) => reject(error);
    });
  };

  const loadVideo = async (videoUrl) => {

    return new Promise((resolve, reject) => {
      let video = document.createElement('video');
      video.crossOrigin = "anonymous";
      video.src = videoUrl;
      video.muted = true;
      video.onloadeddata = () => {
        completeFakeProgress()
        delaySwitchAnimation(() => {
          setFadeOut(false)
          setOpenProgress(false)
          changeStatus()
          resolve();
        })
      };
      video.onerror = (error) => reject(error);
    });
  }

  const handleMouseLeave = () => {
    if (hoverStayTimer.current) {
      clearTimeout(hoverStayTimer.current)
    }
    clearDelaySwitchAnimation()
    setFadeOut(false)
    setCardStatus(STATUS.DEFAULT)
    setHoverID(false)
    setOpenProgress(false)
    resetFakeProgress()
  };

  const handleMouseMove = (e) => {
    if (cardStatus !== 'DEFAULT' && startXFlag) {
      setStartX(e.clientX)
      setStartXFlag(false)
    }
  }

  const handlePlay = () => {
    setCardStatus(STATUS.VIDEO_PLAY)
  }

  const handleImageLoad = () => {
    setLoading(false);
  };

  const COMPONENTS = {
    // DEFAULT: <div className={`rounded-2xl  ${fadeOut ? "animation-sdf-fadeout" : ""}`} >
    DEFAULT: <div className={`rounded-2xl`} >
      {loading && (
        <div className='absolute-center w-full h-full rounded-2xl overflow-hidden bg-[linear-gradient(90deg,_#2f2f2f_25%,_#232323_50%,_#3d3d3d_75%)] [background-size:200%_100%] animate-[loading_1.5s_infinite]' />
      )}
      {card.image_url && card.image_url !== 'FILE_NOT_FOUND' && <img
        src={card.image_url}
        className={` w-full h-full rounded-2xl ${loading ? 'hidden' : 'block'} ${fadeOut ? "animation-sdf-fadeout-blur" : ""}`}
        alt='Preview Render Image'
        onLoad={handleImageLoad}
      />}
      {openProgress && (
        <div className='absolute-x-center bottom-[20px] w-[90%] gap-1 flex flex-col items-start '>
          <span className='text-white text-xs'>Loading
            <span className="loading-text-animation animation-delay-1">.</span>
            <span className="loading-text-animation animation-delay-2">.</span>
            <span className="loading-text-animation">.</span>
          </span>
          <div className='relative w-full rounded-xl shadow-[inset_0_2px_4px_0_00000040] h-[10px] bg-[#00000040] p-[2px]'>
            <div className={`absolute--y-center top-0 left-[2px] z-10 h-[6px] bg-[#0FE0ED] rounded-xl [transition:width_0.1s_linear]`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>,
    SDF: <SDFViewer ref={SDFViewerRef} card={card} startX={startX} />,
    VIDEO_PLAY: <div className='absolute-center w-full h-full rounded-2xl z-40'>
      <div onClick={handlePlay} className='absolute-center flex-center w-[40px] h-[40px] sm:w-[56px] sm:h-[56px] md:w-[70px] md:h-[70px] transition-300-ease hover:bg-[#00000060] bg-[#00000040] rounded-[18px]'>
        <img src={vector} className='w-[14px] h-[14px] sm:w-[20px] sm:h-[20px] md:w-[28px] md:h-[28px]' alt="vector" />
      </div>
    </div>,
    VIDEO: <div
      className={`absolute-center w-full h-full rounded-2xl z-40  ${fadeOut ? "animation-sdf-fadein" : ""}`}>
      <video
        className='w-full h-full rounded-2xl'
        src={card.video_url}
        autoPlay
        muted
        loop
        playsInline
        style={{ pointerEvents: 'none' }}
      />

    </div>,
    STORY: <div className='absolute-center w-full h-full rounded-2xl z-40'>
      <Carousel dataSource={card?.storeList} />
      <div
        className='flex flex-col justify-between items-center gap-2 p-2 sm:p-3 absolute-x-center bottom-[12px] w-[85%] bg-[#00000030] backdrop-blur-md rounded-2xl'>
        <div className='w-full flex items-center justify-start gap-1'>
          {card?.storeTag?.map((tag, index) => (
            <div key={index} className='px-[6px] py-[1px] sm:px-[6px] sm:py-[2px] bg-[#ffffff30] rounded-2xl text-[#0FE0ED] text-xxs sm:text-xs'>{tag}</div>
          ))}
        </div>
        <div className='w-full flex justify-between items-center text-white'>
          <span className='text-xs sm:text-sm font-bold'>{"3D car game"}</span>
          <span className='text-xxs sm:text-xs'>126<span className='text-[#aaa] ml-1'>likes</span></span>
        </div>
      </div>

    </div>,
  }

  const handlerClick = (task_uuid, e) => {
    if (!logInfo) {
      setShowLogin(true)
      return
    }

    if (ToolsRef.current && ToolsRef.current.contains(e.target)) {
      return
    }
    handleCardClick(task_uuid)
  }

  return (
    <div
      onClick={handlerClick.bind(null, card.task_uuid)}
      onMouseEnter={handleMouseEnter.bind(null, card, keyIndex)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-name='3dbox'
      className='group/card relative w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]  bg-[#ffffff08] rounded-2xl cursor-pointer'
      key={keyIndex}>
      <div
        className='rounded-2xl z-10 absolute-x-center w-full [background:linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_62.42%,rgba(255,255,255,0.15)_123.19%)] bottom-0 p-3 sm:px-4 pt-4 flex items-center justify-between transition-300-ease group-hover/card:opacity-0'>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className='w-6 h-6 rounded-full overflow-hidden'>
            <AvatarImage width='100%' height='100%'
              url={card?.author?.avatar_url || '../../assets/defaultAvatar.png'} />
          </div>
          <div className='flex flex-col items-start'>
            <div
              className='w-[100px] sm:w-[160px] lg:w-[180px] text-left text-white text-xs sm:text-sm md:text-md overflow-hidden text-ellipsis whitespace-nowrap'
              title={card?.author?.username}>{card?.author?.username}</div>
            {logInfo.is_admin ? <div
              className='w-[100px] sm:w-[160px] lg:w-[180px] text-left text-[#999] text-xxs sm:text-xs md:text-sm overflow-hidden text-ellipsis whitespace-nowrap'
              title={card?.author?.email}>{card?.author?.email}</div> : null}
          </div>
        </div>
        <div className="text-xxs sm:text-xs md:text-sm text-white"><span
          className="text-white">{card.num_like}</span> likes
        </div>
      </div>
      <Restricted to="like.card.rodin.view">
        <Tools ref={ToolsRef} />
      </Restricted>
      {/* Use img as background */}
      <img
        src={card.image_url}
        className={`absolute top-0 left-0 w-full h-full rounded-2xl ${loading ? 'hidden' : 'block'} ${fadeOut ? "animation-sdf-fadeout-blur" : ""}`}
        alt='Preview Render Image'
        onLoad={handleImageLoad}
      />
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
        {hoverID === card.task_uuid ? COMPONENTS[cardStatus] : COMPONENTS[STATUS.DEFAULT]}
      </div>
    </div>
  )
}

const Tools = React.forwardRef((props, ref) => {
  return (
    <div ref={ref} className="absolute z-[200] flex flex-col gap-2 right-[20px] top-[20px]">
      <Like />
      <Private />
    </div>
  )
})

export const LoadingSkeleton = ({ windowWidth }) => {
  const querySkeletonLength = () => {
    return windowWidth >= 2560 ? 12 : windowWidth >= 1920 ? 10 : 8;
  }

  const length = querySkeletonLength();

  return (
    Array.from({ length: length }).map((_, index) => (
      <div key={index} className='rounded-2xl w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] overflow-hidden cursor-pointer bg-[linear-gradient(90deg,_#2f2f2f_25%,_#232323_50%,_#3d3d3d_75%)] [background-size:200%_100%] animate-[loading_1.5s_infinite]' />
    ))
  )
}

export const EmptyComponent = () => {
  const { t } = useTranslation();

  return (
    <div className='w-full h-full min-h-[200px] flex-center bg-[rgba(255,255,255,0.05)] backdrop-blur-sm rounded-2xl'>
      <div className='h-full w-full flex-center text-primary text-screen-md'>
        {t('GALLERY_EMPTY_LIST')}.
      </div>
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
const SDFViewer = React.forwardRef(({ card, startX }, ref) => {
  // const [picPreviewArr, setPicPreviewArr] = useState([])
  // const [loading, setLoading] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 480, height: 240 });
  const carouselRef = useRef(null)
  const containerRef = useRef(null)
  // const [loading, setLoading] = useState(true);
  const NUMVIEWS = 16;
  const SWITCHDISTANCE = 15
  const thumbnailOriginalSize = { width: 720, height: 360 };
  const SDFOriginalSize = { width: 11520, height: 720 };
  const scale = containerSize.height / thumbnailOriginalSize.height


  useEffect(() => {
    if (card.video_url && containerRef.current) {
      window.addEventListener('resize', throttleRisize)

      resetContainerSize()
    }
    return () => {
      window.removeEventListener('resize', throttleRisize)
    }
  }, [card.video_url, containerRef]);

  // useImperativeHandle(ref, () => {
  //   return {
  //     SDFLoaded: !loading,
  //   }
  // }, [loading]);

  const resetContainerSize = () => {
    updateSize(carouselRef.current, setContainerSize)
  }

  const updateSize = (target, func) => {
    if (target?.clientWidth && target?.clientHeight) {
      const width = target.clientWidth
      const height = target.clientHeight
      func({ width: 2 * width, height });
      updatePosition(containerRef.current, { x: 0, y: 0 })
    }
  }

  const updatePosition = (target, positionObj) => {
    const { x, y } = positionObj
    target.style.backgroundPosition = `${x}px  ${y}px`;
  }

  const handleSDFMove = (operate, e) => {
    if (!startX) return
    if (operate === 'mouse' && e.button !== 0) return;
    if (operate === 'touch' && e.touches.length !== 1) return;
    const container = containerRef.current;
    // const [x, y] = container.style.backgroundPosition.split(' ').map((item) => parseInt(item))
    const viewWidth = containerSize.width
    // SDFOriginalSize.width  containerSize.width
    const endX = operate === 'mouse' ? e.clientX : e.touches[0].clientX;
    let viewIndex = Math.floor(((endX - startX) / SWITCHDISTANCE)) % NUMVIEWS;
    const backgroundPositionX = (viewIndex * viewWidth);
    container.style.backgroundPosition = `${backgroundPositionX}px  0px`;

    if (e.preventDefault) {
      e.preventDefault();
    }
  };

  const handleSDFLeave = () => {
    const container = containerRef.current;
    container.style.backgroundPosition = `0px  0px`;
  }

  // const handleImageLoad = () => {
  //   setLoading(false);
  // };

  const throttleRisize = useThrottle(resetContainerSize, 300)
  return (
    <div
      onMouseMove={handleSDFMove.bind(null, 'mouse')}
      onMouseLeave={handleSDFLeave}
      onTouchStart={handleSDFMove.bind(null, 'touch')}
      className='animation-sdf-fadein w-full h-full relative rounded-2xl z-10 overflow-hidden'
      ref={carouselRef}>
      <div
        className="rounded-2xl"
        ref={containerRef}
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          backgroundImage: `url(${card?.video_url})`,
          backgroundSize: `${SDFOriginalSize.width * scale}px ${SDFOriginalSize.height * scale}px`
        }}>
      </div>

      {/* {loading && (
        <div className='absolute-center w-full h-full rounded-xl overflow-hidden bg-[linear-gradient(90deg,_#2f2f2f_25%,_#232323_50%,_#3d3d3d_75%)] [background-size:200%_100%] animate-[loading_1.5s_infinite]' />
      )} */}

      {/* {card.video_url && card.video_url !== 'FILE_NOT_FOUND' && <img
        src={card.video_url}
        className={` w-full h-full rounded-xl ${loading ? 'hidden' : 'block'}`}
        alt='Preview Render Image'
        onLoad={handleImageLoad}
      />} */}
    </div>
  )
})

Tools.displayName = 'Tools'
SDFViewer.displayName = 'SDFViewer'