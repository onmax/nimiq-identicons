<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
import { materialColors } from 'identicons-esm/shiny'

const activeMaterial = defineModel<IdenticonMaterial>({ default: 'bronze' })
</script>

<template>
  <div flex="~ gap-8 items-center">
    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'bronze'">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <linearGradient id="bb" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop :stop-color="materialColors.bronze[0]" /><stop offset="1" :stop-color="materialColors.bronze[1]" /></linearGradient>
          <rect width="40" height="40" rx="20" fill="url(#bb)" />
        </svg>
      </div>
      <span text="center 10" w-full nq-label>Bronze</span>
    </div>
    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'gold'">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <linearGradient id="gg" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop :stop-color="materialColors.gold[0]" /><stop offset="1" :stop-color="materialColors.gold[1]" /></linearGradient>
          <rect width="40" height="40" rx="20" fill="url(#gg)" />
        </svg>
      </div>
      <span text="center 10" w-full nq-label>Gold</span>
    </div>

    <div w-full flex="~ wrap gap-12">
      <div mx-auto cursor-pointer @click="activeMaterial = 'silver'">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <linearGradient id="ss" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop :stop-color="materialColors.silver[0]" /><stop offset="1" :stop-color="materialColors.silver[1]" /></linearGradient>
          <rect width="40" height="40" rx="20" fill="url(#ss)" />
        </svg>
      </div>
      <span text="center 10" w-full nq-label>Silver</span>
    </div>
  </div>
</template>
