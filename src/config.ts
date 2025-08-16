import * as v from 'valibot'

const isDev = process.env.NODE_ENV === 'development'

const ConfigSchema = v.object({
  token: v.pipe(v.string(), v.regex(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g)),
  neisKey: v.pipe(v.string(), v.regex(/[0-9a-f]{32}/g)),
  channel: v.string(),
  guilds: v.array(v.string()),
  dev: v.boolean(),
})

export const config = v.parse(ConfigSchema, {
  ...require(`../config${isDev ? '.dev' : ''}.json`),
  dev: isDev,
})
