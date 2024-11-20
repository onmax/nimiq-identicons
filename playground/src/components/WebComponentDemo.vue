<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

const input = useLocalStorage('web-component-input', 'nimiq')

const shiny = useLocalStorage('web-component-shiny', false)
</script>

<template>
  <div flex="~ col items-center gap-32" w-full>
    <div flex="~ col gap-16" max-w-640 w-full>
      <input
        v-model="input"
        type="text"
        placeholder="Enter something..."
        rounded-full
        text-lg
        nq-input-box
      >
    </div>
    <label flex="~ gap-8" self-end justify-self-end text-right text-sm nq-mt-16>
      <input v-model="shiny" type="checkbox" nq-switch>
      Show Shiny
    </label>
    <div flex="~ col items-center gap-16">
      <nimiq-identicon :shiny :input />
      <div op-50 text-sm>
        This is rendered using the Web Component
      </div>
    </div>

    <div flex="~ col gap-8" op-70 text-sm>
      <p>To use the web component in your project:</p>
      <pre rounded-8 rounded-lg bg-neutral-300 p-16>
import 'identicons-esm'

// Then in your HTML:
&lt;nimiq-identicon input="hello@example.com">&lt;/nimiq-identicon></pre>
    </div>
  </div>
</template>
