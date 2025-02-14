<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
import { useLocalStorage } from '@vueuse/core'
import MaterialSelector from './MaterialSelector.vue'

const input = useLocalStorage('web-component-input', 'nimiq')

const showShiny = useLocalStorage('show-shiny', false)
const activeMaterial = useLocalStorage<IdenticonMaterial>('active-material', 'bronze')
</script>

<template>
  <div flex="~ col items-center gap-32" w-full>
    <div flex="~ col gap-16" max-w-640 w-full>
      <input
        v-model="input"
        type="text"
        placeholder="Enter something..."
        rounded-full
        f-text-lg
        nq-input-box
      >
    </div>

    <div flex="~ gap-16 items-center justify-end">
      <label flex="~ gap-8" text-right f-text-sm f-mt-xs>
        <input v-model="showShiny" type="checkbox" nq-switch>
        Show Shiny
      </label>
    </div>
    <div flex="~ col items-center gap-16">
      <nimiq-shiny-identicon v-if="showShiny" :material="activeMaterial" :input />
      <nimiq-identicon v-else :input />
      <div op-50 f-text-sm>
        This is rendered using the Web Component
      </div>

      <MaterialSelector v-if="showShiny" v-model="activeMaterial" />
    </div>

    <div flex="~ col gap-8" op-70 f-text-sm>
      <p>To use the web component in your project:</p>
      <pre rounded-8 rounded-lg bg-neutral-300 p-16>
import 'identicons-esm/<span v-if="showShiny">shiny-</span>web-component'

// Then in your HTML:
&lt;nimiq-<span v-if="showShiny">shiny-</span>identicon input="hello@example.com">&lt;/nimiq-identicon></pre>
    </div>
  </div>
</template>
