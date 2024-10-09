import { BiHelpCircle } from "react-icons/bi";

const Annotation =({text,left,bottom})=>{

    return(
        <div className='group relative [filter:drop-shadow(0px_2px_12px_#56565633)]'>
            <BiHelpCircle className='text-[rgba(172,172,172,1)] hover:text-[#8f8f8f]'/>
            <div className={`absolute py-[10px] px-[16px]  w-[max-content] [max-width:14rem] z-[1] -right-3.5 bottom-5 text-xs  font-[400] [transition:all_0.3s_ease] text-left leading-4 [font-family:Arial]
            text-[#909090] bg-white  rounded-lg cursor-default opacity-0 invisible  group-hover:opacity-100 group-hover:visible`}
            style={{
                left:left,
                marginBottom:bottom?bottom:''
            }}>{text}</div>
            <div className='absolute bottom-[0.54rem] w-[12px] h-[12px] [border-top-color:#fff] [transition:all_0.3s_ease] border-[6px] border-solid border-[transparent]
            opacity-0 invisible group-hover:opacity-100 group-hover:visible '
            style={{
                marginBottom:bottom?bottom:''
            }}></div>
        </div>
    )
}

export {Annotation}