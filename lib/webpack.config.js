module.exports = {
    entry: './src/visual.ts',
    devtool: 'source-map',
    mode: "development",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js','.css']
    },
    output: {
        path: null,
        publicPath: 'assets',
        filename: "visual.js",
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
