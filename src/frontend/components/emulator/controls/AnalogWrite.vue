<template>
  <div :id="`awrite-control-${pin}`" class="awrite-control">
    <svg class="w-full h-full" viewBox="0 0 50 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        class="indicator-bg"
        d="M50 30C50 43.8071 38.8071 55 25 55C11.1929 55 0 43.8071 0 30H12.5H25L37.5 30L50 30Z"
        :fill="indicatorColor"
      />
      <path d="M29.2312 0.319503L31.1674 0.70464L30.3971 4.57706L28.4609 4.19192L29.2312 0.319503Z" fill="#CFD3E4" />
      <path d="M46.611 11.0237L47.7078 12.6652L44.4249 14.8587L43.3282 13.2173L46.611 11.0237Z" fill="#CFD3E4" />
      <path d="M9.37279 5.03987L11.0142 3.9431L13.2078 7.22598L11.5663 8.32275L9.37279 5.03987Z" fill="#CFD3E4" />
      <path d="M6.6717 13.2173L5.57493 14.8588L2.29205 12.6652L3.38882 11.0238L6.6717 13.2173Z" fill="#CFD3E4" />
      <path d="M38.9856 3.94311L40.6271 5.03989L38.4335 8.32277L36.7921 7.226L38.9856 3.94311Z" fill="#CFD3E4" />
      <path d="M18.8324 0.704677L20.7686 0.319541L21.5389 4.19196L19.6027 4.5771L18.8324 0.704677Z" fill="#CFD3E4" />
      <path d="M4.40321 17.0511L3.64774 18.8749L0 17.364L0.755473 15.5401L4.40321 17.0511Z" fill="#CFD3E4" />
      <path d="M34.2869 1.65093L36.1108 2.4064L34.5999 6.05414L32.776 5.29867L34.2869 1.65093Z" fill="#CFD3E4" />
      <path d="M49.2445 15.5401L50 17.364L46.3523 18.8749L45.5968 17.0511L49.2445 15.5401Z" fill="#CFD3E4" />
      <path d="M13.8892 2.40641L15.7131 1.65094L17.224 5.29868L15.4001 6.05415L13.8892 2.40641Z" fill="#CFD3E4" />
      <path d="M9.64467 9.89976L8.24874 11.2957L5.45687 8.50383L6.85281 7.1079L9.64467 9.89976Z" fill="#CFD3E4" />
      <path d="M43.147 7.1079L44.5429 8.50383L41.7511 11.2957L40.3551 9.89977L43.147 7.1079Z" fill="#CFD3E4" />
      <path d="M24.0128 0H25.987V3.94829H24.0128V0Z" fill="#CFD3E4" />
    </svg>
    <svg class="indicator" viewBox="0 0 10 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g xmlns="http://www.w3.org/2000/svg" transform="matrix(-1 0 0 -1 10 28)">
        <path d="M3.5 9.53674e-07L6.5 1.10738e-07L6.5 23L3.5 23L3.5 9.53674e-07Z" :fill="indicatorColor" />
      </g>
    </svg>
    <svg class="indicator-base" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="5" :fill="indicatorColor" />
    </svg>
    <span class="pin-number">{{ pin }}</span>
  </div>
</template>

<script>
export default {
  name: 'EmulatorComponent',

  props: {
    dragging: {
      type: Boolean,
      default: false
    },
    pin: {
      type: Number,
      default: null
    },
    value: {
      type: Number,
      default: null
    },
    terminated: Boolean
  },

  data() {
    return {
      isMoving: false,
      center: {
        x: 0,
        y: 0
      },
      localValue: this.value
    }
  },

  computed: {
    indicatorColor() {
      return this.localValue > 0 ? '#4c68fc' : '#303340'
    }
  },

  watch: {
    value(newValue) {
      this.localValue = newValue
      this.changeIndicator(newValue)
    },
    terminated(newValue) {
      if (newValue) {
        this.localValue = 0
        this.changeIndicator(0)
      }
    }
  },

  mounted() {
    this.$nextTick(this.prepareLayout)
  },

  methods: {
    prepareLayout() {
      const container = document.querySelector(`#awrite-control-${this.$props.pin}`)
      const indicator = container.querySelector('.indicator')
      const indicatorBase = container.querySelector('.indicator-base')
      const indicatorBg = container.querySelector('.indicator-bg')

      indicator.style.transform = 'none'

      const indicatorBgRect = indicatorBg.getBoundingClientRect()
      let indicatorRect = indicator.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const indicatorBaseSize = indicatorBgRect.width / 6
      const indicatorBaseBottom = indicatorBgRect.height - indicatorBaseSize / 2
      const indicatorBaseLeft = containerRect.width / 2 - indicatorBaseSize / 2
      indicatorBase.style.width = `${indicatorBaseSize}px`
      indicatorBase.style.height = `${indicatorBaseSize}px`
      indicatorBase.style.bottom = `${indicatorBaseBottom}px`
      indicatorBase.style.left = `${indicatorBaseLeft}px`

      const indicatorLeft = containerRect.width / 2 - indicatorRect.width / 2
      const indicatorBottom = indicatorBgRect.height

      indicator.style.left = `${indicatorLeft}px`
      indicator.style.bottom = `${indicatorBottom}px`
      indicatorRect = indicator.getBoundingClientRect()
      indicator.style.transform = 'rotate(-60deg)'

      this.center.x = indicatorRect.left + indicatorRect.width / 2
      this.center.y = indicatorRect.bottom
    },

    onMoveIndicator() {
      document.addEventListener('mouseup', () => {
        document.documentElement.style.userSelect = 'auto'
        document.removeEventListener('mousemove', this.moveIndicator)
      })

      document.documentElement.style.userSelect = 'none'
      document.addEventListener('mousemove', this.moveIndicator)
    },

    changeIndicator(value) {
      const angle = Math.round((120 * value) / 1024) + 30
      const limitedAngle = Math.max(30, Math.min(150, angle))
      const container = document.querySelector(`#awrite-control-${this.pin}`)
      const indicator = container.querySelector('.indicator')
      indicator.style.transform = `rotate(${limitedAngle - 90}deg)`
    },

    moveIndicator(e) {
      const container = document.querySelector(`#awrite-control-${this.pin}`)
      const indicator = container.querySelector('.indicator')
      const mouseY = e.clientY
      const mouseX = e.clientX

      if (mouseY <= this.center.y) {
        const angle = Math.atan2((mouseY - this.center.y) * -1, (mouseX - this.center.x) * -1) * (180 / Math.PI)

        const limitedAngle = Math.max(30, Math.min(150, angle))
        indicator.style.transform = `rotate(${limitedAngle - 90}deg)`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.awrite-control {
  position: relative;
  width: 60px;
  height: 65px;
}

.indicator {
  position: absolute;
  height: 50%;
  z-index: 10;
  transform-origin: 50% 100%;
}

.indicator-base {
  position: absolute;
  z-index: 11;
}

.pin-number {
  position: absolute;
  color: #fff;
  left: 50%;
  bottom: 9%;
  transform: translateX(-50%);
  font-size: 0.75rem;
}
</style>
