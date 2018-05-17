const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const SystemBellPlugin = require('system-bell-webpack-plugin');
const NyanProgressPlugin = require('nyan-progress-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const PACKAGE = require('./package.json');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const sourcePath = path.join(__dirname, './src');
const staticsPath = path.join(__dirname, './build');

module.exports = function(env) {
    const nodeEnv = env && env.prod ? 'production' : 'development';
    const isProd = nodeEnv === 'production';

    const plugins = [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity,
            filename: isProd ? '[name].bundle.[hash:6].js' : '[name].bundle.js'
        }),
        new webpack.EnvironmentPlugin({
            NODE_ENV: nodeEnv
        }),
        new webpack.NamedModulesPlugin()
    ];

    if (isProd) {
        plugins.push(
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    screw_ie8: true,
                    conditionals: true,
                    unused: true,
                    comparisons: true,
                    sequences: true,
                    dead_code: true,
                    evaluate: true,
                    if_return: true,
                    join_vars: true
                },
                output: {
                    comments: false
                }
            }),
            new CopyWebpackPlugin([
                {from:'./template/_redirects'}
            ]),
            new CompressionPlugin({
                asset: '[path].gz[query]',
                algorithm: 'gzip',
                test: /\.js$|\.css$|\.html$/,
                threshold: 0,
                minRatio: 0.9,
                deleteOriginalAssets: false
            }),
            new HtmlWebpackPlugin({
                inject: false,
                template: './template/index.ejs',
                appMountId: 'app',
                title: 'Johnny Bell Portfolio - Frontend Engineer',
                mobile: true,
                hash: false,
                favicon: './app/assets/images/favicon.ico',
                minify: {
                    collapseWhitespace: true,
                    preserveLineBreaks: false
                },
                output: {
                    path: 'build'
                }
            }),
            new webpack.BannerPlugin({
                banner:
                `Version: ` +
                PACKAGE.version +
                ` Date: ` +
                parseInt(new Date().getMonth() + 1) +
                `/` +
                new Date().getDate() +
                `/` +
                new Date().getFullYear() +
                ` @ ` +
                new Date().getHours() +
                `:` +
                new Date().getMinutes()
            }),
            new ExtractTextPlugin(isProd ? 'styles.[hash:6].css' : 'styles.[chunkhash:6].css')
        );
    } else {
        plugins.push(
            new webpack.HotModuleReplacementPlugin(),
            new BrowserSyncPlugin(
                // BrowserSync options
                {
                    host: 'localhost',
                    port: 2837,
                    open: false,
                    // proxy the Webpack Dev Server endpoint
                    // (which should be serving on http://localhost:8080/)
                    // through BrowserSync
                    proxy: 'http://localhost:2837/',
                    logPrefix: 'JB'
                },
                // plugin options
                {
                    reload: true
                }
            ),
            new SystemBellPlugin(),
            new NyanProgressPlugin()
        );
    }

    return {
        devtool: isProd ? 'hidden-source-map' : 'eval',
        context: sourcePath,
        entry: {
            js: 'app.jsx',
            vendor: ['react']
        },
        output: {
            path: staticsPath,
            filename: isProd ? '[name].bundle.[hash:6].js' : '[name].bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.(ttf|eot|woff|woff2)$/,
                    loader: 'url-loader'
                },

                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'html-loader'
                    }
                },

                {
                    test: /\.(js|jsx)$/,
                    enforce: 'pre',
                    loader: 'eslint-loader',
                    options: {
                        fix: false
                    }
                },

                {
                    test: /\.(scss|css)$/,
                    use: isProd // If Prod
                        ? ExtractTextPlugin.extract({
                            fallback: 'style-loader',
                            use: ['css-loader', 'sass-loader']
                        })
                        : // Else

                        [
                            {
                                loader: 'style-loader',
                                options: {
                                    sourceMap: false
                                }
                            },
                            {
                                loader: 'css-loader',
                                options: {
                                    sourceMap: true
                                }
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: true
                                }
                            }
                        ]
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader'
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|mp4)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                query: {
                                    name: 'app/assets/images/[name].[ext]'
                                }
                            }
                        },
                        {
                            loader: 'image-webpack-loader',
                            options: {
                                query: {
                                    mozjpeg: {
                                        progressive: true
                                    },
                                    gifsicle: {
                                        interlaced: true
                                    },
                                    optipng: {
                                        optimizationLevel: 7
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.svg$/,
                    loader: 'raw-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
            modules: [path.resolve(__dirname, 'node_modules'), sourcePath]
        },

        plugins,

        performance: isProd && {
            maxAssetSize: 600000,
            maxEntrypointSize: 600000,
            hints: 'warning'
        },

        stats: {
            colors: {
                green: '\u001b[32m'
            }
        },

        devServer: {
            contentBase: './src',
            historyApiFallback: true,
            port: 2837,
            compress: isProd,
            inline: !isProd,
            hot: false,
            quiet: true,
            overlay: {
                errors: true,
                warnings: true
            },
            stats: {
                assets: true,
                children: false,
                chunks: false,
                hash: false,
                modules: false,
                publicPath: false,
                timings: true,
                version: false,
                warnings: true,
                colors: {
                    green: '\u001b[32m'
                }
            }
        }
    };
};
