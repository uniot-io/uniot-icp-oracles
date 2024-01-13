<template>
  <div class="editor-wrapper">
    <vue-monaco-editor
      :language="language"
      :options="OPTIONS"
      :onChange="onChange"
      height="200px"
      :onValidate="onValidate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { editor } from 'monaco-editor/esm/vs/editor/editor.api'

interface CodeEditorProps {
  value: string
  language: string
  fontSize?: number
  lineNumbers?: 'on' | 'off'
  renderLineHighlight?: 'none' | 'line'
  scrollbarStatus?: 'auto' | 'visible' | 'hidden'
  useShadows?: boolean
  readOnly?: boolean
  theme?: 'vs' | 'vs-dark'
  wordWrap?: 'on' | 'off'
  lineNumbersMinChars?: number
}

interface CodeEditorEmits {
  (e: 'update:value', data: string): void
  (e: 'validate:value', valid: boolean): void
}

const props = withDefaults(defineProps<CodeEditorProps>(), {
  fontSize: 12,
  lineNumbers: 'off',
  renderLineHighlight: 'none',
  scrollbarStatus: 'auto',
  useShadows: false,
  readOnly: false,
  wordWrap: 'off',
  theme: 'vs',
  lineNumbersMinChars: 1
})
const emit = defineEmits<CodeEditorEmits>()

const OPTIONS = computed(
  (): editor.IStandaloneEditorConstructionOptions => ({
    value: props.value,
    fontSize: props.fontSize,
    readOnly: props.readOnly,
    lineNumbers: props.lineNumbers,
    lineNumbersMinChars: props.lineNumbersMinChars,
    renderLineHighlight: props.renderLineHighlight,
    wordWrap: props.wordWrap,
    theme: props.theme,
    scrollbar: {
      horizontal: props.scrollbarStatus,
      horizontalScrollbarSize: 8,
      vertical: props.scrollbarStatus,
      verticalScrollbarSize: 8,
      useShadows: props.useShadows,
      alwaysConsumeMouseWheel: false
    },
    smoothScrolling: true,
    scrollBeyondLastLine: false,
    matchBrackets: 'near',
    folding: false,
    lightbulb: {
      enabled: false
    },
    minimap: {
      enabled: false
    },
    tabSize: 2
  })
)

function onValidate(marker: editor.IMarker[]) {
  emit('validate:value', !marker.length)
}

function onChange(value: string) {
  emit('update:value', value)
}
</script>

<style lang="scss" scoped>
.editor-wrapper {
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  width: 100%;

  &.invalid {
    border-color: #f56c6c;
  }
}
</style>
