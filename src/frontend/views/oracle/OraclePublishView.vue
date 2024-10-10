<template>
  <el-card class="full-width" shadow="never" style="border: none" body-class="flex-card-container">
    <el-scrollbar style="padding-right: 20px">
      <el-form ref="formRef" :model="form" label-position="top" v-loading="false" style="max-width: 800px">
        <el-form-item label="Topic" prop="topic" :rules="rules.topic" class="mb-2">
          <el-input v-model="form.topic" placeholder="Example: home/living-room/temperature">
            <template #prepend>
              <el-select v-model="form.msgType" style="width: 115px">
                <el-option
                  v-for="messageType in MqttMessageTypes"
                  :key="messageType"
                  :label="messageType"
                  :value="messageType"
                />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item class="mb-2">
          <el-checkbox v-model="form.signed" label="Sign using canister's Threshold ECDSA Key" size="large" />
        </el-form-item>
        <el-form-item label="Message" prop="message" :rules="rules.message" size="large">
          <code-editor v-model:value="form.message" :language="editorLanguage" @validate:value="onValidateEditor" />
        </el-form-item>
        <el-row class="row-bg mt-5" justify="end">
          <el-button :disabled="!codeValid" type="primary" @click="submit(formRef)">Publish</el-button>
        </el-row>
      </el-form>
    </el-scrollbar>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { FormRules, FormInstance } from 'element-plus'
import { OraclePublication, OracleTopic } from '@/types/oracle'
import { MqttMessageTypes } from '@/types/mqtt'

import CodeEditor from '@/components/CodeEditor.vue'

type GenericOracleCreateViewEmits = {
  (e: 'submit', event: OraclePublication): Promise<void>
}

interface RuleForm {
  topic: OracleTopic
  message: string
}

const emit = defineEmits<GenericOracleCreateViewEmits>()
const rules = reactive<FormRules<RuleForm>>({
  topic: [
    { required: true, message: 'Topic can not be empty', trigger: 'blur' },
    { pattern: /^[^#+]+$/, message: 'Topic can not be wildcard', trigger: 'blur' }
  ]
})

const form = reactive<OraclePublication>({
  topic: '',
  msgType: MqttMessageTypes[0],
  message: '',
  signed: false
})
const formRef = ref<FormInstance>()
const codeValid = ref(true)

const editorLanguage = computed(() => {
  const msgType = form.msgType.toLocaleLowerCase()
  if (['json', 'cbor', 'cose'].includes(msgType)) return 'json'
  return 'plaintext'
})

function onValidateEditor(valid: boolean) {
  codeValid.value = valid
}

async function submit(formEl: FormInstance | undefined) {
  try {
    formEl?.clearValidate()
    if (await formEl?.validate()) {
      await emit('submit', form)
    }
  } catch (_) {
    // TODO: show alert that message can not be parsed
  }
}
</script>
