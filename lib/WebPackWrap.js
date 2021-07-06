"use strict";

const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const config = require('../config.json');
const PowerBICustomVisualsWebpackPlugin = require('powerbi-visuals-webpack-plugin');
const TypescriptCompiler = require('../lib/TypescriptCompiler');
const LessCompiler = require('../lib/LessCompiler');
const encoding = "utf8";
const ConsoleWriter = require('../lib/ConsoleWriter');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const CertificateTools = require("../lib/CertificateTools");
const visualPlugin = "visualPlugin.ts";
const lodashCloneDeep = require('lodash.clonedeep');

class WebPackGenerator {

    static async prepareFoldersAndFiles(visualPackage) {
        let tmpFolder = path.join(visualPackage.basePath, ".tmp");
        let precompileFolder = path.join(visualPackage.basePath, config.build.precompileFolder);
        let dropFolder = path.join(visualPackage.basePath, config.build.dropFolder);
        let packgeDropFolder = path.join(visualPackage.basePath, config.package.dropFolder);
        let visualPluginFile = path.join(visualPackage.basePath, config.build.precompileFolder, visualPlugin);
        await fs.ensureDir(tmpFolder);
        await fs.ensureDir(precompileFolder);
        await fs.ensureDir(dropFolder);
        await fs.ensureDir(packgeDropFolder);
        await fs.createFile(visualPluginFile);
    }

    static loadAPIPackage() {
        try {
            let basePath = require.resolve("powerbi-visuals-api", {
                paths: [process.cwd()]
            });
            return require(basePath);
        } catch (ex) {
            return null;
        }
    }

    async installAPIpackage() {
        let apiVersion = this.pbiviz.apiVersion ? `~${this.pbiviz.apiVersion}` : "latest";
        try {
            ConsoleWriter.info(`Installing API: ${apiVersion}...`);
            let {
                stdout,
                stderr
            } = await exec(`npm install --save powerbi-visuals-api@${apiVersion}`);
            ConsoleWriter.info(stdout);
            ConsoleWriter.warn(stderr);
            return true;
        } catch (ex) {
            if (ex.message.indexOf("No matching version found for powerbi-visuals-api") !== -1) {
                throw new Error(`Error: Invalid API version: ${apiVersion}`);
            }
            ConsoleWriter.error(`npm install powerbi-visuals-api@${apiVersion} failed`);
            return false;
        }
    }

    enableOptimization() {
        this.webpackConfig.mode = "production";
        this.webpackConfig.optimization = {
            concatenateModules: false,
            minimize: true
        };
    }

    async configureDevServer(visualPackage, port = 8080) {
        let options = await CertificateTools.resolveCertificate();

        this.webpackConfig.devServer = {
            ...this.webpackConfig.devServer,
            port: port || config.server.port,
            contentBase: path.join(visualPackage.basePath, config.build.dropFolder),
            https: {
                key: options.key,
                cert: options.cert,
                pfx: options.pfx,
                passphrase: options.passphrase
            },
            publicPath: config.server.assetsRoute
        };
    }

    configureVisualPlugin(options, tsconfig, visualPackage) {
        const visualJSFilePath = visualPackage.buildPath(tsconfig.compilerOptions.out || tsconfig.compilerOptions.outDir);
        this.webpackConfig.output.path = path.join(visualPackage.basePath, config.build.dropFolder);
        this.webpackConfig.output.filename = "[name]";
        let visualPluginPath = path.join(process.cwd(), config.build.precompileFolder, visualPlugin);
        this.webpackConfig.plugins.push(
            new webpack.WatchIgnorePlugin({ paths: [visualPluginPath] })
        );
        if (tsconfig.compilerOptions.out) {
            this.webpackConfig.entry = {
                "visual.js": visualJSFilePath
            };
        } else {
            this.webpackConfig.entry["visual.js"] = [visualPluginPath];
            this.webpackConfig.output.library = `${this.pbiviz.visual.guid}${options.devMode ? "_DEBUG" : ""}`;
            this.webpackConfig.output.libraryTarget = 'var';
        }
    }

