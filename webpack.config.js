const path = require('path');

module.exports = {
  mode: 'production' || 'development',
  entry: {
    index: './source/_ts/main.ts'
  },
  output: {
    publicPath: __dirname + '/source/js/', // 打包后资源文件的引用会基于此路径
    path: path.resolve(__dirname, 'source/js/'), // 打包后的输出目录
    filename: 'main.min.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          'ts-loader',
          {
            loader: 'js-conditional-compile-loader',
            options: {
              isDebug: process.env.NODE_ENV === 'development' // optional, this is default
            }
          },
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}