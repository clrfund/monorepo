const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = {
	configureWebpack: {
		plugins: [new NodePolyfillPlugin()],
	},
}
