import { applicationCommand, Extension, option } from '@pikokr/command.ts'
import { CronJob } from 'cron'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  MessageFlags,
  type TextChannel,
} from 'discord.js'
import { DataNotFoundError, Neis } from 'neis.ts'
import { logger } from '..'
import { ownerOnly } from '../checks/owner'
import { config } from '../config'
import { Daily } from '../embeds/Notify'
import Calendar from '../structures/Calendar'
import type Client from '../structures/Client'

class Notify extends Extension<Client> {
  private readonly neis = new Neis({
    logger: logger.getSubLogger({ name: 'NEIS' }),
    key: config.neisKey,
  })
  private readonly calendar = new Calendar({
    logger,
  })

  constructor() {
    super()

    CronJob.from({
      cronTime: '0 6 * * 1-5', // 6:00 on weekday
      timeZone: 'Asia/Seoul',
      onTick: () => this.sendDaily(new Date()),
      start: true,
    })
  }

  async sendDaily(date: Date) {
    const school = await this.neis.getSchoolOne({
      SCHUL_NM: '중동고등학교',
    })
    const meals = await this.neis
      .getMeal({
        ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
        SD_SCHUL_CODE: school.SD_SCHUL_CODE,
        MLSV_YMD: date.toISOString().slice(0, 10).replace(/-/g, ''),
      })
      .catch((err) => {
        if (err instanceof DataNotFoundError) return null
        else throw err
      })

    this.logger.debug('meals:', meals)

    const channel = (await this.commandClient.discord.channels.fetch(
      config.channel,
    )) as TextChannel
    if (!channel || !channel.isSendable()) {
      this.logger.warn(`Channel ${config.channel} not found`)
      return
    }

    await channel.send({
      embeds: [
        Daily.meal({
          school: school.SCHUL_NM,
          today: date,
          meals: meals,
        }),
        Daily.event({
          school: school.SCHUL_NM,
          grade: 1,
          cls: 11,
          today: date,
          events: this.calendar.getEventsForDate(date),
          ddays: this.calendar.getDDays(date),
        }),
      ],
    })
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'test',
    description: '[OWNER] Send a test notification',
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

    await this.sendDaily(parsedDate)
    i.editReply({
      content: `Test notification sent for ${dateYMD}.`,
    })
  }
}

export const setup = async () => new Notify()
