<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
// @ts-expect-error no types available
import IdenticonsV1 from '@nimiq/identicons/dist/identicons.min.js'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { createIdenticon } from 'identicons-esm'
import { createShinyIdenticon } from 'identicons-esm/shiny'
import { computed, ref, watch } from 'vue'
import MaterialSelector from './MaterialSelector.vue'

const identicon = ref<string>('')
const identiconV1 = ref<string>('')
const identiconDuration = ref(0)
const identiconV1Duration = ref(0)
const activeMaterial = useLocalStorage<IdenticonMaterial>('active-material', 'bronze')

const input = useLocalStorage('input-default', 'nimiq')
const showShiny = useLocalStorage('show-shiny', false)
watch([input, showShiny, activeMaterial], async () => {
  if (!input.value)
    return
  const start = performance.now()
  identicon.value = showShiny.value
    ? await createShinyIdenticon(input.value, { format: 'image/svg+xml', material: activeMaterial.value })
    : await createIdenticon(input.value, { format: 'image/svg+xml' })
  const end = performance.now()
  identiconDuration.value = Number((end - start).toFixed(2))
}, { immediate: true })

const { copy, copied } = useClipboard({ source: identicon })

IdenticonsV1.svgPath = './node_modules/@nimiq/identicons/dist/identicons.min.svg'
watch(input, async () => {
  if (!input.value)
    return
  const start = performance.now()
  identiconV1.value = await IdenticonsV1.toDataUrl(input.value)
  const end = performance.now()
  identiconV1Duration.value = Number((end - start).toFixed(2))
}, { immediate: true })

function getStrSize(str: string): number {
  const bytes = new Blob([str]).size
  return Number((bytes / 1024).toFixed(2)) // Returns number instead of string
}

const identiconSize = computed(() => getStrSize(identicon.value))
const identiconV1Size = computed(() => getStrSize(identiconV1.value))
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

      <button type="button" mt-8 nq-pill nq-pill-secondary :class="{ 'bg-green': copied }" @click="() => copy()">
        {{ copied ? 'Copied!' : 'Copy SVG' }}
      </button>
    </div>

    <div flex="~ gap-8 col md:row justify-around" w-full f-mt-md>
      <div flex="~ items-center col">
        <h2 text="blue" ring="1.5 blue/60" w-max rounded-full px-16 py-4 font-semibold nq-label f-text-xs>
          New
        </h2>
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

      <div flex="~ col items-center">
        <h2 text="neutral-700" ring="1.5 neutral-500" w-max rounded-full px-16 py-4 font-semibold nq-label f-text-xs>
          V1
        </h2>
        <img :src="identiconV1" alt="" f-mt-xs>
        <div id="container" />
        <div flex="~ items-center" nq-label f-text-xs>
          <p title="size of the svg as data URI">
            {{ identiconV1Size }}kb
          </p>
          <div mx-16 w-px self-stretch bg-neutral-800 />
          <p lowercase title="time to compute">
            {{ identiconV1Duration }}ms
          </p>
        </div>
        <p f-text-xs>
          Not sure how to fix this in production :/
        </p>
      </div>
    </div>
  </div>
</template>
