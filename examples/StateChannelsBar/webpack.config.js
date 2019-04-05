const path = require('path');

module.exports = {

	entry: ['babel-polyfill', './forWeb.js'],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public/scripts'),
        library: 'aeWeb',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
	module: {
		rules: [{
			use: {
				loader: 'babel-loader',
				options: { presets: ['@babel/preset-env'] }
			},
			test: /\.js$/,
			// standard setting for most bundlers web-app setup
			// entirely excludes the node_modules folder
			exclude: [/node_modules/],
			// ...but when using external ES Modules you need to
			// include required externals ES modules (eg. our Aepp-SDK) like so:
			include: [/node_modules\/@aeternity/, /node_modules\/rlp/],
			// loader: 'babel-loader'
		}]
	},
	optimization: {
		minimize: false
	}
};