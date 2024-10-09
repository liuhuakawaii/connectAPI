import React from 'react';
import { Helmet } from 'react-helmet';

const SEOContent = ({ title, description, keywords, h1Text, image, alt, canonicalUrl }) => (
    <>
        <Helmet defer>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {image && <meta name="twitter:card" content="summary_large_image" />}

            <meta property="og:title" content={title} />
            <meta property="og:site_name" content="HyperHuman - Rodin & ChatAvatar" />
            <meta property="og:description"
                  content={description} />
            {image ? <meta property="og:image" content={image} /> : <meta property="og:image" content="https://hyperhuman.deemos.com/assets/og-banner.png" />}
            {alt && <meta property="og:image:alt" content={alt} />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        </Helmet>
        <h1 style={{ position: 'absolute', left: '-9999px' }}>{h1Text}</h1>
        {image && <img src={image} alt={alt || ''} style={{ display: 'none' }} />}
    </>
);

export default SEOContent;
