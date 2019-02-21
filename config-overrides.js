
const path = require('path');
const fs = require('fs');
const {injectBabelPlugin} = require('react-app-rewired');
// const rewireBabelLoader = require('react-app-rewire-babel-loader');
const appDirectory = fs.realpathSync(process.cwd());
// const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// const { paths } = require('react-app-rewired');
// // require normalized overrides
// const overrides = require('react-app-rewired/config-overrides');
// const config = require(paths.scriptVersion + '/config/webpack.config.dev');

// module.exports = overrides.webpack(config, process.env.NODE_ENV);
// console.log("bego ---------",config);

module.exports = function override(config, env) {
    
    // config.output = {
    //     ...config.output,
    //     publicPath:'/sdk/'
    // };
    
    
    console.log(config);
    // do stuff with the webpack config...
    config = injectBabelPlugin(
        ['import', { libraryName: 'antd', libraryDirectory: 'es', style: 'css' }],
        config,
    );
    return config;
};

