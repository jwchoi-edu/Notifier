export const toTimestamp = (data: number | Date) =>
  ((data instanceof Date ? data.getTime() : data) / 1000).toFixed(0)

export const calculateDDay = (date: Date, today = new Date()) => {
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export const formatDate = (date: Date) => {
  return date.toISOString().slice(0, 10)
}

export const formatDatePretty = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${date.toLocaleString('ko-KR', { weekday: 'short' })})`
}
