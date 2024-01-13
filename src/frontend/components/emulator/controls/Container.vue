<template>
  <div
    class="controls-container is-flex justify-start items-center my-1 mx-4 px-4 py-1"
    :class="{ warning: !!warning }"
  >
    <span class="mr-6">
      {{ name }}
    </span>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ControlsContainer',

  props: {
    name: {
      type: String,
      default: null
    },
    warning: {
      type: Boolean,
      default: null
    }
  }
}
</script>

<style lang="scss" scoped>
.controls-container {
  border: 1px solid #e9ebf5; // $dividers
  border-radius: 0.5rem;
  height: 5.5rem;
  position: relative;
  user-select: none;

  &.empty {
    opacity: 0.7;
    pointer-events: none;
    user-select: none;
  }

  &.warning {
    border-color: hsl(48, 100%, 67%);
  }

  span {
    font-weight: 400;
  }
}
</style>
