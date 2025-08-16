import { applicationCommand, Extension, option } from '@pikokr/command.ts'
import { CronJob } from 'cron'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  codeBlock,
  MessageFlags,
  type TextChannel,
} from 'discord.js'
import { Neis } from 'neis.ts'
import { logger } from '..'
import { config } from '../config'
import type Client from '../structures/Client'

class NeisExt extends Extension<Client> {
  private readonly neis = new Neis({
    logger: logger.getSubLogger({ name: 'NEIS' }),
    key: config.neisKey,
  })

  constructor() {
    super()

    CronJob.from({
      cronTime: '0 6 * * 1-5', // 6:00 on weekday
      timeZone: 'Asia/Seoul',
      onTick: () => this.sendNotification(new Date()),
      start: true,
    })
  }

  async sendNotification(date: Date) {
    const school = await this.neis.getSchoolOne({
      SCHUL_NM: '중동고등학교',
    })
    const meal = await this.neis.getMealOne({
      ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: school.SD_SCHUL_CODE,
      MLSV_YMD: date.toISOString().slice(0, 10).replace(/-/g, ''),
    })

    const channel = (await this.commandClient.discord.channels.fetch(
      config.channel,
    )) as TextChannel
    if (!channel || !channel.isSendable()) {
      this.logger.warn(`Channel ${config.channel} not found`)
      return
    }

    await channel.send({
      content: codeBlock('json', JSON.stringify(meal, null, 2)),
    })
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'test',
    description: 'Send a test notification',
  })
  async test(
    i: ChatInputCommandInteraction,
    @option({
      name: 'date',
      description: 'The date to send the notification for (YYYY-MM-DD)',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    dateYMD: string,
  ) {
    await i.deferReply({ flags: MessageFlags.Ephemeral })

    const parsedDate = new Date(dateYMD)
    if (Number.isNaN(parsedDate.getTime())) {
      i.editReply({
        content: 'Invalid date format. Please use YYYY-MM-DD.',
      })

      return
    }

    await this.sendNotification(parsedDate)
    i.editReply({
      content: `Test notification sent for ${dateYMD}.`,
    })
  }
}

export const setup = async () => new NeisExt()
