# Change Log - PowerBI Visual Tools (pbiviz)

This page contains information about changes to the PowerBI Visual Tools (pbiviz).

## 3.2.4
* Fixed certificate issues

## 3.2.2
* Removed npm-force-resolutions package

## 3.2.1
* Fixed preinstall to prevent instalation failure because of npm-force-resolutions
* Fixed pbiviz.json dependencies option usage

## 3.2.0
* Fixed LessCompiler for old visuals

## 3.1.19
* Fixed webpack Node.js polyfill issue in webpack 5+"

## 3.1.18
* Removed deprecated packages

## 3.1.16
* Added visuals compatibility with webpack v5
* Removed lodash: _.template, ._findindex, .difference
* Packages update

## 3.1.15
* Webpack plugin update
* npm audit package-lock patch

## 3.1.14
* Fix output library name for debug mode

## 3.1.12
* Command package rolling back to fix issues with some commands running

## 3.1.11
* Packages update. Fixed https://github.com/microsoft/PowerBI-visuals-tools/issues/304

## 3.1.10
* Packages update: Uglify-js is replaced by Terser

## 3.1.9
* Fix loading the old visual projects
* Fix loading old [`formattingutils`](https://github.com/microsoft/powerbi-visuals-utils-formattingutils/tree/72a136aca836e60042be35b1cd2ae10a07837ba8) in the old visual projects.

## 3.1.8
* Update `powerbi-visuals-webpack-plugin` to 2.2.1

## 3.1.7
* Fix vscode workspace settings template
* Fix certificate tool error handling

## 3.1.6
* Fix webpack configureation include regex
* Templates update

## 3.1.5
* Templates update

## 3.1.4
* Packages update

## 3.1.3
* Remove `@babel/polyfill`
* Replace `webpack-visualizer-plugin` by `webpack-bundle-analyzer`

## 3.1.2
* Add extensions for *.svg *.eot files to `base64-inline-loader` configuration
* Exclude `code-js` package to process by Babel
* Include `@babel/plugin-syntax-dynamic-import` plugin for Babel
* Update `core-js` package to version 3.x.x.

## 3.1.1
* Add `base64-inline-loader` to load images

## pbiviz v3.1.0
* Release. Now Webpack is default builder for Custom Visuals.
* What’s new in powerbi-visuals-tools v3?
	* TypeScript v3.0.1 by default
	* ES6 Modules supported
	* New versions of D3v5 and other external libraries are supported
	* Reduced package size
	* Improved API performance
* For the full details please check [this article](https://microsoft.github.io/PowerBI-visuals/docs/how-to-guide/migrating-to-powerbi-visuals-tools-3-0/). 

## pbiviz v2.5.0 
* Added Analytics Pane support
Note: API v2.4.0 skipped as it does not include any public changes

## pbiviz v2.3.0
* custom visuals now support a landing page

## pbiviz v2.2.2
* Update package-lock.json to fix vulnerabilities

## pbiviz v2.2.1
* Deprecated `applySelectionFilter` from `ISelectionManager`

## pbiviz v3.0.12 Beta
* Compression option for compressing visual package
* Fix launch webpack build triggering
* Update powerbi-visuals-webpack-plugin to 2.1.0

## pbiviz v3.0.11 Beta
* Add support to import *.css and *.less files
* Fix reloading capabilities.json
* Resolve issue of starting dev server after copy certs from global instance
* Serve old visual project by nodejs server instead webpack dev server

## pbiviz v3.0.10 Beta
* Resolve dev server certificates from global instance of pbiviz.
* Replace VisualServer.js by webpack-dev-server

## pbiviz v3.0.9 Beta
* Set `sourceType` to "unambiguous" for babel configuration

## pbiviz v3.0.8 Beta
* Update powerbi-visuals-webpack-plugin to 2.0.0
* Remove minification by babel (remove `babel-preset-minify` package).

## pbiviz v3.0.7 Beta
* Update powerbi-visuals-webpack-plugin to 1.0.15

## pbiviz v3.0.6 Beta
* Install the latest patch of `powerbi-visuals-api`
* The `pbiviz.json` values of visual templates overrides global template values
* Remove unnecessary `setApiVersion` and `updateApi` from `VisualGenerator`
* Fix including styles into visual package
* Update powerbi-visuals-plugin to version 1.0.13

## pbiviz v3.0.5 Beta
* Prevent using define function in context of module

## pbiviz v3.0.4 Beta
* Update powerbi-visuals-plugin to version 1.0.11

## pbiviz v3.0.3 Beta
* Update powerbi-visuals-plugin to version 1.0.10
* Remove jasmine-node package

## pbiviz v3.0.2 Beta
* Tools observe changes in `pbiviz.json` and `capabilities.json` files and rebuild the visual.
* `webpack-visualizer-plugin` replaced by `webpack-bundle-analyzer` to visualize the webpack bundle stats.

## pbiviz v3.0.1 Beta
* Webpack based tools

## pbiviz v2.0.2 
* Skip precompilation for the visual with ES6 modules

## pbiviz v2.0.1
* Update package.json. Fix package installation

## pbiviz v2.0.0
* TypeScript external modules support

## pbiviz v1.12.1
* Generate certificates on development server starts 

## pbiviz v1.11.3
* Resolve PowerShell params issue on Win8.

## pbiviz v1.11.2
* Resolve PowerShell script launching issue.

## pbiviz v1.11.1
* Check certificate path in `--install-cert` command.

## pbiviz v1.11.0
* Added `selectionManager.registerOnSelectCallback()` method for Report Bookmarks support

## pbiviz v1.10.2
* Added `pbiviz --create-cert` for generating new unique certificate

## pbiviz v1.10.1
* Increase typescript to 2.3.3 version

## pbiviz v1.10.0
* Added ILocalizationManager
* Upgrade dependencies
* Added Authentication API call support

## pbiviz v1.9.0
* Added launchUrl API call support

## pbiviz v1.8.1
* FIX: Localization schema will be ignored if API doesn't support localization

## pbiviz v1.8.0
* Added new type "fillRule" (gradient) support in capabilities schema
* Added "rule" property support in capabilities schema for object properties
* Fixed sub commands help output in "Using:" section

## pbiviz v1.7.5
* Return innerHTML method for RHTML visual sample 

## pbiviz v1.7.4
* Remove innerHTML method from sample visual

## pbiviz v1.7.3
* Added RESJSON support 

## pbiviz v1.7.2
* Add name validation to pbiviz new command, restrict usage of symbols in the file visual name.

## pbiviz v1.7.1
* Added visual name validation
* Added auto-install npm dependencies

## pbiviz v1.6.5
* Updated npm dependencies
* Fixed settings generation

## pbiviz v1.1.0

* Fix issue in [Capabilities.objects does not support "text" type](https://github.com/Microsoft/PowerBI-visuals-tools/issues/12)
* Add `pbiviz update` to support updating visual API type definitions and schema
* Add `--api-version` flag to `pbiviz new` to support creating visuals with a specific api version
* Add support for alpha release of API v1.2.0

## pbiviz v1.0.0

Initial public release
