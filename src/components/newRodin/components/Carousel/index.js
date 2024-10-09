import { useEffect, useMemo, useRef, useState } from "react";

export const Carousel=({ dataSource })=> {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null); 
 
  const list = useMemo(() => {
    return [...dataSource, dataSource[0]];
  }, [dataSource]);

  useEffect(() => {
    const goNext = () => {
      setTimeout(() => {
        if (currentIndex + 1 === list.length) {
          if (carouselRef.current && carouselRef.current.style) {
            carouselRef.current.style.transform = "translateX(0%)";
          }
          setCurrentIndex(0);
        } else {
          setCurrentIndex(currentIndex + 1);
          if (currentIndex + 1 === list.length - 1) {
            setTimeout(() => {
              setCurrentIndex(0);
            }, 300);
          }
        }
      }, 2000);
    };
    goNext();
  }, [currentIndex, list]);

  return (
    <div className="w-full h-full overflow-hidden">
      <div className='absolute-x-center top-[20px] w-[85%] flex gap-1'>
        {list.map((img, i) => (
          <div key={i} className={`transition-300-ease h-[5px] rounded-full flex-grow ${currentIndex === i ?"bg-[#00000050]":"bg-[#00000020]" }`}></div>
        ))}
      </div>
      <div
        ref={carouselRef}
        className="flex w-full h-full"
        style={{
          width: `${100 * list.length}%`,
          transform: `translateX(-${(100 / list.length) * currentIndex}%)`,
          transition: 0 === currentIndex ? `` : "transform 0.3s",
        }}
      >
        {list.map((data, index) => {
          return (
            <div key={index} className="w-[80%] h-[80%] flex-center">
              <img src={data} />
            </div>
          );
        })}
      </div>
    </div>
  );
}