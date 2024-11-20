<script setup lang="ts">
import { useDark, useLocalStorage } from '@vueuse/core'
import Builder from './components/Builder.vue'
import DefaultDemo from './components/DefaultDemo.vue'
import WebComponentDemo from './components/WebComponentDemo.vue'

const input = useLocalStorage('identicon', 'nimiq')
const isDark = useDark()
const view = useLocalStorage('view', 'default')
</script>

<template>
  <header flex="~ items-center justify-between" mx-auto max-w-1400 w-full px-32 py-20>
    <a href="/" flex="~ items-center gap-8">
      <div i-nimiq:logos-nimiq-horizontal dark:i-nimiq:logos-nimiq-white-horizontal text-21 />
      <span mt--1 text-lg>Identicons</span>
    </a>
    <div flex="~ items-center gap-24">
      <input v-model="isDark" type="checkbox" nq-switch style="--active-color: rgb(var(--nq-neutral-400))">
      <a href="https://github.com/onmax/nimiq-identicons" target="_blank" rel="noopener noreferrer" un-text="lg neutral-900 hocus:neutral">
        <div i-nimiq:logos-github-mono />
      </a>
    </div>
  </header>
  <main flex="~ col justify-center items-center" mx-auto max-w-1400 px-32>
    <h1 lh-none text-xl nq-mt-32>
      Nimiq Identicons Playground
    </h1>

    <div flex="~ gap-8" nq-my-32>
      <button
        :class="{ active: view === 'default' }"
        nq-pill-tertiary
        @click="view = 'default'"
      >
        Default
      </button>
      <button
        nq-pill-tertiary
        :class="{ active: view === 'builder' }"
        @click="view = 'builder'"
      >
        Builder
      </button>
      <button
        nq-pill-tertiary
        :class="{ active: view === 'web-component' }"
        @click="view = 'web-component'"
      >
        Web Component
      </button>
    </div>

    <WebComponentDemo v-if="view === 'web-component'" v-model="input" />
    <Builder v-if="view === 'builder'" :input="input" />
    <DefaultDemo v-if="view === 'default'" :input="input" />
  </main>
</template>

<style>
.nq-button-s.active {
  background: rgb(var(--nq-blue));
  color: white;
}
</style>
