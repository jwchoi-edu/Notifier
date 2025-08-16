export const toTimestamp = (data: number | Date) =>
  ((data instanceof Date ? data.getTime() : data) / 1000).toFixed(0)

export const calculateDDay = (date: Date, today = new Date()) => {
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
