<script setup lang="ts">
// @ts-expect-error no types available
import IdenticonsV1 from '@nimiq/identicons/dist/identicons.min.js'
import { useLocalStorage } from '@vueuse/core'
import { createIdenticon } from 'identicons-esm'
import { createShinyIdenticon } from 'identicons-esm/shiny'
import { computed, ref, watch } from 'vue'

const identicon = ref<string>('')
const identiconV1 = ref<string>('')
const identiconDuration = ref(0)
const identiconV1Duration = ref(0)

const input = useLocalStorage('input-default', 'nimiq')
const showShiny = useLocalStorage('show-shiny', false)
watch([input, showShiny], async () => {
  if (!input.value)
    return
  const start = performance.now()
  identicon.value = showShiny.value
    ? await createShinyIdenticon(input.value, { format: 'image/svg+xml', material: 'bronze' })
    : await createIdenticon(input.value, { format: 'image/svg+xml' })
  const end = performance.now()
  identiconDuration.value = Number((end - start).toFixed(2))
}, { immediate: true })

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
    <form nq-mt-32 @submit.prevent>
      <input
        v-model="input"
        type="text"
        placeholder="Enter something..."
        rounded-full
        text-lg
        nq-input-box
      >
    </form>

    <label flex="~ gap-8" self-end justify-self-end text-right text-sm nq-mt-16>
      <input v-model="showShiny" type="checkbox" nq-switch>
      Show Shiny
    </label>

    <div flex="~ gap-8 col md:row justify-around" w-full nq-mt-32>
      <div flex="~ items-center col">
        <h2 text="xs blue" ring="1.5 blue/60" w-max rounded-full px-16 py-4 font-semibold nq-label>
          New
        </h2>
        <img :src="identicon" size-160 alt="" nq-mt-16>
        <div flex="~ items-center" text-xs nq-label>
          <p title="size of the svg as data URI">
            {{ identiconSize }}kb
          </p>
          <div mx-16 w-px self-stretch bg-neutral-800 />
          <p lowercase title="time to compute">
            {{ identiconDuration }}ms
          </p>
        </div>
      </div>

      <div flex="~ col items-center">
        <h2 text="xs neutral-700" ring="1.5 neutral-500" w-max rounded-full px-16 py-4 font-semibold nq-label>
          V1
        </h2>
        <img :src="identiconV1" alt="" nq-mt-16>
        <div id="container" />
        <div flex="~ items-center" text-xs nq-label>
          <p title="size of the svg as data URI">
            {{ identiconV1Size }}kb
          </p>
          <div mx-16 w-px self-stretch bg-neutral-800 />
          <p lowercase title="time to compute">
            {{ identiconV1Duration }}ms
          </p>
        </div>
        <p text-xs>
          Not sure how to fix this in production :/
        </p>
      </div>
    </div>
  </div>
</template>
