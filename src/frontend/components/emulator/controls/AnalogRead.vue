<template>
  <div :id="componentId" class="aread-control" @mousedown="onMouseDown" @click="onMoveIndicator">
    <svg class="full-width full-height" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M66.7003 45.9691L66.3391 47.7854L62.7065 47.0628L63.0678 45.2465L66.7003 45.9691Z" fill="#CFD3E4" />
      <path d="M21.2936 36.9371L20.9323 38.7534L17.2998 38.0309L17.6611 36.2146L21.2936 36.9371Z" fill="#CFD3E4" />
      <path d="M45.9692 17.2997L47.7855 17.661L47.0629 21.2935L45.2466 20.9322L45.9692 17.2997Z" fill="#CFD3E4" />
      <path d="M36.9372 62.7064L38.7535 63.0677L38.0309 66.7002L36.2147 66.339L36.9372 62.7064Z" fill="#CFD3E4" />
      <path d="M62.2724 27.3409L63.3012 28.8806L60.2217 30.9383L59.1929 29.3985L62.2724 27.3409Z" fill="#CFD3E4" />
      <path d="M23.7784 53.0617L24.8073 54.6015L21.7277 56.6591L20.6989 55.1194L23.7784 53.0617Z" fill="#CFD3E4" />
      <path d="M27.3409 21.7277L28.8807 20.6988L30.9384 23.7783L29.3986 24.8072L27.3409 21.7277Z" fill="#CFD3E4" />
      <path d="M53.0618 60.2216L54.6015 59.1928L56.6592 62.2723L55.1194 63.3011L53.0618 60.2216Z" fill="#CFD3E4" />
      <path d="M63.3011 55.1194L62.2723 56.6591L59.1928 54.6015L60.2216 53.0617L63.3011 55.1194Z" fill="#CFD3E4" />
      <path d="M24.8072 29.3985L23.7783 30.9383L20.6988 28.8806L21.7277 27.3409L24.8072 29.3985Z" fill="#CFD3E4" />
      <path d="M55.1194 20.6988L56.6591 21.7277L54.6014 24.8072L53.0617 23.7784L55.1194 20.6988Z" fill="#CFD3E4" />
      <path d="M29.3985 59.1928L30.9383 60.2216L28.8806 63.3012L27.3408 62.2723L29.3985 59.1928Z" fill="#CFD3E4" />
      <path d="M66.339 36.2146L66.7003 38.0309L63.0677 38.7534L62.7064 36.9372L66.339 36.2146Z" fill="#CFD3E4" />
      <path d="M20.9323 45.2466L21.2935 47.0629L17.661 47.7854L17.2997 45.9691L20.9323 45.2466Z" fill="#CFD3E4" />
      <path d="M36.2146 17.661L38.0309 17.2997L38.7534 20.9323L36.9371 21.2936L36.2146 17.661Z" fill="#CFD3E4" />
      <path d="M45.2466 63.0677L47.0628 62.7065L47.7854 66.339L45.9691 66.7003L45.2466 63.0677Z" fill="#CFD3E4" />
      <path d="M65.4514 50.7116L64.7427 52.4225L61.321 51.0052L62.0296 49.2943L65.4514 50.7116Z" fill="#CFD3E4" />
      <path d="M22.6792 32.9948L21.9705 34.7057L18.5488 33.2883L19.2574 31.5774L22.6792 32.9948Z" fill="#CFD3E4" />
      <path d="M50.7117 18.5487L52.4226 19.2573L51.0053 22.6791L49.2944 21.9704L50.7117 18.5487Z" fill="#CFD3E4" />
      <path d="M32.9949 61.3209L34.7058 62.0295L33.2884 65.4513L31.5776 64.7426L32.9949 61.3209Z" fill="#CFD3E4" />
      <path d="M64.7427 31.5775L65.4514 33.2883L62.0296 34.7057L61.321 32.9948L64.7427 31.5775Z" fill="#CFD3E4" />
      <path d="M21.9705 49.2943L22.6792 51.0052L19.2574 52.4225L18.5488 50.7116L21.9705 49.2943Z" fill="#CFD3E4" />
      <path d="M31.5776 19.2573L33.2885 18.5487L34.7058 21.9704L32.9949 22.6791L31.5776 19.2573Z" fill="#CFD3E4" />
      <path d="M49.2944 62.0295L51.0053 61.3209L52.4226 64.7426L50.7117 65.4513L49.2944 62.0295Z" fill="#CFD3E4" />
      <path d="M60.3324 59.0229L59.0229 60.3324L56.404 57.7135L57.7135 56.404L60.3324 59.0229Z" fill="#CFD3E4" />
      <path d="M27.596 26.2865L26.2865 27.596L23.6676 24.977L24.9771 23.6676L27.596 26.2865Z" fill="#CFD3E4" />
      <path d="M59.0229 23.6676L60.3324 24.977L57.7135 27.596L56.404 26.2865L59.0229 23.6676Z" fill="#CFD3E4" />
      <path d="M26.2865 56.404L27.596 57.7135L24.9771 60.3324L23.6676 59.0229L26.2865 56.404Z" fill="#CFD3E4" />
      <path d="M67 41.0741V42.9259H63.2963V41.0741H67Z" fill="#CFD3E4" />
      <path d="M20.7037 41.0741V42.9259H17L17 41.0741H20.7037Z" fill="#CFD3E4" />
      <path d="M41.0741 17H42.9259V20.7037H41.0741V17Z" fill="#CFD3E4" />
      <path d="M41.0741 63.2963H42.9259V67H41.0741V63.2963Z" fill="#CFD3E4" />
    </svg>

    <svg class="indicator full-width full-height" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="18" :fill="indicatorColor" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M42.5112 26.624C43.3397 26.624 44.0112 27.3465 44.0112 27.8921V30.5C44.0112 31.0456 43.3397 31.624 42.5112 31.624C41.6828 31.624 41.0112 31.0456 41.0112 30.5V27.8921C41.0112 27.3465 41.6828 26.624 42.5112 26.624Z"
        fill="white"
      />
    </svg>
    <span v-if="pin !== null" class="pin-number">{{ pin }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watchEffect } from 'vue'
