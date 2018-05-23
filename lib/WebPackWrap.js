"use strict";

const webpack = require("webpack");
const ts = require('typescript');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.json');
const PowerBICustomVisualsWebpackPlugin = require('powerbi-visuals-webpack-plugin');
const ProvidePlugin = require("webpack").ProvidePlugin;
const ConsoleWriter = require('../lib/ConsoleWriter');
const TypescriptCompiler = require('../lib/TypescriptCompiler');
const LessCompiler = require('../lib/LessCompiler');
const util = require('util');
const encoding = "utf8";
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

class WebPackGenerator {

    static prepareFolders(visualPackage) {
        let tmpFolder = path.join(visualPackage.basePath, ".tmp");
        if (!fs.existsSync(tmpFolder)) {
            fs.mkdirSync(tmpFolder);
        }
        let precompileFolder = path.join(visualPackage.basePath, config.build.precompileFolder);
        if (!fs.existsSync(precompileFolder)) {
            fs.mkdirSync(precompileFolder);
        }
        let dropFolder = path.join(config.build.dropFolder);
        if (!fs.existsSync(dropFolder)) {
            fs.mkdirSync(dropFolder);
        }
    }

    static appendExportPowerBINameSpace(visualPackage, tsconfig) {
        return new Promise((resolve, reject) => {
            if (!visualPackage ||
                !visualPackage.config ||
                !visualPackage.config.externalJS ||
                !visualPackage.config.externalJS.length
            ) {
                // we should not use externalJS in modern style modules
                resolve();
                return;
            }
            let visualJsName = tsconfig.compilerOptions.out;
            let visualJSFileContent = "";
            let visualJSFilePath = visualPackage.buildPath(visualJsName);
            const pbivizJsonPath = visualPackage.buildPath('pbiviz.json');
            const pbiviz = require(pbivizJsonPath);
            
            visualJSFileContent += "\n" + fs.readFileSync(visualJSFilePath, { encoding: encoding });
            visualJSFileContent =  "\nvar powerbi = globalPowerbi;\n" + visualJSFileContent;
            visualJSFileContent += "\nmodule.exports = { powerbi };";
            fs.writeFileSync(
                visualJSFilePath,
                visualJSFileContent
            );
            resolve();
        });
    }

    static prepareWebPackConfig(visualPackage, options, tsconfig) {
        return new Promise((resolve, reject) => {
            const pbivizJsonPath = visualPackage.buildPath('pbiviz.json');
            const pbiviz = require(pbivizJsonPath);
            const capabliliesPath = pbiviz.capabilities;
            const capabliliesFile = require(path.join(process.cwd(), capabliliesPath));
            const webpackConfig = require('./webpack.config');
            const visualJsName = tsconfig.compilerOptions.out;
            const visualJsOutDir = tsconfig.compilerOptions.outDir;
            const visualJSFilePath = visualPackage.buildPath(visualJsName || visualJsOutDir);
            let externalJSFiles = [];
            let externalJSFilesContent = "";
            let externalJSFilesPath = path.join(visualPackage.basePath, config.build.precompileFolder, "externalJS.js");
            if (pbiviz.externalJS) {
                for (let file in pbiviz.externalJS) {
                    externalJSFilesContent += "\n" + fs.readFileSync("./" +  pbiviz.externalJS[file], { encoding: encoding });
                    externalJSFiles.push(path.join(visualPackage.basePath, pbiviz.externalJS[file]));
                }
            }
            fs.writeFileSync(externalJSFilesPath, externalJSFilesContent, { encoding: encoding });
            let configuration = visualPackage.config;

            configuration.devMode = (typeof options.devMode === "undefined") ? true : options.devMode;
            configuration.cssStyles = path.join(visualPackage.basePath, config.build.dropFolder, config.build.css);
            configuration.generatePbiviz = options.generatePbiviz;
            configuration.generateResources = options.generateResources;
            configuration.minifyJS = options.minifyJS;
            if (options.minifyJS) {
                webpackConfig.plugins.push(
                    new UglifyJsPlugin({
                        sourceMap: true,
                        cache: false
                    })
                );
            }
            webpackConfig.plugins.push(
                new PowerBICustomVisualsWebpackPlugin(configuration)
            );
            webpackConfig.output.path = path.join(visualPackage.basePath, config.build.dropFolder);
            webpackConfig.output.filename = "[name]";
            webpackConfig.devServer.contentBase = path.join(visualPackage.basePath, config.build.dropFolder);
            webpackConfig.devServer.https = {
                key: config.server.privateKey,
                cert: config.server.certificate,
                pfx: config.server.pfx,
                passphrase: config.server.passphrase
            };
            webpackConfig.module.rules.pop();
            webpackConfig.module.rules.push( 
                {
                    test: /\.tsx?$/,
                    loader: require.resolve('./VisualCodeLoader.js'),
                    exclude: /node_modules/
                }
            );

            let entryIndex = 0;
            if (visualJsName) {
                webpackConfig.entry = {
                    "visual.js": [visualJSFilePath],
                };
                resolve(webpackConfig);
            }
            if (visualJsOutDir) {
                if (tsconfig.files) {
                    webpackConfig.entry = {
                        "visual.js": tsconfig.files
                    };
                    resolve(webpackConfig);
                    return;
                }
            } else {
                resolve(webpackConfig);
            }
        });
    }

    static applyWebpackConfig(visualPackage, options) {
        options = options || {};
        let cwd = process.cwd();
        return new Promise(function (resolve, reject) {
            const tsconfigPath = visualPackage.buildPath('tsconfig.json');
            const tsconfig = require(tsconfigPath);

            const pbivizJsonPath = visualPackage.buildPath('pbiviz.json');
            const pbiviz = require(pbivizJsonPath);

            const capabliliesPath = pbiviz.capabilities;
            const capabliliesFile = require(path.join(process.cwd(), capabliliesPath));
            visualPackage.config.capabilities = capabliliesFile;

            WebPackGenerator.prepareFolders(visualPackage);
            
            // new style
            if (tsconfig.compilerOptions.outDir) {
                LessCompiler.build(visualPackage, options)
                .then(() => WebPackGenerator.prepareWebPackConfig(visualPackage, options, tsconfig))
                .then(
                    (webpackConfig) => resolve(webpackConfig)
                );
                // old style
            } else {
                TypescriptCompiler
                .runWatcher(tsconfig.files, tsconfig.compilerOptions, !options.devMode)
                .then(() => LessCompiler.build(visualPackage, options))
                .then(() => WebPackGenerator.appendExportPowerBINameSpace(visualPackage, tsconfig))
                .then(() => WebPackGenerator.prepareWebPackConfig(visualPackage, options, tsconfig))
                .then(
                    (webpackConfig) => resolve(webpackConfig)
                );
            }
        });
    }
}

module.exports = WebPackGenerator;
