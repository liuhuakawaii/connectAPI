import React, { Suspense, lazy } from 'react';

const LazyImage = ({ src }) => {
    const ImageComponent = lazy(src);
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ImageComponent />
        </Suspense>
    );
};

export default LazyImage;