    async configureCustomVisualsWebpackPlugin(visualPackage, options, tsconfig) {
        let pluginConfiguration = lodashCloneDeep(visualPackage.config);

        if (tsconfig.compilerOptions.outDir) {
            let apiVersionInstalled;
            try {
                apiVersionInstalled = (await exec('npm list powerbi-visuals-api version')).stdout.split("\n")[1].split("@")[1].trim();
            } catch (err) {
                ConsoleWriter.warn(`"powerbi-visuals-api" is not installed`);
            }
            // if the powerbi-visual-api package wasn't installed
            // install the powerbi-visual-api, with version from apiVersion in pbiviz.json
            // or the latest version the API if apiVersion is absent in pbiviz.json
            if (!apiVersionInstalled || (typeof this.pbiviz.apiVersion !== "undefined" && this.pbiviz.apiVersion != apiVersionInstalled)) {
                await this.installAPIpackage();
            }
            let api = WebPackGenerator.loadAPIPackage(visualPackage);
            pluginConfiguration.apiVersion = api.version;
            pluginConfiguration.capabilitiesSchema = api.schemas.capabilities;
            pluginConfiguration.pbivizSchema = api.schemas.pbiviz;
            pluginConfiguration.stringResourcesSchema = api.schemas.stringResources;
            pluginConfiguration.dependenciesSchema = api.schemas.dependencies;
        } else {
            pluginConfiguration.schemaLocation = path.join(process.cwd(), '.api', 'v' + this.pbiviz.apiVersion);
            pluginConfiguration.externalJS = [path.join(visualPackage.basePath, config.build.precompileFolder, "externalJS.js")];
            pluginConfiguration.cssStyles = path.join(visualPackage.basePath, config.build.dropFolder, config.build.css);
            pluginConfiguration.generatePlugin = false;
        }

        pluginConfiguration.customVisualID = `CustomVisual_${this.pbiviz.visual.guid}`.replace(/[^\w\s]/gi, '');
        pluginConfiguration.devMode = (typeof options.devMode === "undefined") ? true : options.devMode;
        pluginConfiguration.generatePbiviz = options.generatePbiviz;
        pluginConfiguration.generateResources = options.generateResources;
        pluginConfiguration.minifyJS = options.minifyJS;
        const dependenciesPath = this.pbiviz.dependencies && path.join(process.cwd(), this.pbiviz.dependencies);
        pluginConfiguration.dependencies = fs.existsSync(dependenciesPath) ? this.pbiviz.dependencies : null;
        pluginConfiguration.modules = typeof tsconfig.compilerOptions.outDir !== "undefined";
        pluginConfiguration.visualSourceLocation = path.posix.relative(config.build.precompileFolder, tsconfig.files[0]).replace(/(\.ts)x|\.ts/, "");
        pluginConfiguration.pluginLocation = path.join(config.build.precompileFolder, "visualPlugin.ts");
        pluginConfiguration.compression = options.compression;
        return pluginConfiguration;
    }

    async appendPlugins(options, visualPackage, tsconfig) {
        let pluginConfiguration = await this.configureCustomVisualsWebpackPlugin(visualPackage, options, tsconfig);

        let statsFilename = config.build.stats.split("/").pop();
        let statsLocation = config.build.stats.split("/").slice(0, -1).join(path.sep);
        statsFilename = statsFilename.split(".").slice(0, -1).join(".");
        statsFilename = `${statsFilename}.${options.devMode ? "dev" : "prod"}.html`;

        this.webpackConfig.plugins.push(
            new Visualizer({
                reportFilename: path.join(statsLocation, statsFilename),
                openAnalyzer: false,
                analyzerMode: `static`
            }),
            new PowerBICustomVisualsWebpackPlugin(pluginConfiguration),
            new ExtraWatchWebpackPlugin({
                files: [visualPackage.buildPath(this.pbiviz.capabilities)]
            }),
            new FriendlyErrorsWebpackPlugin(),
            new webpack.ProvidePlugin({
                window: 'realWindow',
                define: 'fakeDefine',
                powerbi: 'globalPowerbi'
            })
        );
    }

