import type { Logger } from 'tslog'
import * as v from 'valibot'

const CalendarJSON = v.object({
  events: v.array(
    v.object({
      type: v.string(),
      name: v.string(),
      start_date: v.pipe(
        v.string(),
        v.transform((date) => new Date(date)),
      ),
      end_date: v.pipe(
        v.string(),
        v.transform((date) => new Date(date)),
      ),
      'D-Day': v.boolean(),
    }),
  ),
})

const calendarJSON = v.parse(CalendarJSON, require('../../calendar.json'))

export type CalendarEvent = Pick<
  (typeof calendarJSON.events)[number],
  'type' | 'name'
>
export type DDay = {
  date: Date
  name: string
}

export default class Calendar {
  private readonly dates: Record<string, CalendarEvent[]> = {}
  private readonly dDayEvents: DDay[] = []
  private readonly logger: Logger<unknown>

  constructor(config: {
    logger: Logger<unknown>
  }) {
    this.logger = config.logger.getSubLogger({
      name: 'Calendar',
    })

    for (const event of calendarJSON.events) {
      if (event['D-Day']) {
        this.dDayEvents.push({ date: event.start_date, name: event.name })
      }

      const current = new Date(event.start_date)
      const end = new Date(event.end_date)
      while (current <= end) {
        const key = current.toISOString().split('T')[0]
        if (!this.dates[key]) this.dates[key] = []
        this.dates[key].push({
          type: event.type,
          name: event.name,
        })

        current.setDate(current.getDate() + 1)
      }
    }

    this.logger.debug('Calendar initialized', {
      dates: this.dates,
      dDayEvents: this.dDayEvents,
    })
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.dates[date.toISOString().split('T')[0]] || []
  }

  getDDays(date: Date): DDay[] {
    return this.dDayEvents.filter((dday) => dday.date >= date)
  }
}
