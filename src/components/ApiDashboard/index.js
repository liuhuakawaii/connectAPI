import {
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from "recoil";
// import style from "./api-dashboard.module.css";
import { showApiDashboardAtom , logInfoAtom, subscriptionsInfoAtom, showSubscribeAtom} from "../../store";
import { useRef, useEffect, useState } from "react";
import {
  createSelfServiceApiKey,
  listSelfServiceApiKeys,
  deprecateSelfServiceApiKey,
  getWalletHistory,
} from "../../utils/net";
import { useTips } from "../../common/GlobalTips";
import { useTranslation } from "react-i18next";
// import { FaPlus, FaTrash } from "react-icons/fa";
// import usageImg from './assets/usage.png'
import { FaChartBar } from "react-icons/fa";
import { FaRegTrashAlt } from "react-icons/fa";
import { RiExchangeLine } from "react-icons/ri";
import { PiCopy } from "react-icons/pi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ExpenseGraph from './ExpenseGraph';
import { IoAdd } from "react-icons/io5";

const ApiDashboard = () => {
  const subscriptionsInfo = useRecoilValue(subscriptionsInfoAtom)
  const logInfo = useRecoilValue(logInfoAtom)
  const [showApiDashboard, setShowApiDashboard] = useRecoilState(showApiDashboardAtom);
  const setShowSubscribe = useSetRecoilState(showSubscribeAtom)
  const [apiKeys, setApiKeys] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [currentPage,setCurrentPage]=useState(false)
  const [showOptSubLinkTip, setShowOptSubLinkTip] = useState(false)
  const [currentDeleteId,setCurrentDeleteId]=useState(false)
  const [loading,setLoading]=useState(false)
  const date = new Date();
  const currentyear = date.getFullYear();
  const currentmonth = ('0' + (date.getMonth() + 1)).slice(-2);
  const [apiName,setApiName]=useState(false)
  const [currentDate,setCurrentDate] = useState({
    year:currentyear,
    month:currentmonth
  })
  const { t } = useTranslation();
  const tip = useTips(null);
  const ref = useRef(null);
  const [allCost,setAllCost]=useState(false)
  const [tempKey,setTempKey]=useState(false)
  const [openCreatePage,setOpenCreatePage]=useState(false)
  const [openDeletePage,setOpenDeletePage]=useState(false)

  // const OpenAPIDocsURL = "https://hyperhuman.deemos.com/api/v1/docs";
  const monthChange={
    '01':'Jan',
    '02':'Feb',
    '03':'Mar',
    '04':'Apr',
    '05':'May',
    '06':'Jun',
    '07':'Jul',
    '08':'Aug',
    '09':'Sept',
    '10':'Oct',
    '11':'Nov',
    '12':'Dec',
  }

  function dateData(key, sort) {
    return function(a, b) {
      var value1 = a[key];
      var value2 = b[key];
      if (sort) {
        return Date.parse(value1) - Date.parse(value2);
      } else {
        return Date.parse(value2) - Date.parse(value1)
      }
    }
  }

  const handlerClose = (event) => {
    if (ref.current && ref.current.contains(event.target)) return;
    if (window.history.length <= 1) {
      window.history.pushState(null, null, "/");
    } else {
      window.history.pushState(null, null, "/");
      // window.history.back();
    }
    setShowApiDashboard(false);
  };

  const handlerCreateClose = (event) =>{
    const doc=document.getElementById('createPage')
    if (doc && doc.contains(event.target)){
      return;
    }else{
      setOpenCreatePage(false);
    }
  }

  const handlerDeleteClose = (event) =>{
    const doc=document.getElementById('deletePage')
    if (doc && doc.contains(event.target)){
      return;
    }else{
      setOpenDeletePage(false);
    }
  }

  const handlerCreateSelfServiceApiKey = async (descr) => {
    const fetchSelfServiceApiKeys = async () => {
      if (localStorage.getItem("user_uuid") == null) return;
      try {
        const ret = await handlerListSelfServiceApiKeys();
        const apikeys=ret.sort(dateData('create_time',false))
        setApiKeys(apikeys);
      } catch (e) {
        console.error(e);
      }
    };
    if(!loading){
      setLoading(true)
      const ret = await createSelfServiceApiKey(descr);
  
      if(ret && ret.data?.api_key){
        setLoading(false)
        setTempKey(ret.data?.api_key)
        
      }else{
        tip({
          type: "error",
          content: t("TIP_ERR_API_CREATE"),
        });
        return;
      }
      // setApiKeyCreated(ret.api_key);
  
      tip({
        type: "success",
        content:
          t('TIP_SUCCESS_API_KEY_CREATED'),
      });
  
      fetchSelfServiceApiKeys();
    }
    
  };

  const handlerDeprecateSelfServiceApiKey = async (apiKeyId, action) => {
    if(!loading){
      setLoading(true)
      const ret = await deprecateSelfServiceApiKey(apiKeyId, action);
      if(ret){
        const ret = await handlerListSelfServiceApiKeys();
        const apikeys=ret.sort(dateData('create_time',false))
        setApiKeys(apikeys);
        tip({
          type: "success",
          content: t('TIP_SUCCESS_API_DELETE'),
        });
        setCurrentDeleteId(false)
        setOpenDeletePage(false)
        setLoading(false)
      }
      if (!ret) {
        tip({
          type: "error",
          content: t("TIP_ERR_API_DELETE"),
        });
        return;
      }
    }
  };

  const handlerListSelfServiceApiKeys = async () => {
    const ret = await listSelfServiceApiKeys();
    if (!ret) {
      tip({
        type: "error",
        content: t("TIP_ERR_API_LIST"),
      });
      return;
    }
    if (ret.data?.keys) return ret.data?.keys;
    else if (ret.error) {
      switch (ret.error) {
        // May need more error handling
        default:
          tip({
            type: "error",
            content: t("TIP_ERR_API_LIST"),
          });
          break;
      }
      return [];
    }
   
  };

  useEffect(() => {
    let interval
    if (showOptSubLinkTip) {
        interval = setInterval(() => {
            setShowOptSubLinkTip(false)
            clearInterval(interval)
        }, 3000)
    } else {
        clearInterval(interval)
    }
}, [showOptSubLinkTip])

  useEffect(() => {
    if(showApiDashboard){
      const fetchSelfServiceApiKeys = async () => {
        if (localStorage.getItem("user_uuid") == null) return;
        try {
          const ret = await handlerListSelfServiceApiKeys();
          const apikeys=ret.sort(dateData('create_time',false))
          setApiKeys(apikeys);
        } catch (e) {
          console.error(e);
        }
      };
      fetchSelfServiceApiKeys();
      const fetchUsage = async () => {
        if (localStorage.getItem("user_uuid") == null) return;
        try {
          const baseParam = {
            owner_type: 'user',
            query_info: { user_uuid: localStorage.getItem("user_uuid") }
          }
          const [expenseData] = await Promise.all([
            getWalletHistory('Expense', baseParam),
          ]);
          const el=expenseData?.data?.data;
          setExpenseList(el);
        } catch (e) {
          console.error(e);
        }
      }
  
      fetchUsage();
    }
  }, [showApiDashboard]);

  if (!showApiDashboard) return null;

  const tsetTitle=[
    t('API_DESCRIPTION'), t('API_SECRET_KEY'),t('API_CREATED_TIME'),t('API_CREATED_BY')
  ]

  const handlerOpenSub =()=>{
    setShowApiDashboard(false)
    setShowSubscribe(true);
  }

  const changeName=(e)=>{
    if(e.target.value!==''){
      setApiName(e.target.value)
    }else{
      setApiName(false)
    }
  }

  const changPreMonth=()=>{
    const current=Number(currentDate.year+currentDate.month)
    if(current-Math.floor(current/100)*100-1===0){
      setCurrentDate({
        year:String(Math.floor(current/100)-1),
        month:'12'
      })
    }else{
      setCurrentDate({
        year:String(Math.floor(current/100)),
        month:String(current-Math.floor(current/100)*100-1).padStart(2,'0')
      })
    }
  }

  const changPostMonth=()=>{
    const current=Number(currentDate.year+currentDate.month)
    if(current-Math.floor(current/100)*100+1===13){
      setCurrentDate({
        year:String(Math.floor(current/100)+1),
        month:'01'
      })
    }else{
      setCurrentDate({
        year:String(Math.floor(current/100)),
        month:String(current-Math.floor(current/100)*100+1).padStart(2,'0')
      })
    }
  }

  return (
    <div className='w-[100vw]  h-[100vh] overflow-hidden fixed top-0 left-0 bg-[rgba(0,0,0,0.3)] flex-center z-[9000] select-none'  onClick={handlerClose}>
      <div className='relative  min-w-[668px] min-h-[435px] w-[668px] h-[435px] xs:w-[804px] xs:h-[503px] sm:w-[899px] sm:h-[550px] md:w-[1056px] md:h-[628px] lg:w-[1308px] lg:h-[755px] xl:w-[1308px] xl:h-[755px] pb-[20px] sm:pb-[30px] lg:pb-[40px] xl:pb-[50px] px-[25px] sm:px-[35px] lg:px-[45px] xl:px-[55px] bg-[#2C2C2C] rounded-2xl flex flex-col items-start' ref={ref}>
          {openCreatePage && <div onClick={handlerCreateClose} className='w-[100vw] h-[100vh] fixed top-0 left-0 bg-[rgba(0,0,0,0.3)] flex-center z-[4000] select-none'>
            <div id='createPage' className={`bg-[#2C2C2C] rounded-2xl flex flex-col text-left justify-between  ${tempKey?'aspect-[1.8]':'aspect-[1.5]'} min-w-[356px] w-[356px]  xs:w-[356px]  sm:w-[456px]  md:w-[456px]  lg:w-[508px]  xl:w-[608px] p-[20px] sm:p-[30px] lg:p-[30px] xl:p-[40px]`}>
              <span className='text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] text-white'>{tempKey?t('API_SAVE_YOUR_KEY'):t('API_CREATE_YOUR_KEY')}</span>
              <div className={`w-full flex flex-col gap-2 text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] ${tempKey?'-mt-[10px] sm:-mt-[20px] lg:-mt-[30px] xl:-mt-[40px]':'-mt-[40px] sm:-mt-[50px] lg:-mt-[60px] xl:-mt-[70px]'}`}>
                <span>{tempKey?t('API_KEY'):t('API_NAME')}</span>
                {tempKey?<div className='w-full flex flex-row justify-between gap-2 text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px]'>
                  <div className='w-[80%] flex items-center justify-around p-2 border border-[#565869]  rounded-lg'><div className='w-full overflow-hidden  '>{tempKey}</div></div>
                  <button onClick={()=>{
                    navigator.clipboard.writeText(String(tempKey))
                  }} className='w-[20%] flex flex-row items-center justify-center gap-1  rounded-lg  bg-[#6F6CFF] hover:bg-[#807efd] [transition:all_0.2s_ease]'><div><PiCopy/></div>{t('API_COPY')}</button>
                </div>:<div className='w-full border border-[#565869]  rounded-lg p-2'>
                  <input onChange={changeName} className='w-full'/>
                </div>}
              </div>
              {tempKey?<div className='flex flex-row justify-end gap-4 text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] '>
                  <button onClick={()=>{
                    setTempKey(false)
                    setOpenCreatePage(false)
              }} className='rounded-xl px-[10px] sm:px-[16px] lg:px-[24px] xl:px-[24px] py-[8px] sm:py-[11px] lg:py-[14px] xl:py-[14px] bg-[rgb(53,55,64)] hover:bg-[rgba(53,55,64,0.8)] [transition:all_0.2s_ease]'>{t('API_DONE')}</button>
              </div>:<div className='flex flex-row justify-end gap-4 text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] '>
                <button onClick={()=>{setOpenCreatePage(false);setTempKey(false)}} className='rounded-xl  px-[10px] sm:px-[16px] lg:px-[24px] xl:px-[24px] py-[8px] sm:py-[11px] lg:py-[14px] xl:py-[14px] bg-[rgb(53,55,64)] hover:bg-[rgba(53,55,64,0.8)]'>{t('API_CANCEL')}</button>
                <button onClick={()=>{
                  if(!loading && apiName){
                    handlerCreateSelfServiceApiKey(apiName)
                  }
                }} className={`rounded-xl flex items-center justify-center w-[45%] py-[8px] sm:py-[11px] lg:py-[14px] xl:py-[14px] [transition:all_0.2s_ease] bg-[#6F6CFF] ${loading || !apiName?'cursor-not-allowed':'cursor-pointer hover:bg-[#807efd]'}`}>{loading?<AiOutlineLoading3Quarters className='animate-spin'/>:t('API_CREATE_KEY')}</button>
              </div>}
            </div>
          </div>}
          {openDeletePage && <div onClick={handlerDeleteClose} className='w-[100vw] h-[100vh] fixed top-0 left-0 bg-[rgba(0,0,0,0.3)] flex-center z-[4000] select-none'>
            <div id='deletePage' className='bg-[#2C2C2C] rounded-2xl flex flex-col text-left justify-between  aspect-[1.8] min-w-[356px] w-[356px]  xs:w-[356px]  sm:w-[456px]  md:w-[456px]  lg:w-[508px]  xl:w-[608px] p-[20px] sm:p-[30px] lg:p-[30px] xl:p-[40px]'>
              <span className='flex justify-center items-center text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] text-white'>{t('API_REVOKE_KEY')}</span>
              <div className='w-full flex flex-col gap-2 text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px] '>
                {t('API_REVOKE_TIP')}
              </div>
              <div className='flex flex-row justify-end gap-4 text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] '>
                <button onClick={()=>{setOpenDeletePage(false);setCurrentDeleteId(false)}} className='rounded-xl px-[10px] sm:px-[16px] lg:px-[24px] xl:px-[24px] py-[5px] sm:py-[6px] lg:py-[9px] xl:py-[9px] bg-[rgb(53,55,64)] hover:bg-[rgba(53,55,64,0.8)]'>{t('API_CANCEL')}</button>
                <button onClick={()=>{
                  if(!loading){
                    handlerDeprecateSelfServiceApiKey(currentDeleteId,"Delete")
                  }
                }} className={`rounded-xl flex items-center justify-center w-[45%] py-[5px] sm:py-[6px] lg:py-[9px] xl:py-[9px] [transition:all_0.2s_ease] bg-[#DA0D0DCC]  ${loading?'cursor-not-allowed':' cursor-pointer hover:bg-[#da0d0d98]'}`}>{loading?<AiOutlineLoading3Quarters className='animate-spin'/>:t('API_REVOKE_KEY')}</button>
              </div>
            </div>
          </div>}
        <div className=' h-[15%] xl:h-[20%] w-full  border-b border-black  flex flex-row justify-between items-center'>
          <span
              className='font-bold text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] text-white'>{t('WALLET_POPUP_API_DASHBOARD')}
          </span>
          <div className={'flex'} style={{gap: "10px"}}>
            <button
                onClick={() => window.open('https://forms.gle/ev4rXXdfAaXaBCM57', '_blank')}
                className={`py-2 px-4 text-white text-[12px] cursor-pointer hover:bg-[#807efd] sm:text-[14px] md:text-[16px] lg:text-[18px] bg-[#6F6CFF]  [transition:all_0.2s_ease]  rounded-xl flex flex-row items-center gap-2 `}>
              <span>Developer Support Program</span>
            </button>

            <button onClick={() => {
              if (subscriptionsInfo.plan_level === 'Business') {
                setOpenCreatePage(true)
              } else {
                setShowOptSubLinkTip(true)
              }
            }}
                    className={`py-2 px-2 text-white text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] bg-[#6F6CFF]  [transition:all_0.2s_ease]  rounded-xl flex flex-row items-center gap-1 ${showOptSubLinkTip ? ' cursor-not-allowed' : ' cursor-pointer hover:bg-[#807efd]'}`}
                    style={{ paddingRight: '25px' }}
            >
              <div className='flex items-center justify-center aspect-square h-full'><IoAdd/></div>
              <span style={{ whiteSpace: 'nowrap' }}>{t('API_CREATE_NEW_KEY')}</span>
            </button>
          </div>
          <div
              className={`absolute text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px]  right-[5%] -top-[3%] whitespace-nowrap  text-[#FF4E4E] bg-white [transition:all_0.3s_ease] [box-shadow:0px_3px_6px_1px_rgba(150,_150,_150,_0.35)] px-3  py-[0.35rem] rounded-xl ${showOptSubLinkTip ? 'opacity-100 visible' : 'opacity-0 invisible'}
            before:content-[""] before:absolute before:right-2 before:-bottom-[0.4rem] before:w-2 before:h-2 before:[border-top:7px_solid_white] before:[border-left:5px_solid_transparent] before:[border-right:5px_solid_transparent]`}>
            <span>{t('UNLOCK_SUB_TIP1')}<span
                className='border-b-[1px_solid_#ff4e4e] [transition:color_0.3s_ease,_border-color_0.3s_ease] underline underline-offset-2 hover:text-[#4A00E0] hover:border-[#4A00E0] cursor-pointer'
                onClick={handlerOpenSub}>{t('UNLOCK_SUB_TIP3')}</span></span>
          </div>
        </div>

        <div
            className=' h-[35%] w-full flex flex-col justify-around text-[#B1B1B1] text-left gap-4 text-[12px] xs:text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] py-[15px] sm:py-[18px] lg:py-[28px]'>
          <span>{t('API_TIP1')}</span>
          <span>{t('API_TIP2')}</span>
          <span>{t('API_TIP3_1')}<a
              className='underline underline-offset-2 text-[#DDDDDD]' href='https://developer.deemos.dev/'
              target='_blank' rel='noreferrer'>{t('API_TIP3_2')}</a>.</span>
        </div>
        <div
            className='h-[220px] xs:h-[240px] sm:h-[260px] md:h-[300px] lg:h-[360px]  w-full [background:rgba(0,0,0,0.2)] rounded-2xl  flex flex-col justify-start '>
          <div
              className='w-full relative flex flex-row items-center justify-center text-[#B1B1B1] cursor-pointer rounded-t-2xl bg-[rgba(0,0,0,20%)] px-[5px] sm:px-[15px] lg:px-[25px] text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] py-[3px] sm:py-[13px] lg:py-[23px]'>
            {currentPage && allCost && <div className='absolute left-[15px] sm:left-[20px] lg:left-[25px] text-[#999999]'>{t('API_USAGE')}: <span className="text-white">{allCost}</span> credit</div>}
              <div className='flex flex-row relative items-center gap-2 font-bold'>
                <span className={`${currentPage?'text-[#555555]':'text-[#B1B1B1]'} [transition:all_0.2s_ease] py-[8px] xs:py-[8px] sm:py-[2px] `} onClick={setCurrentPage.bind(null,false)}>{t('API_DETAILS')}</span>
                <div className='[color:#4D4D4D] hover:[color:#B1B1B1] [transition:all_0.2s_ease]' onClick={()=>{
                  setCurrentPage((old)=>!old)
                  setCurrentDate({
                    year:currentyear,
                    month:currentmonth
                  })
                }}><RiExchangeLine/></div>
                <div className={`${currentPage?'text-[#B1B1B1]':'text-[#555555]'} [transition:all_0.2s_ease] relative flex flex-row gap-1 items-center`} onClick={()=>{setCurrentDate({
                    year:currentyear,
                    month:currentmonth
                  })
                  setCurrentPage(true)
                  }}>{t('API_USAGE')}<div className={`${currentPage?'text-[#B1B1B1]':'text-[#555555]'} [transition:all_0.2s_ease] `}><FaChartBar/></div></div>
              </div>
              {currentPage && <div className='absolute right-[10px] sm:right-[20px] lg:right-[30px] text-[#B1B1B1]'>
                <span className='pr-2 cursor-pointer [color:#555555] hover:[color:#B1B1B1] [transition:all_0.2s_ease]' onClick={changPreMonth}>{'<'}</span>
                {currentDate.year+'.'+currentDate.month}
                <span className={`pl-2  [color:#555555]  [transition:all_0.2s_ease] ${Number(currentDate.year)===currentyear && Number(currentDate.month)>Number(currentmonth-1) ?'cursor-not-allowed':'cursor-pointer hover:[color:#B1B1B1]'}`} onClick={Number(currentDate.year)===currentyear && Number(currentDate.month)>Number(currentmonth-1)?()=>{}:changPostMonth}>{'>'}</span>
              </div>}
            </div>
            {!currentPage ? apiKeys.length>0?<div className='w-full h-full px-[15px] sm:px-[20px] lg:px-[25px] pt-[5px] xs:pt-[8px] sm:pt-[13px] lg:pt-[23px] text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] overflow-hidden'>
              <div className='w-[97%] flex flex-row items-center justify-between mb-2'>
                {tsetTitle.map((item, index) => <div className={`w-full font-bold text-left text-[#807ED8] whitespace-nowrap`} key={index}>{item}</div>)}
              </div>
              <div className='w-full h-[80%] overflow-scroll '>
              {apiKeys.map((item,index)=>{
                const date=item.create_time.split('T')[0].split('-')[2]+' '+monthChange[item.create_time.split('T')[0].split('-')[1]]+' '+item.create_time.split('T')[0].split('-')[0]+' '+item.create_time.split('T')[1].split(':')[0]+':'+item.create_time.split('T')[1].split(':')[1]
                return(
                  <div key={index} className={`w-full flex flex-row items-center justify-between border-t border-[rgba(255,255,255,0.1)] py-3`}>
                    <div className='w-[97%] flex flex-row text-left items-center  justify-between'>
                      <div className='w-full  [text-overflow:ellipsis]'>{item.description}</div>
                      <div className='w-full'>{item.key}</div>
                      <div className='w-full'>{date}</div>
                      <div className='w-full'>{logInfo.username}</div>
                    </div>
                    <div onClick={()=>{setOpenDeletePage(true);setCurrentDeleteId(item.id)}} className={`w-[3%] cursor-pointer flex justify-around [transition:all_0.1s_ease] [color:white] hover:[color:rgb(220,80,77)] `}><FaRegTrashAlt/></div>
                  </div>
                )
              })}
              </div>
            </div>:<div className='w-full h-full flex items-center justify-center text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-bold'>{t('API_CREATE_FIRST_KEY')}</div>:<ExpenseGraph expenseList={expenseList} setAllCost={setAllCost} currentDate={currentDate}/>}
            
          </div>
      </div>
    </div>
  );
};

export { ApiDashboard };
