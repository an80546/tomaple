const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekFocusData(dailyMinutes, baseDate = new Date()) {
  const monday = new Date(baseDate)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(baseDate.getDate() - ((baseDate.getDay() + 6) % 7))

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return toLocalDateKey(date)
  })

  const minutes = dates.map(dateKey => Number(dailyMinutes[dateKey] ?? 0))
  const max = Math.max(...minutes, 1)
  const heights = minutes.map(value => Math.max(value === 0 ? 8 : 18, Math.round((value / max) * 100)))

  return { dates, labels: WEEKDAYS, minutes, heights }
}
