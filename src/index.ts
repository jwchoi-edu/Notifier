import { GatewayIntentBits } from 'discord.js'
import { Logger } from 'tslog'
import { config } from './config'
import Client from './structures/Client'

export const logger = new Logger({
  name: 'Notifier',
  prettyLogTemplate:
    '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{name}}]\t',
  prettyLogTimeZone: 'local',
  minLevel: config.dev ? 2 : 3,
})

const client = new Client({
  logger,
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
})

client.start()

process
  .on('unhandledRejection', (err) => logger.error(err))
  .on('uncaughtException', (err) => logger.error(err))
  .on('warning', (warn) => logger.warn(warn))
