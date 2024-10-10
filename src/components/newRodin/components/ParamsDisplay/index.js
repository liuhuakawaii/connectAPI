import React, { useMemo, useImperativeHandle, useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import { pos2Base64 } from '../../../../utils/format';
import './index.css'

const ParamsDisplay = React.forwardRef(({
  meshValues,
  activeIndex,
  voxelScale,
  voxelMode,
  pcdUncertainty,
  boundingBoxRef,
  updateFlag
}, ref) => {
  const [copied, setCopied] = useState(false);
  const [params, setParams] = useState({});

  useEffect(() => {
    console.log('--------参数更新---------', activeIndex);
    let newParams = {};
    if (activeIndex === 0) {
      newParams = {
        bbox_condition: [...Object.values(meshValues[0].pos), 1]
      };
    } else if (activeIndex === 1) {
      newParams = {
        voxel_condition: '',
        voxel_condition_cfg: voxelMode,
        voxel_condition_weight: +voxelScale
      };
      if (boundingBoxRef?.current?.threeController?.current) {
        const threeController = boundingBoxRef.current.threeController.current

        const voxelCache = threeController.voxelsCache[threeController.newVoxelIndex];
        if (voxelCache.params) {
          newParams.voxel_condition = pos2Base64(voxelCache.params)
        }
      }

    } else if (activeIndex === 2) {
      newParams = {
        pcd_condition: [],
        pcd_condition_uncertainty: +pcdUncertainty
      };
      if (boundingBoxRef?.current?.threeController?.current) {
        const threeController = boundingBoxRef.current.threeController.current
        const pointsCache = threeController.pointsCache[threeController.newPointsIndex];
        newParams.pcd_condition = pointsCache.params
      }
    }

    setParams(newParams);
  }, [meshValues, voxelScale, voxelMode, pcdUncertainty, boundingBoxRef, updateFlag]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(params, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useImperativeHandle(ref, () => ({
    handleCopy: handleCopy
  }));

  const valueRenderer = (props) => {
    if (props.name === 'voxel_condition' && typeof props.value === 'string') {
      return (
        <div className="value-container">
          <span className="key-name">&quot;voxel_condition&quot;:</span>
          <div className="long-value">
            &quot;{props.value}&quot;
          </div>
        </div>
      );
    }
    return undefined;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 relative overflow-hidden">
      <div className="overflow-auto max-h-[570px] w-[316px]">
        <ReactJson
          src={params}
          theme="monokai"
          displayDataTypes={false}
          enableClipboard={false}
          collapsed={1}
          style={{
            backgroundColor: '#272822',
            borderRadius: '5px',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          name={null}
          quotesOnKeys={false}
          displayObjectSize={false}
          indentWidth={2}
          collapseStringsAfterLength={30}
          shouldCollapse={(field) => {
            return (Array.isArray(field.src) && field.src.length > 5) ||
              (typeof field.src === 'object' && field.src !== null && Object.keys(field.src).length > 5);
          }}
          valueRenderer={valueRenderer}
        />
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-[#8571FF] text-white px-2 py-1 rounded text-sm"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
});

ParamsDisplay.displayName = "ParamsDisplay";
export default ParamsDisplay;