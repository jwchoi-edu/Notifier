import { applicationCommand, Extension, listener } from '@pikokr/command.ts'
import type {
  CommandInteractionOption,
  GuildBasedChannel,
  Interaction,
  Message,
} from 'discord.js'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js'
import { blue, bold, green, yellow } from 'picocolors'
import { ownerOnly } from '../checks/owner'
import { Emojis } from '../constants'
import { Eval, Info, Reload, Sync } from '../embeds/Dev'
import type CustomClient from '../structures/Client'
import { KnownError } from '../structures/Error'
import { inspect } from '../utils/object'

const commandLog = (data: CommandInteractionOption, indents = 0) =>
  `\n${' '.repeat(indents * 2)}- ${green(data.name)}: ${blue(
    data.value?.toString(),
  )} (${yellow(ApplicationCommandOptionType[data.type])})`

class Dev extends Extension<CustomClient> {
  @listener({ event: 'applicationCommandInvokeError', emitter: 'cts' })
  async errorLogger(err: Error) {
    if (err instanceof KnownError) return this.logger.warn(err.message)

    this.logger.error(err.stack)
  }

  @listener({ event: 'interactionCreate' })
  async commandLogger(i: Interaction) {
    if (!i.isChatInputCommand()) return

    const options = i.options.data.map((data) =>
      data.type !== ApplicationCommandOptionType.Subcommand
        ? commandLog(data)
        : `\n- ${green(data.name)}: (${yellow('Subcommand')})${data.options?.map((x) => commandLog(x, 1))}`,
    )

    const guild = i.guild
      ? `${green(`#${(i.channel as GuildBasedChannel).name}`)}(${blue(
          i.channelId,
        )}) at ${green(i.guild.name)}(${blue(i.guild.id)})`
      : 'DM'

    const msg = `${green(i.user.tag)}(${blue(
      i.user.id,
    )}) in ${guild}: ${bold(yellow(`/${i.commandName}`))}${options}`

    this.logger.info(msg)
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'reload',
    description: '[OWNER] Reload all modules',
  })
  async reload(i: ChatInputCommandInteraction) {
    await i.deferReply({
      flags: MessageFlags.Ephemeral,
    })

    const modules = await this.commandClient.registry.reloadModules()

    i.editReply({
      embeds: [Reload.result(modules)],
    })
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'sync',
    description: '[OWNER] Sync commands',
  })
  async sync(i: ChatInputCommandInteraction) {
    await i.deferReply({
      flags: MessageFlags.Ephemeral,
    })

    await this.commandClient.getApplicationCommandsExtension()?.sync()

    i.editReply({
      embeds: [Sync.success()],
    })
  }

  @listener({ event: 'messageCreate' })
  async eval(msg: Message) {
    if (!this.commandClient.owners.has(msg.author.id)) return

    if (!msg.content.startsWith(`<@${this.client.user?.id}> eval`)) return

    const code = msg.content
      .split(' ')
      .slice(2)
      .join(' ')
      .replace(/```(js|ts)?/g, '')
      .trim()

    // biome-ignore lint/suspicious/noExplicitAny: return type of eval() is any
    let res: any
    try {
      // biome-ignore lint/correctness/noUnusedVariables: evaluation alias
      const { cts, client } = {
        cts: this.commandClient,
        client: this.client,
      }

      // biome-ignore lint/security/noGlobalEval: eval is used for debugging
      res = await eval(code)
    } catch (e) {
      await msg.react(Emojis.Fail)

      if (!(e instanceof Error)) throw e

      msg.reply({
        embeds: [Eval.error(code, e)],
        allowedMentions: { repliedUser: false },
      })

      return
    }

    await msg.react(Emojis.Success)
    const output = typeof res === 'string' ? res : inspect(res)
    msg.reply({
      embeds: [Eval.success(code, output)],
      allowedMentions: { repliedUser: false },
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Jump to message')
            .setURL(msg.url),
        ),
      ],
    })
  }

  @applicationCommand({
    name: 'info',
    type: ApplicationCommandType.ChatInput,
    description: 'Get bot info including latency',
  })
  async info(i: ChatInputCommandInteraction) {
    await i.deferReply({
      flags: MessageFlags.Ephemeral,
    })

    const latency = this.commandClient.discord.ws.ping

    i.editReply({
      embeds: [Info.default(this.commandClient.startedAt, latency, process)],
    })
  }
}

export const setup = async () => new Dev()
