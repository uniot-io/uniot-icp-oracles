<template>
  <button @click="increase">InMyStore</button>
  <div>MyStoreVal: {{ counter1234 }}, {{ doubleCount }}</div>
</template>

<style lang="scss" scoped>
div {
  background-color: $base-color;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useMyDemoStore } from '@/store/DemoStore'
const myDemoStore = useMyDemoStore()
const counter1234 = computed(() => myDemoStore.counter1234)
const doubleCount = computed(() => myDemoStore.doubleCount)

const increase = () => myDemoStore.increment()
</script>
