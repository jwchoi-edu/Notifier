import type { Logger } from 'tslog'
import * as v from 'valibot'
import { formatDate } from '../utils/time'

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
  private dates: Record<string, CalendarEvent[]> = {}
  private dDayEvents: DDay[] = []
  private readonly logger: Logger<unknown>

  constructor(config: {
    logger: Logger<unknown>
  }) {
    this.logger = config.logger.getSubLogger({
      name: 'Calendar',
    })

    this.loadEvents()
  }

  loadEvents() {
    const data = v.parse(CalendarJSON, require('../../calendar.json'))
    for (const event of data.events) {
      if (event['D-Day'])
        this.dDayEvents.push({ date: event.start_date, name: event.name })

      const current = new Date(event.start_date)
      const end = new Date(event.end_date)

      while (current <= end) {
        const key = formatDate(current)
        if (!this.dates[key]) this.dates[key] = []
        this.dates[key].push({
          type: event.type,
          name: event.name,
        })

        current.setDate(current.getDate() + 1)
      }
    }

    this.logger.debug('Event loaded', {
      dates: this.dates,
      dDayEvents: this.dDayEvents,
    })
  }

  getEventsForDate(date: Date) {
    return this.dates[formatDate(date)] || []
  }

  getEventsForWeekly(date: Date) {
    // runs on saturday, returns every events in the next weekday
    const nextSaturday = new Date(date)
    nextSaturday.setDate(date.getDate() + 7)

    const result: Record<string, CalendarEvent[]> = {}
    for (
      let cur = new Date(date);
      cur < nextSaturday;
      cur.setDate(cur.getDate() + 1)
    ) {
      this.logger.debug('Checking date:', cur)
      const currentDate = new Date(cur)
      const events = this.getEventsForDate(currentDate)
      if (events.length > 0) result[formatDate(currentDate)] = events
    }

    this.logger.debug('weekly events:', result)

    return result
  }

  getDDays(date: Date): DDay[] {
    return this.dDayEvents.filter((dday) => dday.date >= date)
  }
}
