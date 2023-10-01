export const icpOracleSettingsTopic = (principal: string, type: 'generic' | 'uniot' | 'other') =>
  `icp/${principal}/oracles/${type}/settings`
