<template>
  <el-card class="full-width" shadow="never" style="border: none" body-class="flex-card-container">
    <el-scrollbar style="padding-right: 20px">
      <el-form ref="formRef" :model="form" label-position="top" v-loading="false" style="max-width: 800px">
        <el-form-item label="Oracle Name" :prop="'name'" :rules="rules.name">
          <el-input placeholder="My First IoT Oracle" v-model="form.name" />
        </el-form-item>
        <el-form-item
          v-for="(topic, index) in form.topics"
          :key="index"
          :label="`Topic #${index + 1}`"
          :prop="`topics[${index}].topic`"
          :rules="rules.topics"
        >
          <el-input v-model="topic.topic" placeholder="Example: home/living-room/temperature">
            <template #prepend>
              <el-select v-model="topic.msgType" style="width: 115px">
                <el-option
                  v-for="messageType in MqttMessageTypes"
                  :key="messageType"
                  :label="messageType"
                  :value="messageType"
                />
              </el-select>
            </template>
            <template #append>
              <el-button :disabled="form.topics.length <= 1" @click.prevent="removeTopic(index)">Delete</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-row class="row-bg" justify="end">
          <el-button @click="addTopic">Add topic</el-button>
          <el-button type="primary" @click="submit(formRef)">Create</el-button>
        </el-row>
      </el-form>
    </el-scrollbar>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { FormRules, FormInstance } from 'element-plus'
import { OracleSettings, OracleTemplate, OracleTopic } from '@/types/oracle'
import { MqttMessageTypes } from '@/types/mqtt'

type GenericOracleCreateViewEmits = {
  (e: 'submit', oracles: OracleSettings): Promise<void>
}

interface RuleForm {
  name: string
  topics: OracleTopic[]
}

const emit = defineEmits<GenericOracleCreateViewEmits>()
const rules = reactive<FormRules<RuleForm>>({
  name: [{ required: true, message: 'Oracle name can not be empty', trigger: 'blur' }],
  topics: [
    { required: true, message: 'Topic can not be empty', trigger: 'blur' },
    { pattern: /^[^#+]+$/, message: 'Topic can not be wildcard', trigger: 'blur' }
  ]
})

const form = reactive<OracleSettings>({
  name: '',
  template: OracleTemplate.generic,
  topics: [{ topic: '', msgType: MqttMessageTypes[0] }]
})
const formRef = ref<FormInstance>()

function addTopic() {
  form.topics.push({ topic: '', msgType: MqttMessageTypes[0] })
}

function removeTopic(index: number) {
  form.topics.splice(index, 1)
}

async function submit(formEl: FormInstance | undefined) {
  try {
    formEl?.clearValidate()
    if (await formEl?.validate()) {
      await emit('submit', form)
    }
  } catch (_) {
    //
  }
}
</script>
