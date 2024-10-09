import personal from '../../assets/personal.png'
import activegroup from '../../assets/active-group.png'
import activepersonal from '../../assets/active-personal.png'
import group from '../../assets/group.png'
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from 'react';

const RodinWallet = ({ currentWallet, setCurrentWallet, currentStatus }) => {
  const [openWallet, setOpenWallet] = useState(false)
  const moveBg = useRef(null)
  const walletWrapperRef = useRef(null)
  const { t } = useTranslation();
  const [currentImg, setCurrentImg] = useState({
    group: group,
    personal: personal
  })

  const hanldeSetWallet = (wallet, e) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (currentStatus) {
      return
    }

    setOpenWallet(false)
    setCurrentWallet({
      bg: wallet,
      wallet: wallet,
    })
    removeAll()
    if (wallet === 'personal') {
      moveBg.current.classList.add('move-personal');
      moveBg.current.classList.add('move-right');
      moveBg.current.classList.remove('move-group');
    } else if (wallet === 'group') {
      moveBg.current.classList.add('move-group');
      moveBg.current.classList.add('move-right');
      moveBg.current.classList.remove('move-personal');
    }
  }

  useEffect(() => {
    if (!openWallet) {
      setTimeout(() => {
        if (currentWallet.bg === 'group') {
          setCurrentImg({
            group: activegroup,
            personal: personal
          })
        } else if (currentWallet.bg === 'personal') {
          setCurrentImg({
            group: group,
            personal: activepersonal
          })
        }
      }, 150);
    }
  }, [openWallet])

  const removeAll = () => {
    moveBg.current.classList.remove('move-left-important');
    moveBg.current.classList.remove('move-right-important');
    moveBg.current.classList.remove('move-personal-important');
    moveBg.current.classList.remove('move-group-important');
  }

  const handleMouseEnterPersonal = () => {
    setCurrentImg({
      group: group,
      personal: activepersonal
    })
    moveBg.current.style.transition = '300ms ease'
    moveBg.current.classList.add('move-personal-important');
    moveBg.current.classList.remove('move-group-important');
    if (currentWallet.bg === 'personal' || !currentWallet.bg) {
      moveBg.current.classList.add('move-right-important');
      moveBg.current.classList.remove('move-left-important');
    } else {
      moveBg.current.classList.add('move-left-important');
      moveBg.current.classList.remove('move-right-important');
    }
    walletWrapperRef.current.classList.add('bgwrapper-personal');
    walletWrapperRef.current.classList.remove('bgwrapper-group');
  }

  const handleMouseEnterGroup = () => {
    setCurrentImg({
      group: activegroup,
      personal: personal
    })
    moveBg.current.style.transition = '300ms ease'
    moveBg.current.classList.add('move-group-important');
    moveBg.current.classList.remove('move-personal-important');

    if (currentWallet.bg === 'personal' || !currentWallet.bg) {
      moveBg.current.classList.add('move-left-important');
      moveBg.current.classList.remove('move-right-important');
    } else {
      moveBg.current.classList.add('move-right-important');
      moveBg.current.classList.remove('move-left-important');
    }
    walletWrapperRef.current.classList.add('bgwrapper-group');
    walletWrapperRef.current.classList.remove('bgwrapper-personal');
  }

  const handlemoveEnterOpen = () => {
    setOpenWallet(true)
  }

  const handleMouseLeave = () => {
    setOpenWallet(false)
    if (!currentWallet.bg) {
      walletWrapperRef.current.classList.remove('bgwrapper-personal');
      walletWrapperRef.current.classList.remove('bgwrapper-group');
      setCurrentImg({
        group: group,
        personal: personal
      })
    }
    moveBg.current.style.transition = 'none'
    removeAll()
  }

  return (
    <>
      <div ref={moveBg} className={`absolute-y-center transition-300-ease w-[40px] h-[40px] rounded-full z-[-1]`}></div>
      <div
        onMouseEnter={handlemoveEnterOpen}
        onMouseLeave={handleMouseLeave}
        ref={walletWrapperRef}
        className={`group/wallet overflow-hidden absolute-y-center right-[310px] flex items-center cursor-pointer backdrop-blur-md rounded-full  h-[60px] transition-300-ease  ${openWallet ? "w-[122px]" : "w-[60px]"}  ${currentWallet.bg === 'group' ? "bgwrapper-group" : currentWallet.bg === 'personal' ? "bgwrapper-personal" : "bg-[rgba(255,255,255,0.05)]"}`}>
        <div
          onMouseEnter={handleMouseEnterPersonal}
          className={`group/personal z-[0] w-[60px] rounded-full h-full flex flex-col items-center absolute-y-center transition-300-ease  ${currentWallet.wallet === 'personal' ? "right-0" : "right-[58px]"}`} onClick={hanldeSetWallet.bind(null, 'personal')}>
          <img className='absolute-x-center top-1/2 [transform:translate(-50%,-50%)] w-[44px] h-[44px] transition-300-ease group-hover/personal:[transform:translate(-50%,calc(-50%-6px))]' src={currentImg.personal} alt='personal' />
          <span className='absolute-x-center bottom-[8px] text-white text-xxs group-hover/personal:opacity-100 transition-300-ease opacity-0'>{t('WALLET_PERSONAL')}</span>
        </div>
        <div
          onMouseEnter={handleMouseEnterGroup}
          className={`group/group w-[60px] h-full rounded-full flex flex-col absolute-y-center transition-300-ease ${currentWallet.wallet === 'group' ? "right-0" : "right-[58px]"}`} onClick={hanldeSetWallet.bind(null, 'group')}>
          <img className='absolute-x-center top-1/2 [transform:translate(-50%,-50%)] w-[44px] h-[44px] transition-300-ease group-hover/group:[transform:translate(-50%,calc(-50%-6px))]' src={currentImg.group} alt='group' />
          <span className='absolute-x-center bottom-[8px] text-white text-xxs group-hover/group:opacity-100 transition-300-ease opacity-0'>{t('WALLET_GROUP')}</span>
        </div>
      </div>
    </>

  );
};


export { RodinWallet }