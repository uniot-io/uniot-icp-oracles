<template>
  <div id="emulator" class="emulator">
    <div v-if="!available" class="overlay">
      <span>Emulator currently available<br />for the generic devices only</span>
    </div>
    <div class="emulator-body is-flex">
      <div class="emulator-content is-flex flex-col items-start">
        <controls-container
          v-for="primitive in data"
          :key="primitive.type"
          :name="primitive.name"
          :class="{ empty: !primitive.pins.length }"
        >
          <component
            :is="primitive.component"
            v-for="pin in primitive.pins"
            :key="pin"
            :pin="pin"
            :value="state[primitive.type]?.[pin]"
            :terminated="terminated"
            class="mx-4"
            @value:change="(params: ControlEmitData) => onChangeValue({ ...params, primitive: primitive.type })"
          />
          <component :is="primitive.component" v-if="!primitive.pins.length" class="mx-4" />
        </controls-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw, nextTick, onBeforeUnmount, computed, watchEffect } from 'vue'
import * as CBOR from 'cbor-web'
import { useMqttStore } from '@/store/MqttStore'
import { initLineNumbersOnLoad } from '@/utils/highlightjs-line-numbers'
import { PREDEFINED_LIBRARY } from '@/utils/lisp/library'
import { lispExecute, lispTerminate, lispMinimalHandler } from '@/utils/lisp'
import { groupEventTopic as getGroupEventTopic, defaultDomain } from '@/utils/mqttTopics'
import { decodeIntoJSON } from '@/utils/msgDecoder'
import ControlsContainer from './controls/Container.vue'
import ARead from './controls/AnalogRead.vue'
import AWrite from './controls/AnalogWrite.vue'
import DRead from './controls/DigitalRead.vue'
import DWrite from './controls/DigitalWrite.vue'
import BClicked from './controls/ButtonClicked.vue'
import { UniotDevicePrimitives } from '@/types/uniot'
import { MqttMessageUniotDeviceEvent, MqttMessageTypes } from '@/types/mqtt'
import type {
  ControlEmitData,
  EmulatorEmits,
  AvailablePrimitivesType,
  EmulatorViewPropsType,
  EmulatorStateType,
  EmulatorDataType
} from './types'
import { useUniotStore } from '@/store/UniotStore'

const AnalogRead = markRaw(ARead)
const AnalogWrite = markRaw(AWrite)
const DigitalRead = markRaw(DRead)
const DigitalWrite = markRaw(DWrite)
const ButtonClicked = markRaw(BClicked)

const AVAILABLE_PRIMITIVES: Record<UniotDevicePrimitives, AvailablePrimitivesType> = {
  dwrite: {
    name: 'DigitalWrite',
    component: DigitalWrite,
    keyInDevice: 'd_out'
  },
  dread: {
    name: 'DigitalRead',
    component: DigitalRead,
    keyInDevice: 'd_in'
  },
  awrite: {
    name: 'AnalogWrite',
    component: AnalogWrite,
    keyInDevice: 'a_out'
  },
  aread: {
    name: 'AnalogRead',
    component: AnalogRead,
    keyInDevice: 'a_in'
  },
  bclicked: {
    name: 'ButtonClicked',
    component: ButtonClicked
  }
}

const props = defineProps<EmulatorViewPropsType>()
const emit = defineEmits<EmulatorEmits>()
defineExpose({
  terminate,
  emulate
})

const DEFAULT_STATE: EmulatorStateType = {
  awrite: {},
  aread: {},
  dwrite: {},
  dread: {},
  bclicked: {}
}
const state = ref<EmulatorStateType>(DEFAULT_STATE)
const data = ref<EmulatorDataType[]>([])
const events = new Map<string, number[]>()

const terminated = ref(false)

const uniotClient = useUniotStore()
const mqttClient = useMqttStore()

const groupEventTopic = computed(() => getGroupEventTopic(defaultDomain, uniotClient.userId, 'all', '#'))

onMounted(() => {
  PREDEFINED_LIBRARY.forEach((primitive) => {
    const primitiveName = primitive.name as UniotDevicePrimitives
    if (AVAILABLE_PRIMITIVES[primitiveName]) {
      data.value.push({
        type: primitiveName,
        name: AVAILABLE_PRIMITIVES[primitiveName].name,
        component: AVAILABLE_PRIMITIVES[primitiveName].component,
        pins: AVAILABLE_PRIMITIVES[primitiveName].keyInDevice
          ? Array.from(
              {
                length: props.device?.data[AVAILABLE_PRIMITIVES[primitiveName].keyInDevice!] ?? 0
              },
              (_, i) => i
            )
          : [0]
      })
    }
  })
})

onBeforeUnmount(() => {
  terminate()
})

watchEffect(() => {
  props.emulation ? emulate() : terminate()
})

async function subscribeEmulatorTopics() {
  try {
    await mqttClient.subscribe(groupEventTopic.value, onEmulatorMessage)
  } catch (error) {
    console.error(`failed to subscribe to topic: ${error}`)
  }
}