import debounce from 'lodash.debounce'

import { ControlEmits } from '../types'

interface AnalogReadControlProps {
  pin: number
  terminated: boolean
}

const props = defineProps<AnalogReadControlProps>()
const emit = defineEmits<ControlEmits>()

const indicatorValue = ref(0)
const maxValue = ref(1024)
const indicatorCenter = ref({ x: 0, y: 0 })

const indicatorColor = computed(() => (indicatorValue.value > 0 ? '#4c68fc' : '#303340'))
const componentId = computed(() => `aread-control-${props.pin}`)

onMounted(() => {
  nextTick(setupLayout)
})

watchEffect(() => {
  if (props.terminated) {
    resetIndicator()
    indicatorValue.value = 0
  }
})

function setupLayout() {
  // clear empty space around svg
  const clear = (el: SVGSVGElement) => {
    const elBbox = el.getBBox()
    const elViewBox = [elBbox.x, elBbox.y, elBbox.width, elBbox.height].join(' ')
    el.setAttribute('viewBox', elViewBox)
  }
  const container = document.getElementById(componentId.value)
  if (container === null) return

  const containerSvg = container.firstChild as SVGSVGElement
  const indicatorSvg = container.querySelector('.indicator') as SVGSVGElement

  ;[containerSvg, indicatorSvg].forEach(clear)

  const containerBbox = containerSvg.getBBox()
  const indicatorBbox = containerSvg.getBBox()
  const containerViewBox = [containerBbox.x, containerBbox.y, containerBbox.width, containerBbox.height].join(' ')
  const indicatorViewBox = [indicatorBbox.x, indicatorBbox.y, indicatorBbox.width, indicatorBbox.height].join(' ')
  containerSvg.setAttribute('viewBox', containerViewBox)
  indicatorSvg.setAttribute('viewBox', indicatorViewBox)

  // get actual center of the svg element
  const containerRect = container.getBoundingClientRect()
  indicatorCenter.value.x = containerRect.left + containerRect.width / 2
  indicatorCenter.value.y = containerRect.top + containerRect.height / 2
}

function resetIndicator() {
  const container = document.querySelector(`#${componentId.value}`)
  if (container === null) return
  const indicator = container.querySelector('.indicator') as SVGSVGElement
  indicator.style.transform = 'rotate(0deg)'
}

function onMoveIndicator(e: MouseEvent) {
  const container = document.querySelector(`#${componentId.value}`)
  if (container === null) return
  const indicator = container.querySelector('.indicator') as SVGSVGElement
  const mouseY = e.clientY
  const mouseX = e.clientX

  let angle =
    Math.atan2((mouseY - indicatorCenter.value.y) * -1, (mouseX - indicatorCenter.value.x) * -1) * (180 / Math.PI)

  angle = angle - 90
  indicator.style.transform = `rotate(${angle}deg)`

  if (angle < 0) {
    angle = 90 + (270 - angle * -1)
  }
  indicatorValue.value = Math.ceil((maxValue.value * angle) / 360)
  onChange()
}

function onMouseDown() {
  document.addEventListener('mouseup', () => {
    document.documentElement.style.userSelect = 'auto'
    document.removeEventListener('mousemove', onMoveIndicator)
  })

  document.documentElement.style.userSelect = 'none'
  document.addEventListener('mousemove', onMoveIndicator)
}

function onChange() {
  return () =>
    debounce(() => {
      console.log('AnalogRead:onChange')
      emit('value:change', { value: indicatorValue.value, pin: props.pin })
    })
}
</script>

<style lang="scss" scoped>
.aread-control {
  position: relative;
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.indicator {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
  transform-origin: 50%;
}

.pin-number {
  position: absolute;
  color: #fff;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  z-index: 15;
}
</style>
../types
