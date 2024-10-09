import { useEffect, useState } from 'react';
import style from './imageOverlay.module.css';

const ImageOverlay = ({ style: customStyle, src, alt, type = "DreamFace", alwaysHidden = false ,imgBorderRadius = "8px" }) => {
    const [loading, setLoading] = useState(true);

    const handleImageLoad = () => {
        setLoading(false);
    };

    useEffect(() => {
        if (src) {
            setLoading(true);
        }
    }, [src]);

    return (
        <div style={customStyle || {
            position: 'relative',
            width: '100%',
            height: '100%',
        }}
        >
            {loading && (
                <div className={style.overlayBox}>
                    <div className={`${style.skeleton} ${type === 'ImagineFace' ? style.ImagineFace : style.DreamFace}`} style={{
                        borderRadius: imgBorderRadius
                    }} />
                </div>
            )}

            {src && <img
                src={src}
                alt={alt}
                style={{
                    display: alwaysHidden ? "none" : loading ? 'none' : 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: imgBorderRadius,
                }}
                onLoad={handleImageLoad}
            />}
        </div>
    );
}

export { ImageOverlay };
