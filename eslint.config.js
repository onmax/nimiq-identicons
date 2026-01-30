// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: ['packages/nimiq-identicons/v1', 'packages/nimiq-identicons/src/generated', 'playground/**/*.js', 'playground/**/*.d.ts'],
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
