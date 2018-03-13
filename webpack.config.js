const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  context: __dirname + '/src',
  entry: {
    'js/easysteem': './easysteem.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: process.env.NODE_ENV === 'production' ? '[name].min.js' : '[name].js',
    library: 'EasySteem',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          "babel-loader",
          "eslint-loader",
        ],
      }
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: '../example/example.html', to: 'example.html'},
      {from: '../example/example.js', to: 'js/example.js'},
      {from: '../example/config.js', to: 'js/config.js'}
    ])
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.devtool = '#cheap-module-source-map';

  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
       output: {
        ascii_only: true,
        beautify: false,
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]);
}

module.exports = config;