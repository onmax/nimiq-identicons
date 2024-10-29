<script setup lang="ts">
// @ts-expect-error no types available
import IdenticonsLegacy from '@nimiq/identicons/dist/identicons.min.js'
import identiconRaw from '@nimiq/identicons/dist/identicons.min.svg?raw'
import { useDark, useLocalStorage } from '@vueuse/core'
import { createIdenticon } from 'identicons-esm'
import { computed, ref, watch } from 'vue'
import Builder from './components/Builder.vue'

const input = useLocalStorage('identicon', 'nimiq')

const identicon = ref<string>('')
const identiconLegacy = ref<string>('')
const identiconDuration = ref(0)
const identiconLegacyDuration = ref(0)

IdenticonsLegacy.svgPath = `data:text/plain;base64,${window.btoa(identiconRaw)}`

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
const builderMode = useLocalStorage('builder-mode', { default: false })

const isDark = useDark()
</script>

<template>
  <header flex="~ items-center justify-between" mx-auto max-w-1400 w-full px-32 py-20>
    <a href="/" flex="~ items-center gap-8">
      <div i-nimiq:logos-nimiq-horizontal dark:i-nimiq:logos-nimiq-white-horizontal text-21 />
      <span mt--1 text-lg>Identicons</span>
    </a>
    <div flex="~ items-center gap-24">
      <input v-model="isDark" type="checkbox" nq-switch style="--active-color: rgb(var(--nq-neutral-400))">
      <a href="https://github.com/onmax/identicons" target="_blank" rel="noopener noreferrer" un-text="lg neutral-900 hocus:neutral">
        <div i-nimiq:logos-github-mono />
      </a>
    </div>
  </header>
  <main flex="~ col justify-center items-center" mx-auto max-w-1400 px-32>
    <h1 lh-none text-xl nq-mt-32>
      Nimiq Identicons Playground
    </h1>
    <form v-show="!builderMode" nq-mt-32 @submit.prevent>
      <input v-model="input" type="text" placeholder="Enter something..." rounded-full text-lg nq-input-box>
    </form>

    <label flex="~ gap-8" self-end justify-self-end text-right text-sm nq-mt-16>
      <input v-model="showLegacy" type="checkbox" nq-switch>
      Show Legacy implementation
    </label>
    <label flex="~ gap-8" self-end justify-self-end text-right text-sm nq-mt-16>
      <input v-model="builderMode" type="checkbox" nq-switch>
      Builder mode
    </label>

    <div v-if="!builderMode" flex="~ gap-8 col md:row justify-around" w-full nq-mt-32>
      <div flex="~ items-center col">
        <h2 v-show="showLegacy" text="xs blue" ring="1.5 blue/60" w-max rounded-full px-16 py-4 font-semibold nq-label>
          New
        </h2>
        <img :src="identicon" alt="" nq-mt-16>
        <div v-show="showLegacy" flex="~ items-center" text-xs nq-label>
          <p title="size of the svg as data URI">
            {{ identiconSize }}kb
          </p>
          <div mx-16 w-px self-stretch bg-neutral-800 />
          <p lowercase title="time to compute">
            {{ identiconDuration }}ms
          </p>
        </div>
      </div>

      <div v-if="showLegacy" flex="~ col items-center">
        <h2 v-show="showLegacy" text="xs neutral-700" ring="1.5 neutral-500" w-max rounded-full px-16 py-4 font-semibold nq-label>
          Legacy
        </h2>
        <img :src="identiconLegacy" alt="" nq-mt-16>
        <div id="container" />
        <div flex="~ items-center" text-xs nq-label>
          <p title="size of the svg as data URI">
            {{ identiconLegacySize }}kb
          </p>
          <div mx-16 w-px self-stretch bg-neutral-800 />
          <p lowercase title="time to compute">
            {{ identiconLegacyDuration }}ms
          </p>
        </div>
      </div>
    </div>
    <Suspense v-else>
      <Builder :input />
    </Suspense>
  </main>
</template>
