const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = [{
  mode: 'development',
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    'server': './main.ts',
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    libraryExport: 'Server',
  },

  resolve: {
    modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname), 'node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [],
  module: {
    noParse: /node_modules\/rql\/lib\/parser\.js/,
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
}];
