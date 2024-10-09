import { useEffect, useState } from 'react';

const Svg = ({ src, ...props }) => {
  const [svgContent, setSvgContent] = useState(null);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const response = await fetch(src);
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error('Error fetching SVG:', error);
      }
    };

    fetchSvg();
  }, [src]);

  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default Svg;