    setTarget({
        target = "es5",
        fast = false
    }) {
        let tsOptions = {};
        if (fast) {
            tsOptions = {
                transpileOnly: false,
                experimentalWatchApi: false
            };
        }
        if (target === "es5") {
            let babelOptions = {
                "presets": [
                    [
                        require.resolve('@babel/preset-env'),
                        {
                            "targets": {
                                "ie": "11"
                            },
                            useBuiltIns: "entry",
                            corejs: 3,
                            modules: false
                        }
                    ]
                ],
                plugins: [require.resolve("@babel/plugin-syntax-dynamic-import")],
                sourceType: "unambiguous",
                cacheDirectory: path.join(config.build.precompileFolder, "babelCache")
            };

            this.webpackConfig.module.rules.push({
                test: /(\.ts)x|\.ts$/,
                include: /powerbi-visuals-|src|precompile[/\\]visualPlugin.ts/,
                exclude: [/core-js/],
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: babelOptions
                    },
                    {
                        loader: require.resolve('ts-loader'),
                        options: tsOptions
                    }
                ]
            },
                {
                    test: /(\.js)x|\.js$/,
                    exclude: [/core-js/],
                    use: [
                        {
                            loader: require.resolve('babel-loader'),
                            options: babelOptions
                        }
                    ]
                });
        } else {
            this.webpackConfig.module.rules.push({
                test: /(\.ts)x?$/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: tsOptions
                    }
                ]
            });
        }
    }

    async prepareWebPackConfig(visualPackage, options, tsconfig) {
        this.webpackConfig = require('./webpack.config');
        if (options.minifyJS) {
            this.enableOptimization();
        }
        await this.appendPlugins(options, visualPackage, tsconfig);
        await this.configureDevServer(visualPackage, options.devServerPort);
        await this.configureVisualPlugin(options, tsconfig, visualPackage);
        this.setTarget({
            target: options.target,
            fast: options.fast,
            oldProject: options.oldProject
        });

        return this.webpackConfig;
    }

    async assemblyExternalJSFiles(visualPackage) {
        let externalJSFilesContent = "";
        let externalJSFilesPath = path.join(visualPackage.basePath, config.build.precompileFolder, "externalJS.js");
        await fs.writeFile(
            externalJSFilesPath,
            externalJSFilesContent, {
            encoding: encoding
        });

        return externalJSFilesPath;
    }

    async applyWebpackConfig(visualPackage, options = {
        devMode: false,
        generateResources: false,
        generatePbiviz: false,
        minifyJS: true,
        minify: true,
        target: "es5",
        devServerPort: 8080,
        fast: false,
        compression: 0,
        oldProject: false
    }) {
        const tsconfigPath = visualPackage.buildPath('tsconfig.json');
        const tsconfig = require(tsconfigPath);

        this.pbivizJsonPath = visualPackage.buildPath('pbiviz.json');
        this.pbiviz = require(this.pbivizJsonPath);

        const capabliliesPath = this.pbiviz.capabilities;
        visualPackage.config.capabilities = capabliliesPath;

        const dependenciesPath = this.pbiviz.dependencies && path.join(process.cwd(), this.pbiviz.dependencies);
        const dependenciesFile = fs.existsSync(dependenciesPath) && require(dependenciesPath);
        visualPackage.config.dependencies = typeof dependenciesFile === 'object' ? dependenciesFile : {};

        await WebPackGenerator.prepareFoldersAndFiles(visualPackage);

        let webpackConfig;
        // new style
        let oldProject;
        if (tsconfig.compilerOptions.outDir) {
            options.oldProject = false;
            oldProject = false;
            // check apiVersion in package.json and installed version
            webpackConfig = await this.prepareWebPackConfig(visualPackage, options, tsconfig);
            // old style
        } else {
            options.oldProject = true;
            oldProject = true;
            ConsoleWriter.warn("For better development experience, we strongly recommend converting the visual to es2015 modules");
            ConsoleWriter.warn("https://microsoft.github.io/PowerBI-visuals/docs/latest/how-to-guide/migrating-to-powerbi-visuals-tools-3-0");
            let pluginDropPath = await TypescriptCompiler
                .createPlugin(
                    visualPackage,
                    `${this.pbiviz.visual.guid}${options.devMode ? "_DEBUG" : ""}`
                );
            tsconfig.files.push(pluginDropPath);

            await TypescriptCompiler.runWatcher(tsconfig.files, tsconfig.compilerOptions, !options.devMode, visualPackage);
            await TypescriptCompiler.concatExternalJS(visualPackage);
            await this.assemblyExternalJSFiles(visualPackage, options.minifyJS, tsconfig.compilerOptions.out);
            await TypescriptCompiler.appendExportPowerBINameSpace(visualPackage, tsconfig.compilerOptions);
            await TypescriptCompiler.injectGlobalizeNameSpace(visualPackage, tsconfig.compilerOptions);
            await LessCompiler.build(visualPackage, options);
            // eslint-disable-next-line require-atomic-updates
            options.target = "es6"; // disable babel for old projects
            webpackConfig = await this.prepareWebPackConfig(visualPackage, options, tsconfig);
        }
        return {
            webpackConfig,
            oldProject
        };
    }
}

module.exports = WebPackGenerator;
