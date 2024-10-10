<template>
  <button class="bclicked" @mousedown="onClickStart" @click="onClick">
    <svg class="icon" width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="50" height="50" rx="5" fill="#CFD3E4" />
      <circle cx="6.25" cy="6.25" r="3.75" fill="#303340" />
      <circle cx="6.25" cy="43.75" r="3.75" fill="#303340" />
      <circle cx="43.75" cy="6.25" r="3.75" fill="#303340" />
      <circle cx="43.75" cy="43.75" r="3.75" fill="#303340" />
      <circle cx="25" cy="25" r="15" :fill="color" />
    </svg>
    <span class="pin-number">{{ pin }}</span>
  </button>
</template>

<script>
export default {
  name: 'BClickControl',
  props: {
    pin: {
      type: Number,
      default: null
    },
    terminated: Boolean
  },
  data() {
    return {
      value: false
    }
  },
  watch: {
    terminated(newValue) {
      if (newValue) {
        this.value = false
      }
    }
  },
  computed: {
    color() {
      return this.value ? '#4c68fc' : '#303340'
    }
  },
  methods: {
    onClickStart() {
      if (this.value) {
        document.removeEventListener('mouseup', this.clickListener)
      }
      document.addEventListener('mouseup', this.clickListener)
      this.value = true
    },
    clickListener() {
      this.value = false
      document.removeEventListener('mouseup', this.clickListener)
    },
    onClick() {
      this.$emit('value:change', { value: true, pin: this.$props.pin })
    }
  }
}
</script>

<style lang="scss" scoped>
.icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

button {
  background: transparent;
  cursor: pointer;
  border: 0;
  position: relative;
  width: 3rem;
  height: 3rem;
}

.button-disabled {
  pointer-events: none;
  cursor: inherit;
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
