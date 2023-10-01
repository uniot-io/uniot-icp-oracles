<template>
  <el-card class="full-width" shadow="never" style="border: none; max-width: 800px">
    <el-form ref="formRef" :model="form" label-position="top" v-loading="false">
      <el-form-item label="Oracle name" :prop="'name'" :rules="rules.name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item
        v-for="(topic, index) in form.topics"
        :key="index"
        :label="`Topic #${index + 1}`"
        :prop="`topics.${index}.name`"
        :rules="rules.topics"
      >
        <el-col :span="16">
          <el-form-item>
            <el-input class="full-width" v-model="topic.name" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item required>
            <el-select class="full-width" v-model="topic.settings.messageType" default-first-option>
              <el-option
                v-for="messageType in MqttMessageTypes"
                :key="messageType"
                :label="messageType"
                :value="messageType"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-button class="full-width" @click.prevent="removeTopic(index)">Delete</el-button>
        </el-col>
      </el-form-item>
      <el-form-item>
        <el-button @click="addTopic">Add topic</el-button>
      </el-form-item>
      <el-form-item size="large">
        <el-button type="primary" @click="submit(formRef)">Create</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { FormRules, FormInstance } from 'element-plus'
import { OracleSettings, OracleTopics } from '@/types/oracle'
import { MqttMessageTypes } from '@/types/mqtt'

type GenericOracleCreateViewEmits = {
  (e: 'submit', oracles: OracleSettings): Promise<void>
}

interface RuleForm {
  name: string
  topics: OracleTopics[]
}

const emit = defineEmits<GenericOracleCreateViewEmits>()
const rules = reactive<FormRules<RuleForm>>({
  name: [{ required: true, message: 'Oracle name can not be empty', trigger: 'blur' }],
  topics: [
    { required: true, message: 'Topic name can not be empty', trigger: 'blur' },
    { pattern: /^[^#+]+$/, message: 'Topic name can not be wildcard', trigger: 'blur' }
  ]
})

const form = reactive<OracleSettings>({
  name: '',
  topics: [{ name: '', settings: { messageType: MqttMessageTypes[0] } }]
})
const formRef = ref<FormInstance>()

function addTopic() {
  form.topics.push({ name: '', settings: { messageType: MqttMessageTypes[0] } })
}

function removeTopic(index: number) {
  form.topics.splice(index, 1)
}

async function submit(formEl: FormInstance | undefined) {
  formEl?.clearValidate()
  if (formEl?.validate()) {
    await emit('submit', form)
  }
}
</script>
