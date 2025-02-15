<script setup lang="ts">
import type { Colors, IdenticonMaterial, Section, Sections } from 'identicons-esm/types'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { assembleSvg } from 'identicons-esm'
import { getIdenticonsParams, colors as identiconColors, identiconFeatures } from 'identicons-esm/core'
import { assembleShinySvg, gradientNoise } from 'identicons-esm/shiny'
import { computed, onMounted, ref, watch } from 'vue'
import MaterialSelector from './MaterialSelector.vue'
import PillSelector from './PillSelector.vue'

const props = defineProps<{ input: string }>()
const initialParams = ref<{ sections: Sections, colors: Colors }>()

interface Svg { path: string, svg: string }

const entries = Object.entries(identiconFeatures)
const bottom = ref<Svg[]>(entries.filter(([path]) => path.includes('bottom')).map(([path, svg]) => ({ path, svg })))
const top = ref<Svg[]>(entries.filter(([path]) => path.includes('top')).map(([path, svg]) => ({ path, svg })))
const face = ref<Svg[]>(entries.filter(([path]) => path.includes('face')).map(([path, svg]) => ({ path, svg })))
const sides = ref<Svg[]>(entries.filter(([path]) => path.includes('sides')).map(([path, svg]) => ({ path, svg })))

const showShiny = useLocalStorage('show-shiny', false)
const options = computed(() => !showShiny.value
  ? ['bottom', 'top', 'face', 'sides', 'colors']
  : ['bottom', 'top', 'face', 'sides', 'colors', 'material'],
)
const activeSection = useLocalStorage<Section | 'colors' | 'material'>('active-variant', 'bottom')
const activeFeatures = computed(() => {
  if (activeSection.value === 'bottom')
    return bottom.value
  if (activeSection.value === 'top')
    return top.value
  if (activeSection.value === 'face')
    return face.value
  if (activeSection.value === 'sides')
    return sides.value
  return []
})
const activeBottom = useLocalStorage('activeBottom', '')
const activeTop = useLocalStorage('activeTop', '')
const activeFace = useLocalStorage('activeFace', '')
const activeSides = useLocalStorage('activeSides', '')
const activeMain = useLocalStorage('activeMain', '')
const activeAccent = useLocalStorage('activeAccent', '')
const activeBackground = useLocalStorage('activeBackground', '')
const activeMaterial = useLocalStorage<IdenticonMaterial>('active-material', 'bronze')
const colors = computed(() => ({
  main: activeMain.value,
  accent: activeAccent.value,
  background: activeBackground.value,
}))
const sections = computed(() => ({
  bottom: activeBottom.value,
  top: activeTop.value,
  face: activeFace.value,
  sides: activeSides.value,
}))
onMounted(async () => {
  initialParams.value = await getIdenticonsParams(props.input)
  activeBottom.value = initialParams.value?.sections.bottom
  activeTop.value = initialParams.value?.sections.top
  activeFace.value = initialParams.value?.sections.face
  activeSides.value = initialParams.value?.sections.sides
  activeMain.value = initialParams.value?.colors.main
  activeAccent.value = initialParams.value?.colors.accent
  activeBackground.value = initialParams.value?.colors.background
})

