const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

class WebpackTest {
  constructor() {
    Object.assign(this, {}, {
      mode: 'none',
      target: 'node',
      externals: [nodeExternals()],
      output: {
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
      },
      devtool: 'inline-cheap-module-source-map',
      resolve: {
        modules: [path.resolve(__dirname, '../'), path.resolve(__dirname, '../app'), 'node_modules'],
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [new TsconfigPathsPlugin()]
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            loader: 'istanbul-instrumenter-loader'
          },
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      }
    });
  }
}

module.exports = WebpackTest;
