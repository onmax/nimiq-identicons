import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: 'src/index',
      name: 'index',
      builder: 'rollup',
    },
    {
      input: 'src/core',
      name: 'core',
      builder: 'rollup',
    },
    {
      input: 'src/web-components',
      name: 'web-components',
      builder: 'rollup',
    },
    {
      input: 'src/shiny',
      name: 'shiny',
      builder: 'rollup',
    },
    {
      input: 'src/types',
      name: 'types',
      builder: 'rollup',
    },
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    esbuild: {
      target: 'es2020',
      platform: 'browser',
    },
  },
  externals: [
    'node:*',
    'jiti',
  ],
})
