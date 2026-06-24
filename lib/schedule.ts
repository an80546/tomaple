export interface ScheduleBlock {
  id: number
  time: string
  title: string
  duration: string
  icon: string
  color: string
  bg: string
  tags: string[]
  done: boolean
  recurring?: boolean
  doneDates?: Record<string, boolean>
}

export type ScheduleByDate = Record<string, ScheduleBlock[]>

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateKey: string, days: number) {
  const date = fromDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function getBlocksForDate(
  dateBlocks: ScheduleByDate,
  dailyBlocks: ScheduleBlock[],
  dateKey: string,
) {
  const dailyForDate = dailyBlocks.map(block => ({
    ...block,
    recurring: true,
    done: Boolean(block.doneDates?.[dateKey]),
  }))

  return [...dailyForDate, ...(dateBlocks[dateKey] ?? [])]
    .sort((a, b) => a.time.localeCompare(b.time))
}
