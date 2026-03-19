const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 3D asset formatları
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'bin');

// Monorepo/symlink ortamında resolver deterministik olsun
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../..', 'node_modules'),
];
config.resolver.sourceExts = Array.from(new Set([
  ...(config.resolver.sourceExts || []),
  'cjs',
  'mjs',
]));

// Expo SDK 54 + monorepo'da bazı paketlerde internal require resolve sorunları için
config.resolver.unstable_enablePackageExports = false;

// zortengine (repo root) dosyalarını izleyebilmek için
config.watchFolders = [
  path.resolve(__dirname, '../..'),
];

module.exports = config;

