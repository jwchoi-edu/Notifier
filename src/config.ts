import * as v from 'valibot'

const isDev = process.env.NODE_ENV === 'development'

const ConfigSchem = v.object({
  token: v.pipe(v.string(), v.regex(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g)),
  guilds: v.array(v.string()),
  dev: v.boolean(),
})

export const config = v.parse(ConfigSchem, {
  ...require(`../config${isDev ? '.dev' : ''}.json`),
  dev: isDev,
})
