<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { ensambleSvg, getIdenticonsFeatures, getIdenticonsParams, colors as identiconColors } from 'identicons-esm'
import { computed, onMounted, ref } from 'vue'
import type { Colors, Section, Sections } from 'identicons-esm'
import PillSelector from './PillSelector.vue'

const props = defineProps<{ input: string }>()

const initialParams = ref<{ sections: Sections, colors: Colors }>()

interface Svg { path: string, svg: string }

const features = await getIdenticonsFeatures()
const entries = Object.entries(features)
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
const activeBottom = ref('')
const activeTop = ref('')
const activeFace = ref('')
const activeSides = ref('')
const activeMain = ref('')
const activeAccent = ref('')
const activeBackground = ref('')
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
const identicon = computed(() => ensambleSvg({ colors: colors.value, sections: sections.value }))

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
</script>

<template>
  <div nq-mb-32 v-html="identicon" />
  <form @submit.prevent="">
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
</template>
