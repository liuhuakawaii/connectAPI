import { useRecoilState, useSetRecoilState } from "recoil";
import { showSubscribeAtom } from "../../../../store";

const ShakeTips = ({ setShow, show, style }) => {
  const setShowSubscribe = useSetRecoilState(showSubscribeAtom)

  const handleOpenSub = () => {
    
    setShowSubscribe(true)
    setShow(false)
  }

  return (
    <div style={style} className={`z-[100] flex gap-1 absolute top-0 left-0 w-max text-xxs sm:text-xs p-[8px] sm:p-[12px] drop-shadow-[0px_2px_12px_#4A00E033] bg-white rounded-xl text-[#FF4E4E] after:absolute after:[content:""] after:left-2/3 after:bottom-0 after:-translate-x-1/2 after:translate-y-[100%] after:w-0 after:h-0 after:border-[6px] after:border-[transparent] after:border-t-[white] ${show ? "opacity-100 visible animate-tips-bounce" : "opacity-0 invisible"}`}>
      <span>Unlock with</span><span onClick={handleOpenSub} className='relative before:absolute before:[content:""] before:left-0 before:bottom-0 before:transition-300-ease before:duration-100 hover:text-[#4a00e0] cursor-pointer before:bg-[#FF4E4E] before:w-full before:h-[1px] hover:before:bg-[#4a00e0]'>Business Subscription</span>
    </div>
  );
};

const RedoTips = ({ style }) => {
  const [userPermission, setShowSubscribe] = useRecoilState(showSubscribeAtom)
  const info = {
    default: "2x",
    Creator: '5x'
  }

  const handleOpenSub = () => {
    
    setShowSubscribe(true)
  }

  return (
    <div style={style} className={`w-[220px] h-[50px] sm:w-[280px] sm:h-[50px] md:w-[302px] md:h-[60px] text-xxs sm:text-xs 2xl:text-sm z-[100] gap-1 text-left p-[8px] sm:p-[10px] drop-shadow-[0px_2px_12px_#4A00E033] bg-white rounded-xl text-[#909090] after:absolute after:[content:""] after:left-[30%] after:bottom-0 after:-translate-x-1/2 after:translate-y-[100%] after:w-0 after:h-0 after:border-[6px] after:border-[transparent] after:border-t-[white] `}>
      Unlock <span className="text-[#2d2d2d]">{info[userPermission.subscribe || 'default']}</span> redos instantly by subscribing to our membership. <span onClick={handleOpenSub} className='relative after:absolute after:[content:""] after:left-0 after:bottom-[-1px] after:transition-300-ease text-[#4a00e0] cursor-pointer after:w-0 after:h-[1px] hover:after:w-full hover:after:bg-[#4a00e0]'>Go to subscribe!</span>
    </div>
  );
};

export { ShakeTips, RedoTips };


