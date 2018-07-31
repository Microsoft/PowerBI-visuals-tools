module.exports = {
    entry: './src/visual.ts',
    devtool: 'source-map',
    mode: "development",
    module: {
        rules: [
            { parser: { amd: false } },
            {
                test: /\.tsx?$/,
                use: require.resolve('ts-loader'),
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: require.resolve('json-loader')
            }
        ]
    },
    externals: {
        "powerbi-visuals-api": 'null'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js','.css']
    },
    output: {
        path: null,
        publicPath: 'assets',
        filename: "[name]",
        libraryTarget: 'var',
        library: 'CustomVisual'
    },
    devServer: {
        disableHostCheck: true,
        contentBase: null,
        compress: true,
        port: 8080,
        hot: false,
        inline: false,
        https: {},
        headers: {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=0"
        }
    },
    plugins: [
    ]
};
