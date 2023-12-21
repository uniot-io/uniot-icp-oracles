<template>
  <div :id="`dread-control-${pin}`" class="dread-control is-flex justify-center items-center">
    <el-switch v-model="localValue" class="dread-switch mr-0" size="large" />
    <span v-if="localValue" class="pin-number left">{{ pin }}</span>
    <span v-else class="pin-number right">{{ pin }}</span>
  </div>
</template>

<script>
export default {
  name: 'DReadControl',
  props: {
    pin: {
      type: Number,
      default: null
    },
    value: {
      type: Boolean,
      default: false
    },
    terminated: Boolean
  },
  data() {
    return {
      localValue: Boolean(this.$props.value)
    }
  },
  watch: {
    localValue(newValue) {
      this.$emit('value:change', { value: Boolean(newValue), pin: this.pin })
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
.dread-control {
  flex: 1;
  position: relative;
}

.pin-number {
  position: absolute;
  color: #fff;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  z-index: 15;

  &.left {
    left: 22%;
  }

  &.right {
    right: 20%;
  }
}
</style>
