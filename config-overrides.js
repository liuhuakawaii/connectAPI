const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const autoprefixer = require('autoprefixer');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

module.exports = function override(config) {
    const isProduction = process.env.NODE_ENV === 'production';

    // 确保 optimization 对象存在
    config.optimization = config.optimization || {};

    // Use MiniCssExtractPlugin replace style-loader
    const cssLoaders = config.module.rules.find(rule => Array.isArray(rule.oneOf)).oneOf;
    cssLoaders.forEach(loader => {
        if (loader.test && loader.test.toString().includes('css')) {
            loader.use[0] = MiniCssExtractPlugin.loader;

            // Add postcss-loader with autoprefixer
            loader.use.push({
                loader: 'postcss-loader',
                options: {
                    postcssOptions: {
                        plugins: [
                            autoprefixer({
                                overrideBrowserslist: ['>1%', 'last 4 versions', 'Firefox ESR', 'not dead'],
                            }),
                        ],
                    },
                },
            });
        }
    });

    // Add MiniCssExtractPlugin
    config.plugins.push(new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        ignoreOrder: true,
    }));

    // Add BundleAnalyzerPlugin for development
    // config.plugins.push(new BundleAnalyzerPlugin({
    //     analyzerMode: 'static',
    //     reportFilename: 'bundle-report.html',
    //     openAnalyzer: false,
    // }));

    if (isProduction) {
        // Production-specific optimizations
        config.mode = 'production';

        // Disable source map generation in production
        config.devtool = false;

        // Terser Plugin
        config.optimization.minimizer = config.optimization.minimizer || [];
        config.optimization.minimizer.push(
            new TerserPlugin({
                extractComments: true,
                parallel: true,
                terserOptions: {
                    extractComments: 'all',
                    compress: {
                        drop_console: true,
                        pure_funcs: ['console.log']
                    },
                    format: {
                        comments: false,
                    },
                },
            })
        );

        // WorkboxWebpackPlugin
        config.plugins.push(new WorkboxWebpackPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
        }));

        // SplitChunks
        config.optimization.splitChunks = {
            chunks: 'all'
        };

        // Add CompressionPlugin for gzip
        config.plugins.push(new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
        }));
    } else {
        config.mode = 'development';
    }

    // Setting up alias
    config.resolve = config.resolve || {};
    config.resolve.alias = {
        ...config.resolve.alias,
        '@public': path.resolve(__dirname, 'public'),
        '@': path.resolve(__dirname, 'src')
    };

    // Add ProgressBarPlugin
    config.plugins.push(new webpack.ProgressPlugin({
        handler: (percentage, message, ...args) => {
            console.info(`${(percentage * 100).toFixed(2)}%`, message, ...args);
        },
    }));

    return config;
};