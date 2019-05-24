const path = require('path')

module.exports = {
  devServer: {
    contentBase: './src',
    port: 9000
  },
  devtool: 'inline-source-map',
  entry: {
    index: './src/index.js',
    rootProcess: './src/rootProcess.js'
  },
  mode: 'development',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
}
