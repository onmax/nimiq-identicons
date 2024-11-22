<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
import { materialGradients } from 'identicons-esm/shiny'

const activeMaterial = defineModel<IdenticonMaterial>({ default: 'bronze' })

const bronzeGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><defs>${materialGradients.bronze.replace('160', '40').replace('160', '40')}</defs><rect width="40" height="40" rx="20" fill="url(#m)" /></svg>`
const goldGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><defs>${materialGradients.gold}</defs><rect width="40" height="40" rx="20" fill="url(#m)" /></svg>`
const platinumGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><defs>${materialGradients.platinum}</defs><rect width="40" height="40" rx="20" fill="url(#m)" /></svg>`
const silverGradient = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><defs>${materialGradients.silver}</defs><rect width="40" height="40" rx="20" fill="url(#m)" /></svg>`
</script>

<template>
  <div flex="~ gap-8 items-center">
    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'bronze'">
        <div v-html="bronzeGradient" />
      </div>
      <span text="center 10" w-full nq-label>Bronze</span>
    </div>
    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'gold'">
        <div v-html="goldGradient" />
      </div>
      <span text="center 10" w-full nq-label>Gold</span>
    </div>

    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'platinum'">
        <div v-html="platinumGradient" />
      </div>
      <span text="center 10" w-full nq-label>platinum</span>
    </div>
    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'silver'">
        <div v-html="silverGradient" />
      </div>
      <span text="center 10" w-full nq-label>Silver</span>
    </div>
  </div>
</template>
