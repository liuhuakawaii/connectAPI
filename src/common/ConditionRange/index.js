import { useEffect, useRef, useState } from "react";


const ConditionRange = ({ value, setValue, maxRange, minRange = 0, rangeDragging, setRangeDragging, fiexed = 3, openRange, styletype = "homepage", onUpdated, onStop, useSticky = false }) => {
  const [position, setPosition] = useState(0);
  const rangeRef = useRef(null);
  const thumbRef = useRef(null);
  const isChanged = useRef(false);
  const stickyPoints = [
    {
      value: 90,
      range: 5
    }, {
      value: -90,
      range: 5
    }, {
      value: 0,
      range: 5
    }]

  const realValue = useRef(value);
  // const startSticky = useRef(null);
  useEffect(() => {
    if (openRange && !rangeDragging) {
      const totalWidth = rangeRef.current.clientWidth - thumbRef.current.clientWidth;
      setPosition(((value - minRange) / (maxRange - minRange)) * totalWidth);
    }
  }, [value, maxRange, minRange, openRange]);

  const handleMove = (e, startX, totalWidth, selfXPosition, thumbW, initialValue, state) => {
    isChanged.current = true;
    const moveX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let rawDiffX = selfXPosition + moveX - startX;
    rawDiffX = Math.max(0, Math.min(rawDiffX, totalWidth));

    let value = ((rawDiffX / totalWidth) * (maxRange - minRange) + minRange).toFixed(fiexed);
    let formattedValue = parseFloat(value);

    const stickyStrength = 8; // 吸附强度，单位为像素

    let { isSticky, stickyValue, lastNonStickyPosition } = state;
    if (useSticky) {
      if (!isSticky) {
        for (const point of stickyPoints) {
          if (formattedValue >= point.value - point.range &&
            formattedValue <= point.value + point.range &&
            (initialValue < point.value - point.range ||
              initialValue > point.value + point.range)) {
            isSticky = true;
            stickyValue = point.value;
            lastNonStickyPosition = rawDiffX;
            break;
          }
        }
      }

      if (isSticky) {
        const stickyPosition = ((stickyValue - minRange) / (maxRange - minRange)) * totalWidth;
        const distanceFromSticky = Math.abs(rawDiffX - lastNonStickyPosition);

        if (distanceFromSticky <= stickyStrength) {
          formattedValue = stickyValue;
          rawDiffX = stickyPosition;
        } else {
          isSticky = false;
          stickyValue = null;
          const direction = rawDiffX > lastNonStickyPosition ? 1 : -1;
          rawDiffX = lastNonStickyPosition + direction * (distanceFromSticky - stickyStrength);
          formattedValue = ((rawDiffX / totalWidth) * (maxRange - minRange) + minRange).toFixed(fiexed);
          formattedValue = parseFloat(formattedValue);
        }
      } else {
        lastNonStickyPosition = rawDiffX;
      }
    }

    rawDiffX = Math.max(0, Math.min(rawDiffX, totalWidth));
    setPosition(rawDiffX - thumbW / 2);
    realValue.current = formattedValue.toFixed(fiexed)
    setValue(formattedValue.toFixed(fiexed));

    return { isSticky, stickyValue, lastNonStickyPosition };
  };

  const handleStart = (e) => {
    e.preventDefault();
    const returnFlag = onStop?.()
    if (returnFlag) return
    isChanged.current = false;
    setRangeDragging(true);
    const totalWidth = rangeRef.current.clientWidth - thumbRef.current.clientWidth;
    const startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const selfXPosition = thumbRef.current.offsetLeft;

    let state = {
      isSticky: false,
      stickyValue: null,
      lastNonStickyPosition: selfXPosition
    };
    const initialValue = parseFloat(value);

    const moveHandler = (event) => {
      state = handleMove(event, startX, totalWidth, selfXPosition, thumbRef.current.clientWidth, initialValue, state);
    };

    const endHandler = () => {
      if (isChanged.current) {
        onUpdated?.(realValue.current);
      }
      setTimeout(() => {
        isChanged.current = false;
        setRangeDragging(false);
      }, 100);
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
      document.removeEventListener('touchcancel', endHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', endHandler);
    document.addEventListener('touchcancel', endHandler);

  };


  const handleClickStart = (e) => {
    const returnFlag = onStop?.()
    if (returnFlag) return
    setRangeDragging(true);
    const rangedom = rangeRef.current;
    const knobdom = thumbRef.current;
    const totalWidth = rangedom.clientWidth - knobdom.clientWidth;
    const left = rangedom.getBoundingClientRect().left;
    let startX = e.clientX;
    let initialDiffX = startX - left;
    initialDiffX = Math.max(0, Math.min(initialDiffX, totalWidth));
    let state = {
      isSticky: false,
      stickyValue: null,
      lastNonStickyPosition: initialDiffX
    };

    const updateSlider = (rawDiffX) => {
      // 确保 rawDiffX 在有效范围内
      rawDiffX = Math.max(0, Math.min(rawDiffX, totalWidth));
      const stickyStrength = 10; // 吸附强度，单位为像素

      let formattedValue = ((rawDiffX / totalWidth) * (maxRange - minRange) + minRange).toFixed(fiexed);
      formattedValue = parseFloat(formattedValue);

      if (useSticky) {
        if (!state.isSticky) {
          for (const point of stickyPoints) {
            if (formattedValue >= point.value - point.range &&
              formattedValue <= point.value + point.range) {
              state.isSticky = true;
              state.stickyValue = point.value;
              state.lastNonStickyPosition = rawDiffX;
              break;
            }
          }
        }

        if (state.isSticky) {
          const stickyPosition = ((state.stickyValue - minRange) / (maxRange - minRange)) * totalWidth;
          const distanceFromSticky = Math.abs(rawDiffX - state.lastNonStickyPosition);

          if (distanceFromSticky <= stickyStrength) {
            formattedValue = state.stickyValue;
            rawDiffX = stickyPosition;
          } else {
            state.isSticky = false;
            state.stickyValue = null;
            const direction = rawDiffX > state.lastNonStickyPosition ? 1 : -1;
            rawDiffX = state.lastNonStickyPosition + direction * (distanceFromSticky - stickyStrength);
            // 再次确保 rawDiffX 在有效范围内
            rawDiffX = Math.max(0, Math.min(rawDiffX, totalWidth));
            formattedValue = ((rawDiffX / totalWidth) * (maxRange - minRange) + minRange).toFixed(fiexed);
            formattedValue = parseFloat(formattedValue);
          }
        } else {
          state.lastNonStickyPosition = rawDiffX;
        }
      }

      setPosition(rawDiffX - knobdom.clientWidth / 2);
      realValue.current = formattedValue.toFixed(fiexed)
      setValue(formattedValue.toFixed(fiexed));
    };

    updateSlider(initialDiffX);

    document.onmousemove = (e) => {
      e.stopPropagation();
      const endX = e.clientX;
      let rawDiffX = initialDiffX + endX - startX;
      updateSlider(rawDiffX);
    };

    document.onmouseup = function () {
      e.stopPropagation();
      onUpdated?.(realValue.current);
      setTimeout(() => {
        setRangeDragging(false);
      }, 100);
      document.onmousemove = null;
      document.onmouseup = null;
    };
  }

  const styles = {
    "homepage": {
      rangebg: "bg-[rgba(238,238,238,0.6)]",
      thumbbg: "bg-[rgba(255,255,255,0.8)]",
      lgcolor1: "rgb(40, 228, 240)",
      lgcolor2: "rgba(255, 255, 255, 0.8)"
    },
    "cardpage": {
      rangebg: "bg-[rgba(238,238,238,1)]",
      thumbbg: "bg-[#fff]",
      lgcolor1: "rgba(198,178,240,1)",
      lgcolor2: "#fff"
    }
  }


  return (
    <div
      className={`cursor-pointer w-full h-[11px] rounded-xl p-[3px] relative ${styles[styletype].rangebg}`}
      ref={rangeRef}>
      <div className="relative w-full h-full">
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className={`absolute-y-center rounded-full w-[12px] h-[12px] [box-shadow:0px_0px_4px_0px_rgba(74,0,224,0.4)] ${styles[styletype].thumbbg}`}
          ref={thumbRef}
          style={{ left: `${position}px` }} />
        <div
          onPointerDown={handleClickStart}
          className="bg-[rgba(255,255,255,0.8)] w-full h-full rounded-lg"
          style={{
            background: `${styletype === 'homepage'
              ? `linear-gradient(90deg, rgb(40, 228, 240) ${position}px, rgba(255, 255, 255, 0.8) ${position}px)`
              : `linear-gradient(90deg, rgba(198,178,240,1) ${position}px, #fff ${position}px)`}`
          }} />
      </div>
    </div>
  );
};

export default ConditionRange