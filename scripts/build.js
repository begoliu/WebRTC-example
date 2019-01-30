process.env.NODE_ENV = 'production';

const { paths } = require('react-app-rewired');
const overrides = require('react-app-rewired/config-overrides');
const webpackConfigPath = paths.scriptVersion + "/config/webpack.config.prod";

const webpackConfig = require(webpackConfigPath);

// override config in memory
require.cache[require.resolve(webpackConfigPath)].exports =
    overrides.webpack(webpackConfig, process.env.NODE_ENV);
// run original script
require(paths.scriptVersion + '/scripts/build');


console.log(webpackConfig);
