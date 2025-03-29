const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add this rule for Ionic components
  config.module.rules.push({
    test: /\.(js|jsx)$/,
    include: /@ionic\/core/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-transform-modules-commonjs']
      }
    }
  });

  return config;
};