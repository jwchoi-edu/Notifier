import type { MealServiceDietInfoResponse } from 'neis.ts'
import { Colors } from '../constants'
import type { CalendarEvent, DDay } from '../structures/Calendar'
import CustomEmbed from '../structures/Embed'
import { calculateDDay } from '../utils/time'

const RegExps = {
  AllergicCodes: /\((1?\d+)(\.1?\d+)*\)$/,
  Strip: / +$/,
  Dummy: /(#)/g, // TODO: add more dummy values
} as const

export const Daily = {
  meal: (value: {
    school: string
    today: Date
    meals: MealServiceDietInfoResponse[] | null
  }) => {
    const { school, today, meals } = value
    if (!meals)
      return new CustomEmbed({
        title: `${school} - ${today.toISOString().slice(0, 10)} 급식`,
        description: '급식 데이터가 없습니다.',
        color: Colors.Red,
      })
    return new CustomEmbed({
      title: `${school} - ${today.toISOString().slice(0, 10)} 급식`,
    }).addFields(
      meals
        ? meals.map((meal) => ({
            name: meal.MMEAL_SC_NM,
            value: meal.DDISH_NM.split('<br/>')
              .map((x) =>
                x
                  .replace(RegExps.AllergicCodes, '')
                  .replace(RegExps.Strip, '')
                  .replace(RegExps.Dummy, ''),
              )
              .join('\n'),
          }))
        : [],
    )
  },
  event: (value: {
    school: string
    grade: number
    cls: number
    today: Date
    events: CalendarEvent[]
    ddays: DDay[]
  }) => {
    const { school, grade, cls, today, events, ddays } = value

    const eventPerType: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      if (!eventPerType[event.type]) eventPerType[event.type] = []
      eventPerType[event.type].push(event)
    })

    const embed = new CustomEmbed({
      title: `${school} ${grade}학년 ${cls}반 - ${today.toISOString().slice(0, 10)} 일정`,
    })
    if (Object.entries(eventPerType).length > 0)
      embed.addFields(
        Object.entries(eventPerType).map(([type, events]) => ({
          name: type,
          value: events.map((event) => event.name).join('\n'),
        })),
      )
    else embed.setDescription('일정 데이터가 없습니다.')

    return embed.addFields({
      name: 'D-Day',
      value: ddays
        .map(
          (dday) =>
            `${dday.name} **D-${calculateDDay(dday.date, today) || 'DAY'}**`,
        )
        .join('\n'),
    })
  },
}
