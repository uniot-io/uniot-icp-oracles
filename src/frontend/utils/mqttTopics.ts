export const defaultDomain = 'PUBLIC_UNIOT'
export const MqttTopicDeviceStatus = '<domain>/users/<userId>/devices/<deviceId>/status'
export const MqttTopicDeviceScript = '<domain>/users/<userId>/devices/<deviceId>/script'
export const MqttTopicGroupEvent = '<domain>/users/<userId>/groups/<groupId>/event/<eventId>'

export function deviceStatusTopic(domain: string, userId: string, deviceId: string) {
  return MqttTopicDeviceStatus.replace('<domain>', domain).replace('<userId>', userId).replace('<deviceId>', deviceId)
}

export function deviceScriptTopic(domain: string, userId: string, deviceId: string) {
  return MqttTopicDeviceScript.replace('<domain>', domain).replace('<userId>', userId).replace('<deviceId>', deviceId)
}

export function parseDeviceTopic(topic: string) {
  const topicSubstrings = topic.split('/')
  return {
    domain: topicSubstrings[0],
    userId: topicSubstrings[2],
    deviceId: topicSubstrings[4]
  }
}

export function groupEventTopic(domain: string, userId: string, groupId: string, eventId: string) {
  return MqttTopicGroupEvent.replace('<domain>', domain)
    .replace('<userId>', userId)
    .replace('<groupId>', groupId)
    .replace('<eventId>', eventId)
}
