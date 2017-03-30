var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: __dirname + '/src/js/main.js',
  output: {
    path: __dirname + '/dist',
    filename: './js/main.min.js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract({
        fallback: 'style-loader', // backup loader when not building .css file
        use: 'css-loader!sass-loader', // loaders to preprocess CSS
      }),
    }],
  },
  plugins: [
    /*new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),*/
    new ExtractTextPlugin('./css/[name].min.css'),
    //new webpack.optimize.UglifyJsPlugin(),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: { discardComments: { removeAll: true } },
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
};
