<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { createIdenticon } from 'identicons'
import { ref } from 'vue'

const input = ref('nimiq')

const identicon = computedAsync(async () => {
  const identicon = await createIdenticon(input.value, { encodedAsDataUri: true })
  return identicon
})
</script>

<template>
  <main px-32 flex="~ col justify-center items-center">
    <h1 text-xl nq-mt-32 lh-none>
      Nimiq Identicons Playground
    </h1>
    <form nq-mt-32 @submit.prevent>
      <input v-model="input" type="text" text-lg placeholder="Enter something..." nq-input-box rounded-full>
    </form>
    <img :src="identicon" alt="" nq-mt-48>
  </main>
</template>