function onEmulatorMessage(topic: string, message: Buffer) {
  const data = decodeIntoJSON<MqttMessageUniotDeviceEvent>(message, MqttMessageTypes[0])
  if (events.has(data.eventID)) {
    const eventValues = events.get(data.eventID)!
    eventValues.push(data.value)
    if (eventValues.length > 5) eventValues.shift()
  } else {
    events.set(data.eventID, [data.value])
  }
}

function onChangeValue(data: ControlEmitData & { primitive: UniotDevicePrimitives }) {
  state.value[data.primitive][data.pin] = data.value
}

async function updateLog(log: string) {
  emit('update:log', log)
  await nextTick()
  initLineNumbersOnLoad()
}

async function terminate() {
  state.value = DEFAULT_STATE
  events.clear()
  await mqttClient.unsubscribe(groupEventTopic.value)
  terminated.value = true
}

async function emulate() {
  state.value = DEFAULT_STATE
  terminated.value = false
  await subscribeEmulatorTopics()
  await updateLog(JSON.stringify({ states: [] }, null, 2))
  const { error, output } = await lispExecute(props.script, emulatorHandler)
  await updateLog(error || JSON.stringify(output, null, 2))
  emit('update:emulation', false)
}

async function emulatorHandler(value: string) {
  const timeout = (ms: number) => {
    if (!terminated.value) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    } else {
      return 0
    }
  }

  if (terminated.value) {
    lispTerminate()
    return lispMinimalHandler(value)
  }

  const toBool: Record<string, boolean> = {
    '#t': true,
    '()': false
  }
  const fromBool = {
    true: '#t',
    false: '()'
  }
  const ask = value.split(' ')
  const fn = ask[0]
  let answer: string = '()'
  switch (fn) {
    case 'awrite': {
      const pin = Number(ask[1])
      const value = ask[2] === '()' ? 0 : Number(ask[2])
      state.value.awrite[pin] = value
      break
    }
    case 'aread': {
      const pin = Number(ask[1])
      answer = state.value.aread[pin]?.toString() || '0'
      break
    }
    case 'dwrite': {
      const pin = Number(ask[1])
      let value = ask[2] === fromBool.true || ask[2] === fromBool.false ? Number(toBool[ask[2]]) : Number(ask[2])
      value = isNaN(value) ? 0 : value
      state.value.dwrite[pin] = Boolean(value)
      answer = ask[2]
      break
    }
    case 'dread': {
      const pin = Number(ask[1])
      answer = state.value.dread[pin] ? '#t' : '()'
      break
    }
    case 'bclicked': {
      const pin = Number(ask[1])
      answer = state.value.bclicked[pin] ? '#t' : '()'
      state.value.bclicked[pin] = false
      break
    }
    case 'is_event': {
      const event = ask[1]
      answer = events.has(event) ? fromBool.true : fromBool.false
      break
    }
    case 'push_event': {
      const event = ask[1]
      const topic = getGroupEventTopic(defaultDomain, uniotClient.userId, 'all', event)
      const value = ask[2] === fromBool.true || ask[2] === fromBool.false ? Number(toBool[ask[2]]) : Number(ask[2])
      const message = CBOR.encode({
        eventID: event,
        value,
        sender: {
          type: 'emulator',
          id: uniotClient.userId
        },
        timestamp: Date.now()
      })
      await mqttClient.publish(topic, message)
      break
    }
    case 'pop_event': {
      const event = ask[1]
      const eventValues = events.get(event)!
      const value = eventValues.shift()
      if (!eventValues.length) events.delete(event)
      answer = isNaN(Number(value)) ? '0' : value!.toString()
      break
    }
    case 'task':
      await timeout(Number(ask[2]))
      answer = ask[3]
      break
    default:
      answer = '()'
      break
  }
  answer = String(answer)

  const output = JSON.parse(props.log)
  if (output) {
    output.states.push({ ask: value, answer })
    if (output.states.length > 12) {
      output.states.shift()
    }
    await updateLog(JSON.stringify(output, null, 2))
  }

  return answer
}
</script>

<style lang="scss" scoped>
.emulator {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 0.5rem;
  overflow: auto;
  position: relative;

  $header_height: 2.25rem;

  .overlay {
    background-color: rgba(255, 255, 255, 0.7);
    position: absolute;
    z-index: 100;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(8px);
    user-select: none;
    text-align: center;
    font-size: 1.5em;
    font-weight: 600;
  }

  .emulator-header {
    cursor: move;
    width: 100%;
    background-color: hsl(229, 17%, 86%);
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 81;
    height: $header_height;

    button {
      background: transparent;
      cursor: pointer;
      border: 0;
      position: relative;
      color: inherit;
    }
  }

  .emulator-body {
    height: 100%;
    width: 100%;

    .emulator-content {
      margin: 0 auto;
    }
  }
}
</style>
./types
