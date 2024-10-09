import { useEffect, useState } from "react";
import style from './index.module.css'
import marks from '../../assets/marks.png'
import demo4 from '../../assets/demo4.png'
import demo1 from '../../assets/demo1.png'
import demo2 from '../../assets/demo2.png'
import demo3 from '../../assets/demo3.png'

const three_mock_arr = [
  {
    name: 'demo1',
    img: demo1,
    info: "As a game model designer.I'm thrilledto be involved in the development ofcaptivating 3D car games.From creating realistic car models todesigning stunning environments......"
  },
  {
    name: 'demo2',
    img: demo2,
    info: "As a game model designer.I'm thrilledto be involved in the development ofcaptivating 3D car games.From creating realistic car models todesigning stunning environments......"
  },
  {
    name: 'demo3',
    img: demo3,
    info: "As a game model designer.I'm thrilledto be involved in the development ofcaptivating 3D car games.From creating realistic car models todesigning stunning environments......"
  },
  {
    name: 'demo4',
    img: demo4,
    info: "As a game model designer.I'm thrilledto be involved in the development ofcaptivating 3D car games.From creating realistic car models todesigning stunning environments......"
  },
]

export const ExhibitionHall = () => {
  const [currentShowIdx, setCurrentShowIdx] = useState(0);
  const [loading3d, setLoading3d] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading3d(false)
    }, 4000);
  }, [])

  const handleChooseShow = (idx) => {
    setCurrentShowIdx(idx)
  }

  return (
    <div className='flex flex-[0.5] md:flex-[0.4] relative h-full'>

      <div className='absolute-x-center w-[120%] h-[275px] bottom-0 overflow-hidden grid-bg'></div>
      {loading3d ? <div className='absolute-center z-[200] flex flex-col items-center'>
        <div className={style.body}>
          <div className={style.one}></div>
          <div className={style.two}></div>
          <div className={style.three}></div>
          <div className={style.four}></div>
        </div>
        <div className={style.font}>loading 3D...</div>
      </div> : (
        <>
          <div className='relative z-[101] w-full h-auto aspect-[1/1] rounded-lg'>
            <img src={three_mock_arr[currentShowIdx].img} className=' absolute-center m-auto w-[80%] h-auto' alt={three_mock_arr[currentShowIdx].name} />
          </div>
          <div className='absolute z-[102] bottom-0 right-0 w-full flex justify-around md:top-0 md:flex-col md:h-full md:w-max'>
            {three_mock_arr.map((item, index) => (
              <div
                key={index}
                onClick={handleChooseShow.bind(null, index)}
                className={`${currentShowIdx === index ? "border-[#0FE0ED]" : "border-[transparent]"} flex-center cursor-pointer border-2 transition-300-ease w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] lg:w-[110px] lg:h-[110px] xl:w-[150px] xl:h-[150px] overflow-hidden  bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10`}>
                <img src={item.img} className='w-[80%] h-[80%]' alt={item.name} />
              </div>
            ))}
          </div>
          <div className='absolute z-[100] left-0 top-0 md:bottom-0 md:top-auto rounded-xl w-[240px] sm:w-[280px] md:w-[305px] p-4 text-left text-[#d9d9d9] bg-white bg-opacity-10 shadow-[0_2px_24px_0_#3F3F3F1A] backdrop-blur-sm'>
            {three_mock_arr[currentShowIdx].info}
            <img className='absolute top-0 left-[20px] translate-y-[-70%] w-[32px] h-[32px]' src={marks} alt="marks" />
          </div>
          <div className='absolute z-[100] right-0 top-[20px] md:left-0 md:top-0 md:right-auto md:bottom-auto rounded-xl w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] bg-black flex-center small-fadein'>
            <img className='w-[80%] h-[80%]' src={three_mock_arr[currentShowIdx].img} alt="marks" />
          </div>
        </>
      )}

    </div>
  )
}