// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: ['v1', 'playground'],
    formatters: true,
    pnpm: true,
    vue: true,
  },
  {
    files: ['**/*.vue'],
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