function getSvg(svgContent: string) {
  const { accent, main } = initialParams.value?.colors || { accent: '#000', main: '#fff' }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><g fill="${accent}" clip-path="url(#a)" color="${main}">${svgContent}</g></svg>`
}

function isSelected(svg: string) {
  switch (activeSection.value) {
    case 'bottom':
      return activeBottom.value === svg
    case 'top':
      return activeTop.value === svg
    case 'face':
      return activeFace.value === svg
    case 'sides':
      return activeSides.value === svg
  }
}

function select(svg: string) {
  switch (activeSection.value) {
    case 'bottom':
      activeBottom.value = svg
      break
    case 'top':
      activeTop.value = svg
      break
    case 'face':
      activeFace.value = svg
      break
    case 'sides':
      activeSides.value = svg
      break
  }
}

async function generateString() {
  // eslint-disable-next-line no-alert
  const shouldContinue = confirm('This will trigger a force brute algorithm to find the string. It may take a while, it will block the main thread of this tab, and the only way of stopping is closing the tab. I am not sure really what the consequences are, but if you continue you have been warn. Do you want to continue?')

  if (!shouldContinue)
    return
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  while (true) {
    const str = Array.from({ length: 16 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    const generated = await getIdenticonsParams(str)
    const mainOk = generated.colors.main === activeMain.value
    const accentOk = generated.colors.accent === activeAccent.value
    const backgroundOk = generated.colors.background === activeBackground.value
    const bottomOk = generated.sections.bottom === activeBottom.value
    const topOk = generated.sections.top === activeTop.value
    const faceOk = generated.sections.face === activeFace.value
    const sidesOk = generated.sections.sides === activeSides.value
    if (mainOk && accentOk && backgroundOk && bottomOk && topOk && faceOk && sidesOk) {
      // eslint-disable-next-line no-alert
      alert(`The string is: ${str}. You also have it in the console`)
      // eslint-disable-next-line no-console
      console.log(str)
      break
    }
  }
}

const identicon = computed(() => {
  return showShiny.value
    ? assembleShinySvg({ colors: colors.value, sections: sections.value, material: activeMaterial.value })
    : assembleSvg({ colors: colors.value, sections: sections.value })
})

const { copy, copied } = useClipboard({ source: identicon })
watch(showShiny, () => {
  if (!showShiny.value && activeSection.value === 'material')
    activeSection.value = 'bottom'
})
</script>

<template>
  <div>
    <div mx-auto size-156 v-html="identicon" />
    <form f-mt-md @submit.prevent="">
      <div flex="~ gap-16 items-center justify-end">
        <label flex="~ gap-8" text-right f-text-sm f-mt-xs>
          <input v-model="showShiny" type="checkbox" nq-switch>
          Show Shiny
        </label>

        <button type="button" mt-8 nq-pill nq-pill-secondary :class="{ 'bg-green': copied }" @click="() => copy()">
          {{ copied ? 'Copied!' : 'Copy SVG' }}
        </button>
      </div>
      <PillSelector v-model="activeSection" :options mx-auto f-mt-xs />
      <ul flex="~ gap-x-32 gap-y-64 items-center wrap" scale-85>
        <li v-for="({ path, svg }) in activeFeatures" :key="path" :class="{ 'bg-neutral-500': isSelected(svg) }" rounded-8>
          <button group bg-transparent @click="select(svg)">
            <div v-html="getSvg(svg)" />
            <span rounded-2 bg-neutral-300 px-8 py-3 font-mono op-0 f-text-lg group-hocus:op-100>{{ path.split('/').slice(3).join('/') }}</span>
          </button>
        </li>
      </ul>
      <div v-if="activeSection === 'colors'" w-full f-mt-md>
        <label flex="~ items-center gap-8">
          <span mr-auto text-10 nq-label>Main color</span>
          <div v-for="color in identiconColors" :key="color">
            <button :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeMain = color" />
          </div>
        </label>

        <label flex="~ items-center gap-8" f-mt-md>
          <span mr-auto text-10 nq-label>Background color</span>
          <div v-for="color in identiconColors" :key="color">
            <button :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeBackground = color" />
          </div>
        </label>

        <label flex="~ items-center gap-8" f-mt-md>
          <span mr-auto text-10 nq-label>Accent color</span>
          <div v-for="color in identiconColors" :key="color">
            <button :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeAccent = color" />
          </div>
        </label>
      </div>
      <MaterialSelector v-if="activeSection === 'material'" v-model="activeMaterial" f-mt-xs />
    </form>
    <button nq-pill-sm mx-auto mb-96 mt-48 nq-pill-blue @click="generateString">
      Find a string that generates this identicon
    </button>
  </div>
</template>
