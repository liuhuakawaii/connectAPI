import { useRecoilState } from 'recoil';
import style from './index.module.css';
import { rodinInitWeightAtom } from '../../../../store';
import { useTranslation } from "react-i18next";
import React from 'react';

export const DecreasingWidthBoxes = ({ parentWidth = 300, currentWeight, handlerClickWeight }) => {
  const numBoxes = 5;
  const maxBoxWidth = parentWidth / numBoxes;
  const minBoxWidth = maxBoxWidth / numBoxes;
  const boxWidths = Array.from({ length: numBoxes }, (_, i) => maxBoxWidth - (i * (maxBoxWidth - minBoxWidth) / (numBoxes - 1)));

  return (
    <div className={style.decreasingWrapper}
      onMouseDown={handlerClickWeight.bind(null, 0)}>
      {boxWidths.map((width, index) => (
        <div
          key={index}
          className={`${style.decreasingItem} ${currentWeight === 0 ? style.active : ''}`}
          style={{ width: width }}
        />
      ))}
    </div>
  );
};

export const AverageWidthBoxes = ({ currentWeight, handlerClickWeight }) => {

  return (
    <div className={style.decreasingWrapper}
      onMouseDown={handlerClickWeight.bind(null, 1)}>
      {new Array(5).fill(1).map((width, index) => (
        <div
          key={index}
          className={`${style.decreasingItem} ${currentWeight === 1 ? style.active : ''}`}
          style={{ width: '20%' }}
        />
      ))}
    </div>
  );
};

export const PrimaryWidthBoxes = ({ currentWeight, handlerClickWeight }) => {
  const boxWidths = ['50%', '12.5%', '12.5%', '12.5%', '12.5%',]

  return (
    <div className={style.decreasingWrapper}
      onMouseDown={handlerClickWeight.bind(null, 2)}>
      {boxWidths.map((width, index) => (
        <div
          key={index}
          className={`${style.decreasingItem} ${currentWeight === 2 ? style.active : ''}`}
          style={{ width: width }}
        />
      ))}
    </div>
  );
};

export const Weight = React.forwardRef((props, ref) => {
  const [currentWeight, setCurrentWeight] = useRecoilState(rodinInitWeightAtom)

  const handlerClickWeight = (index) => {
    setCurrentWeight(index)
  }
  return (
    // group-hover:rounded-[10px] group-hover:opacity-100 group-hover:translate-y-[-100%] group-hover:scale-100 absolute right-0 top-0 w-[94px] h-[148px] z-1000 origin-bottom-right rounded-[15px] flex flex-col opacity-0 transition duration-100 ease
    <div className={style.weightWrapper} ref={ref}>
      <div className='p-[12px] flex flex-col rounded-[10px] w-full h-full bg-[#ffffff26] backdrop-blur-[6px] shadow-[0_6px_15px_0px_rgba(142,142,142,0.19)] gap-2'>
        <span className='text-left font-bold text-sm'>Weight</span>
        <DecreasingWidthBoxes handlerClickWeight={handlerClickWeight} currentWeight={currentWeight} />
        <AverageWidthBoxes handlerClickWeight={handlerClickWeight} currentWeight={currentWeight} />
        <PrimaryWidthBoxes handlerClickWeight={handlerClickWeight} currentWeight={currentWeight} />
      </div>
      <div className='w-full h-[110px]'></div>
    </div>
  )
});


export const WeightMode = React.forwardRef(({ handlerClickWeight }, ref) => {
  const { t } = useTranslation();
  const list = [t('BUTTON_MULTIVIEW'), t('BUTTON_FUSION')]

  return (
    <div className={style.weightWrapper} ref={ref}>
      <div className='p-[12px] flex flex-col rounded-[10px] w-full h-full bg-[#ffffff26] backdrop-blur-[6px] shadow-[0_6px_15px_0px_rgba(142,142,142,0.19)] gap-2'>
        <span className='text-left font-bold text-sm'>Mode</span>
        {list.map((item, idx) => {
          return (
            <div
              key={idx}
              className={`${style.decreasingItem}`}
              onClick={handlerClickWeight.bind(null, idx)}>
              {item}
            </div>
          )
        })}
      </div>
      <div className='w-full h-[110px]'></div>
    </div>
  )
})

Weight.displayName = 'Weight';
WeightMode.displayName = 'WeightMode';