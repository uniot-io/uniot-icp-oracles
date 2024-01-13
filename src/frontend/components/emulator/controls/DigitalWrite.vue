<template>
  <div class="dwrite-control">
    <svg width="30" height="47" viewBox="0 0 30 47" fill="none">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.426 28.9099C10.766 28.9099 11.8522 29.9962 11.8522 31.3362L11.8522 44.5737C11.8522 45.9137 10.766 47 9.426 47C8.08602 47 6.99976 45.9137 6.99976 44.5737L6.99976 31.3362C6.99976 29.9962 8.08602 28.9099 9.426 28.9099ZM20.1015 28.9099C21.4414 28.9099 22.5277 29.9962 22.5277 31.3362V44.5737C22.5277 45.9137 21.4414 47 20.1015 47C18.7615 47 17.6752 45.9137 17.6752 44.5737L17.6752 31.3362C17.6752 29.9962 18.7615 28.9099 20.1015 28.9099Z"
        fill="#CFD3E4"
      />
      <path
        d="M27.0001 11.8793V29H3.00012V11.9041C3.00012 5.32963 8.35889 0 15.0001 0C21.6414 0 27.0001 5.30487 27.0001 11.8793Z"
        :fill="color"
      />
      <path d="M30 27H0V32H30V27Z" :fill="color" />
    </svg>
    <span class="pin-number">{{ pin }}</span>
  </div>
</template>

<script>
export default {
  name: 'DWriteControl',
  props: {
    value: {
      type: Boolean || Number,
      default: false
    },
    pin: {
      type: Number,
      default: null
    },
    terminated: Boolean
  },
  data() {
    return {
      localValue: false
    }
  },
  computed: {
    color() {
      return this.localValue ? '#4c68fc' : '#303340'
    }
  },
  watch: {
    value(newValue) {
      this.localValue = !!newValue
    },
    terminated(newValue) {
      if (newValue) {
        this.localValue = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dwrite-control {
  position: relative;
}

.pin-number {
  position: absolute;
  color: #fff;
  left: 50%;
  top: 15%;
  transform: translateX(-50%);
  font-size: 0.75rem;
}
</style>
