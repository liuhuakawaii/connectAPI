import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import style from './scrollloader.module.css'

const ScrollLoader = React.forwardRef(({ children, loadMore, allLoaded, parent }, ref) => {
  const sentinelRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observer = useRef(null)


  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Either server-side rendering or browser does not support IntersectionObserver
      console.error("IntersectionObserver is not supported in this browser.");
      return;
    }

    const option = {
      rootMargin: '0px',
      threshold: 0,
    }
    if (parent) {
      option.root = parent
    }

    const cb = ([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }

    observer.current = new IntersectionObserver(cb, option);

    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isIntersecting && !allLoaded) {
      console.log('----loading----');
      loadMore()
    }
  }, [isIntersecting, allLoaded]);

  useImperativeHandle(ref, () => ({
    checkVisibilityAndLoadMore: checkVisibilityAndLoadMore
  }));

  const checkVisibilityAndLoadMore = () => {
    if (sentinelRef.current) {
      const sentinelRect = sentinelRef.current.getBoundingClientRect();
      console.log(sentinelRect, window.innerHeight, '----window.innerHeight');
      const isVisible = sentinelRect.top < window.innerHeight && sentinelRect.bottom >= 0;
      if (isVisible && !allLoaded) {
        loadMore()
      }
    }
  };



  return (
    <>
      {children}
      <div className={style.scanner} ref={sentinelRef}>
        {allLoaded ? <div>That&apos;s all</div> : <span> Loading...</span>}
      </div>
    </>
  );
})

ScrollLoader.displayName = 'ScrollLoader'
export default ScrollLoader;
