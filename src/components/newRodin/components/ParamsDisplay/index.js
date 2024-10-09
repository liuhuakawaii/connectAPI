import React, { useMemo, useImperativeHandle, useState } from 'react';
import ReactJson from 'react-json-view';
import { pos2Base64 } from '../../../../utils/format';

const ParamsDisplay = React.forwardRef(({ meshValues, activeIndex }, ref) => {
  const [copied, setCopied] = useState(false);

  const params = useMemo(() => {
    let newParams = {};

    if (activeIndex === 0) {
      newParams = {
        bbox_condition: meshValues[0].params
      };
    } else if (activeIndex === 1) {
      let voxel_condition = pos2Base64(meshValues[1].params);
      newParams = {
        voxel_condition: voxel_condition,
        voxel_condition_cfg: meshValues[1].voxel_condition_cfg,
        voxel_condition_weight: +meshValues[1].voxel_condition_weight
      };
    } else if (activeIndex === 2) {
      newParams = {
        pcd_condition: meshValues[2].params,
        pcd_condition_uncertainty: +meshValues[2].pcd_condition_uncertainty
      };
    }

    return newParams;
  }, [activeIndex, meshValues]);

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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#a6e22e' }}>&quot;voxel_condition&quot;:</span>
          <div style={{
            marginLeft: '8px',
            marginTop: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 16px)',
            color: '#e6db74'
          }}>
            &quot;{props.value}&quot;
          </div>
        </div>
      );
    }
    return undefined;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 relative overflow-hidden">
      <div className="overflow-auto max-h-[500px]">
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
          collapseStringsAfterLength={50}
          shouldCollapse={(field) => {
            // Collapse arrays and objects with more than 5 items
            return (Array.isArray(field.src) && field.src.length > 5) ||
              (typeof field.src === 'object' && field.src !== null && Object.keys(field.src).length > 5);
          }}
          valueRenderer={valueRenderer}
        />
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
});

ParamsDisplay.displayName = "ParamsDisplay";
export default ParamsDisplay;