<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { ensambleSvg, getIdenticonsParams, colors as identiconColors, identiconFeatures } from 'identicons-esm'
import { computed, onMounted, ref } from 'vue'
import type { Colors, Section, Sections } from 'identicons-esm'
import PillSelector from './PillSelector.vue'

const props = defineProps<{ input: string }>()
const initialParams = ref<{ sections: Sections, colors: Colors }>()

interface Svg { path: string, svg: string }

const entries = Object.entries(identiconFeatures)
const bottom = ref<Svg[]>(entries.filter(([path]) => path.includes('bottom')).map(([path, svg]) => ({ path, svg })))
const top = ref<Svg[]>(entries.filter(([path]) => path.includes('top')).map(([path, svg]) => ({ path, svg })))
const face = ref<Svg[]>(entries.filter(([path]) => path.includes('face')).map(([path, svg]) => ({ path, svg })))
const sides = ref<Svg[]>(entries.filter(([path]) => path.includes('sides')).map(([path, svg]) => ({ path, svg })))

const options = ['bottom', 'top', 'face', 'sides', 'colors']
const activeSection = useLocalStorage<Section | 'colors'>('active-variant', 'bottom')
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
  const shouldContinue = confirm('This will trigger a force brute algorithm to find the string. It may take a while, it will block the main thread of this tab, and the only way of stopping is closing the tab. I am not sure really what the consecuences are, but if you continue you have been warn. Do you want to continue?')

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

const showFancy = useLocalStorage('show-fancy', false)

const identicon = computed(() => ensambleSvg({ colors: colors.value, sections: sections.value }, { fancy: showFancy.value }))
</script>

<template>
  <div>
    <div mx-auto size-156 v-html="identicon" />
    <form nq-mt-32 @submit.prevent="">
      <label flex="~ gap-8" self-end justify-self-end text-right text-sm nq-mt-16>
        <input v-model="showFancy" type="checkbox" nq-switch>
        Show Fancy
      </label>
      <PillSelector v-model="activeSection" :options mx-auto />
      <ul flex="~ gap-x-32 gap-y-64 items-center wrap" scale-85>
        <li v-for="({ path, svg }) in activeFeatures" :key="path" :class="{ 'bg-neutral-500': isSelected(svg) }" rounded-8>
          <button group bg-transparent @click="select(svg)">
            <div v-html="getSvg(svg)" />
            <span rounded-2 bg-neutral-300 px-8 py-3 font-mono op-0 text-lg group-hocus:op-100>{{ path.split('/').slice(3).join('/') }}</span>
          </button>
        </li>
      </ul>
      <div v-if="activeSection === 'colors'" w-full nq-mt-32>
        <label flex="~ items-center gap-8">
          <span mr-auto text-10 nq-label>Main color</span>
          <div v-for="color in identiconColors" :key="color">
            <div :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeMain = color" />
          </div>
        </label>

        <label flex="~ items-center gap-8" nq-mt-32>
          <span mr-auto text-10 nq-label>Background color</span>
          <div v-for="color in identiconColors" :key="color">
            <div :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeBackground = color" />
          </div>
        </label>

        <label flex="~ items-center gap-8" nq-mt-32>
          <span mr-auto text-10 nq-label>Accent color</span>
          <div v-for="color in identiconColors" :key="color">
            <div :style="`background: ${color}`" size-20 cursor-pointer rounded-full @click="activeAccent = color" />
          </div>
        </label>
      </div>
    </form>
    <button nq-pill-sm mx-auto mb-96 mt-48 nq-pill-blue @click="generateString">
      Find a string that generates this identicon
    </button>
  </div>
</template>
