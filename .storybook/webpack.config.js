const path = require('path');

module.exports = {
  module: {
    loaders: [
      {
         test: /\.css?$/,
         loaders: [ 'style', 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]' ],
         include: path.resolve(__dirname, '../')
       }
    ]
  }
}
