import React, { useEffect, useState, useMemo, useImperativeHandle } from 'react';
import { pos2Base64 } from '../../../../utils/format';

const JSONDisplay = ({ data, indent = 2 }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderValue = (value, path = '') => {
    if (Array.isArray(value)) {
      return (
        <span>
          [
          {expanded[path] ? (
            <span>
              {value.map((item, index) => (
                <div key={index} style={{ marginLeft: '20px' }}>
                  {renderValue(item, `${path}.${index}`)}
                  {index < value.length - 1 ? ',' : ''}
                </div>
              ))}
            </span>
          ) : (
            <span onClick={() => toggleExpand(path)} style={{ cursor: 'pointer', color: '#66d9ef' }}>
              ...
            </span>
          )}
          ]
        </span>
      );
    } else if (typeof value === 'object' && value !== null) {
      return (
        <span>
          {'{'}
          {expanded[path] ? (
            <span>
              {Object.entries(value).map(([key, val], index, arr) => (
                <div key={key} style={{ marginLeft: '20px' }}>
                  {`"${key}": `}{renderValue(val, `${path}.${key}`)}
                  {index < arr.length - 1 ? ',' : ''}
                </div>
              ))}
            </span>
          ) : (
            <span onClick={() => toggleExpand(path)} style={{ cursor: 'pointer', color: '#66d9ef' }}>
              ...
            </span>
          )}
          {'}'}
        </span>
      );
    } else if (typeof value === 'string') {
      return <span style={{ color: '#a6e22e' }}>{`"${value}"`}</span>;
    } else if (typeof value === 'number') {
      return <span style={{ color: '#ae81ff' }}>{value}</span>;
    } else if (typeof value === 'boolean') {
      return <span style={{ color: '#f92672' }}>{value.toString()}</span>;
    } else {
      return <span>{String(value)}</span>;
    }
  };

  return (
    <pre style={{
      backgroundColor: '#272822',
      color: '#f8f8f2',
      padding: '10px',
      borderRadius: '5px',
      overflow: 'auto'
    }}>
      {renderValue(data)}
    </pre>
  );
};

const ParamsDisplay = React.forwardRef(({ meshValues, activeIndex, copied, setCopied }, ref) => {

  // 使用 useMemo 来计算参数，只有当 meshValues 或 activeIndex 变化时才重新计算
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


  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 relative">
      <JSONDisplay data={params} />
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
})

ParamsDisplay.displayName = "ParamsDisplay"
export default ParamsDisplay;