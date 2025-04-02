// Thanks to https://github.com/wobsoriano/vue-sfc-unbuild
// and all the discussions in https://github.com/unjs/unbuild/issues/80
// for the following configuration.

import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { dirname, join } from 'pathe'
import { defineBuildConfig } from 'unbuild'

const execAsync = promisify(exec)

export default defineBuildConfig({
  entries: [
    './src/core',
    './src/types',
    './src/index',
    './src/shiny',
    './src/shiny-web-component',
    './src/web-component',
  ],
  declaration: true,
  clean: true,
  hooks: {
    'mkdist:done': async (ctx) => {
      if (ctx.options.stub)
        return
      console.info('Copying features...')
      const packageDir = fileURLToPath(dirname(import.meta.url))
      const srcDir = join(packageDir, 'src/features/optimized')
      const distDir = join(packageDir, 'dist/features')
      await execAsync(`cp -r "${srcDir}" "${distDir}"`, { cwd: packageDir })
    },
  },
})
