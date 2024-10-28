import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true, // This will inline dependencies instead of requiring them
    esbuild: {
      target: 'es2020', // Target modern browsers
      platform: 'browser', // Explicitly target browser platform
    },
  },
  // Exclude Node.js specific dependencies from the bundle
  externals: [
    'node:*', // Exclude node built-ins
    'jiti',
  ],
})
