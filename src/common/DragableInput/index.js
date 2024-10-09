import { useState, useRef, useEffect } from 'react';

const DraggableInput = ({ value, onChange, min, max, decimalPlaces = 0, onUpdated, onDragging, onStop }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputFocusedByClick, setInputFocusedByClick] = useState(false);
  const [inputValue, setInputValue] = useState(formatValue(value));
  const isComposingRef = useRef(false);
  const isChangedRef = useRef(false);
  const realValue = useRef(value);
  const currentInputValueRef = useRef('');

  useEffect(() => {
    setInputValue(formatValue(value));
  }, [value, decimalPlaces]);

  function formatValue(val) {
    const numberValue = parseFloat(val);
    if (isNaN(numberValue)) return '';
    const formattedValue = numberValue.toFixed(decimalPlaces);
    return formattedValue;
  }


  const handleInput = (e) => {
    if (isComposingRef.current) return;
    const returnFlag = onStop?.()
    if (returnFlag) return;

    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === '') {
      // Don't call onChange when the input is empty
      return;
    }

    if (validateAndTransform(newValue)) {
      if (currentInputValueRef.current !== newValue) {
        onUpdated?.(newValue);
        currentInputValueRef.current = newValue;
      }
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (event) => {
    isComposingRef.current = false;
    const newValue = event.target.value;
    validateAndTransform(newValue);
  };

  const validateAndTransform = (newValue) => {
    if (newValue === '' || newValue === '-') return true;

    // 检查输入是否为有效的数字
    const validNumber = /^-?\d*\.?\d*$/.test(newValue);
    if (!validNumber) return false;

    // 将字符串转换为数字
    let numberValue = parseFloat(newValue);

    // 检查数字是否在有效范围内
    if (numberValue < min || numberValue > max) {
      numberValue = Math.max(min, Math.min(max, numberValue));
    }

    // 格式化数字
    const formattedValue = formatValue(numberValue);

    // 检查是否为整数且在 [-180, 180] 范围内
    if (Number.isInteger(numberValue) && numberValue >= min && numberValue <= max) {
      onChange(numberValue);
      realValue.current = formattedValue;
      return true;
    }

    // 如果不符合条件，则返回 false
    return false;
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue === '' || isNaN(parseFloat(inputValue))) {
      setInputValue('0');
      onChange(0);
      onUpdated?.('0');
    }
  };


  const handleMouseDown = (e) => {
    if (isFocused) return;
    const returnFlag = onStop?.()
    if (returnFlag) return
    e.preventDefault();
    onDragging?.(true);
    const startX = e.clientX;
    const startValue = value;

    let isSticky = false;
    let stickyValue = null;
    const stickyThreshold = 100;

    const handleMouseMove = (e) => {
      isChangedRef.current = true;
      const endX = e.clientX;
      const diff = endX - startX;
      let newValue = startValue + diff / 5;
      newValue = Math.max(min, Math.min(max, newValue));
      let formattedValue = parseFloat(formatValue(newValue));

      // 检查是否在吸附范围内
      if ((formattedValue >= 85 && formattedValue <= 95)
        || (formattedValue >= -95 && formattedValue <= -85)
        || (formattedValue >= -5 && formattedValue <= 5)) {
        if (!isSticky) {
          isSticky = true;
          if (formattedValue >= 85) {
            stickyValue = 90
          } else if (formattedValue >= -5) {
            stickyValue = 0
          } else {
            stickyValue = -90
          }
        }

        // 如果在吸附状态，检查是否应该脱离吸附
        if (isSticky) {
          const stickyDiff = Math.abs(formattedValue - stickyValue);
          if (stickyDiff > stickyThreshold) {
            isSticky = false;
            stickyValue = null;
          } else {
            formattedValue = stickyValue;
          }
        }
      } else {
        isSticky = false;
        stickyValue = null;
      }

      onChange(formattedValue);
      realValue.current = formattedValue;
    };

    const handleMouseUp = () => {
      if (isChangedRef.current) {
        onUpdated?.(realValue.current);
      }
      setTimeout(() => {
        isChangedRef.current = false;
        onDragging?.(false);
      }, 100);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleInputMouseDown = (e) => {
    if (isFocused) return;
    e.preventDefault();
    setInputFocusedByClick(true);
  };

  const handleInputClick = (e) => {
    if (inputFocusedByClick) {
      e.target.focus();
      setInputFocusedByClick(false);
    }
  };

  return (
    <div className="w-[35px] h-20px rounded-md bg-[rgba(255,255,255,0.1)]" onMouseDown={handleMouseDown}>
      <input
        className="w-full h-full text-center text-[white] text-[12px] bg-transparent"
        type="text"
        value={inputValue}
        onChange={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onMouseDown={handleInputMouseDown}
        onClick={handleInputClick}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
    </div>
  );
};

export default DraggableInput;