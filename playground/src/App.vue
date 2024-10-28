<script setup lang="ts">
// @ts-expect-error no types available
import IdenticonsLegacy from '@nimiq/identicons/dist/identicons.min.js'
import { useLocalStorage } from '@vueuse/core'
import { createIdenticon } from 'identicons'
import { computed, ref, watch } from 'vue'

const input = useLocalStorage('identicon', 'nimiq')

const identicon = ref<string>('')
const identiconLegacy = ref<string>('')
const identiconDuration = ref(0)
const identiconLegacyDuration = ref(0)

watch(input, async () => {
  if (!input.value)
    return
  const start = performance.now()
  identicon.value = await createIdenticon(input.value, { format: 'image/svg+xml' })
  const end = performance.now()
  identiconDuration.value = Number((end - start).toFixed(2))
}, { immediate: true })

watch(input, async () => {
  if (!input.value)
    return
  const start = performance.now()
  IdenticonsLegacy.svgPath = './node_modules/@nimiq/identicons/dist/identicons.min.svg'
  identiconLegacy.value = await IdenticonsLegacy.toDataUrl(input.value)
  const end = performance.now()
  identiconLegacyDuration.value = Number((end - start).toFixed(2))
}, { immediate: true })

function getStrSize(str: string): number {
  const bytes = new Blob([str]).size
  return Number((bytes / 1024).toFixed(2)) // Returns number instead of string
}

const identiconSize = computed(() => getStrSize(identicon.value))
const identiconLegacySize = computed(() => getStrSize(identiconLegacy.value))

const showLegacy = useLocalStorage('show-legacy', { default: false })
</script>

<template>
  <main px-32 flex="~ col justify-center items-center">
    <h1 text-xl nq-mt-32 lh-none>
      Nimiq Identicons Playground
    </h1>
    <form nq-mt-32 @submit.prevent>
      <input v-model="input" type="text" text-lg placeholder="Enter something..." nq-input-box rounded-full>
    </form>

    <label flex="~ gap-8" text-sm text-right self-end justify-self-end nq-mt-16>
      <input v-model="showLegacy" type="checkbox" nq-switch>
      Show Legacy implementation
    </label>
    <div flex="~ gap-8 col md:row justify-around" nq-mt-32 w-full>
      <div flex="~ items-center col">
        <h2 v-show="showLegacy" text="xs blue" rounded-full nq-label font-semibold ring="1.5 blue/60" w-max px-8 py-3>
          New
        </h2>
        <img :src="identicon" alt="" nq-mt-16>
        <div v-show="showLegacy" flex="~ items-center" nq-label text-xs>
          <p title="size of the svg as data URI">
            {{ identiconSize }}kb
          </p>
          <div self-stretch w-px bg-neutral-800 mx-16 />
          <p lowercase title="time to compute">
            {{ identiconDuration }}ms
          </p>
        </div>
      </div>

      <div v-if="showLegacy" flex="~ col items-center">
        <h2 v-show="showLegacy" text="xs neutral-700" rounded-full nq-label font-semibold ring="1.5 neutral-500" w-max px-8 py-3>
          Legacy
        </h2>
        <img :src="identiconLegacy" alt="" nq-mt-16>
        <div id="container" />
        <div flex="~ items-center" text-xs nq-label>
          <p title="size of the svg as data URI">
            {{ identiconLegacySize }}kb
          </p>
          <div self-stretch w-px bg-neutral-800 mx-16 />
          <p lowercase title="time to compute">
            {{ identiconLegacyDuration }}ms
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
