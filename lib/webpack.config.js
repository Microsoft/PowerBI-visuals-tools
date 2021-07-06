const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const config = require("../config.json");

module.exports = {
    entry: {
        'visual.js': ['./src/visual.ts']
    },
    target: 'web',
    devtool: 'source-map',
    mode: "production",
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {}
            })
        ],
        minimize: false,
        concatenateModules: false
    },
    performance: {
        maxEntrypointSize: 1024000,
        maxAssetSize: 1024000,
        hints: false
    },
    module: {
        rules: [
            {
                parser: {
                    amd: false
                }
            },
            {
                test: /\.json$/,
                loader: require.resolve('json-loader'),
                type: "javascript/auto"
            },
            {
                test: /(\.less)|(\.css)$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: require.resolve('css-loader')
                    },
                    {
                        loader: require.resolve('less-loader'),
                        options: {
                            paths: [path.resolve(__dirname, "..", 'node_modules')]
                        }
                    }
                ]
            },
            {
                test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp|gif|svg|eot)$/i,
                use: [
                    {
                        loader: require.resolve('base64-inline-loader')
                    }
                ]
            }
        ]
    },
    externals: {
        "powerbi-visuals-api": 'null',
        "fakeDefine": 'false',
        "corePowerbiObject": "Function('return this.powerbi')()",
        "realWindow": "Function('return this')()"
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.css'],
        fallback: {
            assert: require.resolve("assert/"),
            buffer: require.resolve("buffer/"),
            console: require.resolve("console-browserify/"),
            constants: require.resolve("constants-browserify/"),
            crypto: require.resolve("crypto-browserify/"),
            domain: require.resolve("domain-browser/"),
            events: require.resolve("events/"),
            http: require.resolve("stream-http/"),
            https: require.resolve("https-browserify/"),
            os: require.resolve("os-browserify/"),
            path: require.resolve("path-browserify/"),
            punycode: require.resolve("punycode/"),
            process: require.resolve("process/"),
            querystring: require.resolve("querystring-es3/"),
            stream: require.resolve("stream-browserify/"),
            /* eslint-disable camelcase */
            _stream_duplex: require.resolve("readable-stream/"),
            _stream_passthrough: require.resolve("readable-stream/"),
            _stream_readable: require.resolve("readable-stream/"),
            _stream_transform: require.resolve("readable-stream/"),
            _stream_writable: require.resolve("readable-stream/"),
            string_decoder: require.resolve("string_decoder/"),
            /* eslint-enable camelcase */
            sys: require.resolve("util/"),
            timers: require.resolve("timers-browserify/"),
            tty: require.resolve("tty-browserify/"),
            url: require.resolve("url/"),
            util: require.resolve("util/"),
            vm: require.resolve("vm-browserify/"),
            zlib: require.resolve("browserify-zlib/")
        }
    },
    output: {
        path: null,
        publicPath: 'assets',
        filename: "[name]"
    },
    devServer: {
        disableHostCheck: true,
        contentBase: null,
        compress: true,
        port: 8080,
        hot: false,
        inline: false,
        https: true,
        headers: {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=0"
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            d3: 'd3',
            Buffer: ["buffer", "Buffer"],
            process: "process/browser"
        }),
        new MiniCssExtractPlugin({
            filename: config.build.css,
            chunkFilename: "[id].css"
        })
    ]
};

