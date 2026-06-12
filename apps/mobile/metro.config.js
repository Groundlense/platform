const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const extraNodeModules = new Proxy({}, {
	get: (_target, name) => path.join(projectRoot, 'node_modules', name),
});

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	projectRoot,
	watchFolders: [workspaceRoot],
	resolver: {
		extraNodeModules,
	},
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
