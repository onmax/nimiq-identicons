<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { ensambleSvg, getIdenticonsParams, colors as identiconColors, identiconFeatures } from 'identicons-esm'
import { computed, onMounted, ref } from 'vue'
import type { Colors, Section, Sections } from 'identicons-esm'
import PillSelector from './PillSelector.vue'

const props = defineProps<{ input: string }>()

const initialParams = ref<{ sections: Sections, colors: Colors }>()

interface Svg { path: string, svg: string }

const bottom = ref<Svg[]>([])
const top = ref<Svg[]>([])
const face = ref<Svg[]>([])
const sides = ref<Svg[]>([])

// Process each path
Object.entries(identiconFeatures).forEach(([path, svg]) => {
  if (path.includes('bottom'))
    bottom.value.push({ path, svg })
  if (path.includes('top'))
    top.value.push({ path, svg })
  if (path.includes('face'))
    face.value.push({ path, svg })
  if (path.includes('sides'))
    sides.value.push({ path, svg })
})

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
        <button bg-transparent group @click="select(svg)">
          <div v-html="getSvg(svg)" />
          <span text-lg bg-neutral-300 px-8 py-3 rounded-2 font-mono group-hocus:op-100 op-0>{{ path.split('/').slice(3).join('/') }}</span>
        </button>
      </li>
    </ul>
    <div v-if="activeSection === 'colors'" nq-mt-32 w-full>
      <label flex="~ items-center gap-8">
        <span nq-label text-10 mr-auto>Main color</span>
        <div v-for="color in identiconColors" :key="color">
          <div size-20 :style="`background: ${color}`" rounded-full cursor-pointer @click="activeMain = color" />
        </div>
      </label>

      <label flex="~ items-center gap-8" nq-mt-32>
        <span nq-label text-10 mr-auto>Background color</span>
        <div v-for="color in identiconColors" :key="color">
          <div size-20 :style="`background: ${color}`" rounded-full cursor-pointer @click="activeBackground = color" />
        </div>
      </label>

      <label flex="~ items-center gap-8" nq-mt-32>
        <span nq-label text-10 mr-auto>Accent color</span>
        <div v-for="color in identiconColors" :key="color">
          <div size-20 :style="`background: ${color}`" rounded-full cursor-pointer @click="activeAccent = color" />
        </div>
      </label>
    </div>
  </form>
</template>
