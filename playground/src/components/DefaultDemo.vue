<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { createIdenticon } from 'identicons-esm'
import { createShinyIdenticon } from 'identicons-esm/shiny'
import { computed, ref, watch } from 'vue'
import MaterialSelector from './MaterialSelector.vue'

const identicon = ref<string>('')
const identiconDuration = ref(0)
const activeMaterial = useLocalStorage<IdenticonMaterial>('active-material', 'bronze')

const input = useLocalStorage('input-default', 'nimiq')
const showShiny = useLocalStorage('show-shiny', false)
const shouldValidateAddress = useLocalStorage('should-validate-address', false)
watch([input, showShiny, activeMaterial], () => {
  if (!input.value)
    return
  const start = performance.now()
  identicon.value = showShiny.value
    ? createShinyIdenticon(input.value, { material: activeMaterial.value, shouldValidateAddress: shouldValidateAddress.value })
    : createIdenticon(input.value, { shouldValidateAddress: shouldValidateAddress.value })
  const end = performance.now()
  identiconDuration.value = Number((end - start).toFixed(2))
}, { immediate: true })

const { copy, copied } = useClipboard({ source: identicon })

function getStrSize(str: string): number {
  const bytes = new Blob([str]).size
  return Number((bytes / 1024).toFixed(2))
}

const identiconSize = computed(() => getStrSize(identicon.value))
</script>

<template>
  <div flex="~ col" w-full>
    <form f-mt-md @submit.prevent>
      <input
        v-model="input"
        type="text"
        placeholder="Enter something..."
        rounded-full nq-input-box f-text-lg
      >
    </form>

    <div flex="~ gap-16 items-center justify-end">
      <label flex="~ gap-8" text-right f-text-sm f-mt-xs>
        <input v-model="showShiny" type="checkbox" nq-switch>
        Show Shiny
      </label>

      <label flex="~ gap-8" text-right f-text-sm f-mt-xs>
        <input v-model="shouldValidateAddress" type="checkbox" nq-switch>
        Validate Address
      </label>

      <button type="button" mt-8 nq-pill nq-pill-secondary :class="{ 'bg-green': copied }" @click="() => copy()">
        {{ copied ? 'Copied!' : 'Copy SVG' }}
      </button>
    </div>

    <div flex="~ col items-center" w-full f-mt-md>
      <img :src="identicon" alt="" f-mt-xs>
      <div flex="~ items-center" nq-label f-text-xs>
        <p title="size of the svg as data URI">
          {{ identiconSize }}kb
        </p>
        <div mx-16 w-px self-stretch bg-neutral-800 />
        <p lowercase title="time to compute">
          {{ identiconDuration }}ms
        </p>
      </div>

      <MaterialSelector v-if="showShiny" v-model="activeMaterial" f-mt-md />
    </div>
  </div>
</template>
