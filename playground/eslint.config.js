import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  unocss: true,
  rules: {
    'ts/explicit-function-return-type': 'off',
  },
})
