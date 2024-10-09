import { useRef } from 'react';
import style from './betterscroll.module.css'
import { useEffect } from 'react';

import BScroll from '@better-scroll/core'
import React from 'react';
import { useImperativeHandle } from 'react';

const BetterScroll = React.forwardRef(({ children, type, wrapperStyle, contentStyle }, ref) => {
  const bsScrollInstance = useRef(null)
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  const linear = {
    style: 'linear',
    fn: function (t) {
      return 1 + t
    }
  }

  const scrollTo = (x, y, time) => {
    bsScrollInstance.current.scrollTo(x, y, time, linear)
  }

  const refresh = () => {
    bsScrollInstance.current.refresh()
  }

  // 在子组件中暴露多个 ref
  useImperativeHandle(ref, () => ({
    wrapperRef: wrapperRef,
    contentRef: contentRef,
    bsScrollInstance: bsScrollInstance,
    scrollTo: scrollTo,
    refresh: refresh
  }), [wrapperRef, contentRef]);

  const options = {
    'x': {
      scrollX: true,
      click: true,
      bounce: false,
      probeType: 3,
    },
    'y': {
      scrollY: true,
      click: true,
      bounce: false,
      probeType: 3
    }
  }

  useEffect(() => {
    if (wrapperRef.current) {
      bsScrollInstance.current = new BScroll(wrapperRef.current, options[type])
      return () => {
        if (bsScrollInstance) {
          bsScrollInstance.current.destroy();
          bsScrollInstance.current = null;
        }
      };
    }
  }, [wrapperRef.current])

  return (
    <div
      ref={wrapperRef}
      style={{ ...wrapperStyle }}
      className={`${type === 'x' ? style.xscrollWrapper : style.yscrollWrapper}`}>
      <div
        ref={contentRef}
        style={{ ...contentStyle }}
        className={`${type === 'x' ? style.xscrollContent : style.yscrollContent}`}>
        {children}
      </div>
    </div>
  )
})

BetterScroll.displayName = 'BetterScroll'
export { BetterScroll }