import { join } from 'node:path'
import { CommandClient } from '@pikokr/command.ts'
import type { GatewayIntentBits, Partials } from 'discord.js'
import { Client as DJSClient, Events } from 'discord.js'
import { green } from 'picocolors'
import type { Logger } from 'tslog'
import { config } from '../config'

export default class Client extends CommandClient {
  readonly startedAt = Date.now()

  constructor(config: {
    logger: Logger<unknown>
    intents: GatewayIntentBits[]
    partials?: Partials[]
  }) {
    const { logger, intents, partials } = config

    super(
      new DJSClient({
        intents,
        partials: partials ?? [],
      }),
      logger,
    )

    this.discord.once(Events.ClientReady, (client) =>
      this.onClientReady(client),
    )

    const dJSLogger = this.logger.getSubLogger({
      name: 'discord.js',
    })
    this.discord.on(Events.Debug, (msg) => dJSLogger.debug(msg))
  }

  async setup() {
    await this.enableApplicationCommandsExtension({
      guilds: config.guilds.length > 0 ? config.guilds : undefined,
    })

    await this.registry.loadAllModulesInDirectory(
      join(__dirname, '..', 'modules'),
    )
  }

  async onClientReady(client: DJSClient<true>) {
    this.logger.info(`Logged in as: ${green(client.user.tag)}`)

    await this.fetchOwners()
  }

  async start() {
    await this.setup()

    await this.discord.login(config.token)

    await this.getApplicationCommandsExtension()?.sync()
  }
}
