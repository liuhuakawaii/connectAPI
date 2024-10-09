import React, { useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CardDataContext } from "../../../../utils/context";
import privated from '../../../../assets/private.png'
import unPrivate from '../../../../assets/unPrivate.png';
import homeprivate from '../../assets/homeprivate.png'
import { getUserInfo, setPrivate } from "../../../../utils/net";
import { useRecoilState } from "recoil";
import { userPermissionAtom } from "../../../../store";
import { useTranslation } from "react-i18next";
import {checkMobile} from "../../../../utils/format";

const Private = () => {
  const { is_private } = useContext(CardDataContext);
  if (!is_private) {
    return null
  }
  return (
    <div className={`w-[40px] h-[40px] rounded-xl bg-[rgba(35,93,247,0.15)] transition-300-ease backdrop-blur-md flex-center`}>
      <img className="w-[20px] h-[20px]" src={privated} alt="private" />
    </div>
  )
}

const HomePagePrivate = React.forwardRef(({ homePagePrivate, currentWallet, setHomePagePrivate, currentStatus }, ref) => {
  const [hover, setHover] = useState(false)
  const selfRef = useRef(null)
  const { t } = useTranslation();
  const [userPermission, setUserPermission] = useRecoilState(userPermissionAtom);

  useImperativeHandle(ref, () => ({
    setPrivateDelay: async (task_uuid) => {
      const data = await setPrivate(task_uuid);
      if (!data.data.error) {
        if (!userPermission.subscribe) {
          const newInfo = await getUserInfo({});
          setUserPermission((pre) => {
            return {
              ...pre,
              privateQuantity: newInfo.data.meta.chances_left_to_set_private_task,
            }
          })
        }
      }
    },
    selfRef: selfRef
  }));

  useEffect(() => {
    if (userPermission.chatavatar_tab_group && currentWallet.wallet === 'group') {
      setHomePagePrivate(true)
    }
  }, [currentWallet])

  const handleClick = () => {
    if (currentStatus || currentWallet.wallet === 'group' && homePagePrivate) {
      return
    }
    setHomePagePrivate((old) => !old)
  }

  const handleMouseEnter = () => {
    setHover(true)
  }

  const handleMouseLeave = () => {
    setHover(false)
  }

  const currentUrl = homePagePrivate ? homeprivate : unPrivate
  const isMobile = checkMobile()
  return (
    <div
      ref={selfRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className='absolute top-1/2 left-[-90px] translate-x-[-100%] translate-y-[-50%] w-[fit-content] group:private ml-[10px] mr-[90px] h-[60px] cursor-pointer select-none' >

      <div className={`w-[60px] h-[60px] absolute z-20 rounded-[50px]  transition-300-ease flex-center ${hover ? "" : "bg-[rgba(255,_255,_255,_0.05)]"}  ${homePagePrivate ? 'bg-[rgba(98,94,255,1)] group-hover/private:bg-[rgba(255,_255,_255,0)]' : ""}`}>
        <img className={`w-[20px] h-[20px]`} src={currentUrl} alt="private" />
        <span className={`absolute transition-300-ease rounded-[100%] w-[36.14px] h-[36.14px] overflow-hidden blur bg-[rgba(255,_255,_255,_0.15)] ${hover ? 'opacity-100 ' : 'opacity-0'}`}></span>
      </div>
      {!isMobile && (
        <div className={`flex text-primary backdrop-blur-lg  flex-col justify-around items-start pl-[20px] py-2 h-[60px] rounded-[50px] z-10 bg-[rgba(255,_255,_255,_0.05)]  font-[Arial] text-[16px] font-normal leading-[23.2px] tracking-wider text-center
        absolute transition-300-ease ${!homePagePrivate && hover ? 'w-[136px] -translate-x-[76px] opacity-100 ' : 'w-[60px] translate-x-[-10px] opacity-0'}`}>
          {t('BUTTON_PRIVATE')}
          {userPermission.privateQuantity !== Infinity &&
            <span className="text-xs text-white">{userPermission.privateQuantity}
              <span className="text-[rgba(255,255,255,0.5)]"> times</span>
            </span>}
        </div>
      )}
    </div>
  )
}
)

HomePagePrivate.displayName = 'HomePagePrivate'
export { HomePagePrivate, Private } 