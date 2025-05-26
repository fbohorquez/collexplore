const webpack = require('webpack');
const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      timers: require.resolve('timers-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
