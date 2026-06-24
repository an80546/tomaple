'use client'
import { useEffect, useMemo, useState } from 'react'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { addDays, fromDateKey, getBlocksForDate, ScheduleBlock, ScheduleByDate, toDateKey } from '@/lib/schedule'
interface Habit {
  id: string
  icon: string
  label: string
  value?: number
  target?: number
  done?: boolean
  color: string
}

const INIT_BLOCKS: ScheduleBlock[] = []
const INIT_BLOCKS_BY_DATE: ScheduleByDate = {}
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const INIT_HABITS: Habit[] = [
  { id: 'water', icon: 'water_drop', label: '補充水分', value: 0, target: 8, color: 'secondary' },
  { id: 'meditation', icon: 'self_improvement', label: '冥想', done: false, color: 'tertiary' },
  { id: 'walk', icon: 'directions_walk', label: '散步', done: false, color: 'primary' },
]

export default function SchedulePage() {
  const todayKey = toDateKey(new Date())
  const today = new Date()
  const [blocksByDate, setBlocksByDate] = useLocalStorage<ScheduleByDate>('schedule-by-date', INIT_BLOCKS_BY_DATE)
  const [dailyBlocks, setDailyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule-daily', INIT_BLOCKS)
  const [legacyBlocks, setLegacyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule', INIT_BLOCKS)
  const [habits, setHabits] = useLocalStorage<Habit[]>('schedule-habits', INIT_HABITS)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ hour: '08', minute: '00', title: '', duration: '', tags: '', recurring: false })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const date = params.get('date')
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setSelectedDate(date)
      const parsed = fromDateKey(date)
      setCalendarYear(parsed.getFullYear())
      setCalendarMonth(parsed.getMonth())
    }
  }, [])

  useEffect(() => {
    if (legacyBlocks.length === 0) return
    if (window.localStorage.getItem('schedule-migrated-to-dates') === '1') return

    setBlocksByDate(current => ({
      ...current,
      [todayKey]: [...(current[todayKey] ?? []), ...legacyBlocks],
    }))
    setLegacyBlocks([])
    window.localStorage.setItem('schedule-migrated-to-dates', '1')
  }, [legacyBlocks, setBlocksByDate, setLegacyBlocks, todayKey])

  const selectedDateObject = fromDateKey(selectedDate)
  const dateStr = selectedDateObject.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
  const blocks = useMemo(() => getBlocksForDate(blocksByDate, dailyBlocks, selectedDate), [blocksByDate, dailyBlocks, selectedDate])

  const toggle = (block: ScheduleBlock) => {
    if (block.recurring) {
      setDailyBlocks(items => items.map(item => item.id === block.id
        ? { ...item, doneDates: { ...(item.doneDates ?? {}), [selectedDate]: !block.done } }
        : item
      ))
      return
    }

    setBlocksByDate(current => ({
      ...current,
      [selectedDate]: (current[selectedDate] ?? []).map(item => item.id === block.id ? { ...item, done: !item.done } : item),
    }))
  }

  const remove = (block: ScheduleBlock) => {
    if (block.recurring) {
      setDailyBlocks(items => items.filter(item => item.id !== block.id))
      return
    }

    setBlocksByDate(current => ({
      ...current,
      [selectedDate]: (current[selectedDate] ?? []).filter(item => item.id !== block.id),
    }))
  }
  const toggleHabit = (id: string) => setHabits(items => items.map(item => {
    if (item.id !== id) return item
    if (typeof item.value === 'number' && typeof item.target === 'number') {
      const nextValue = item.value >= item.target ? 0 : item.value + 1
      return { ...item, value: nextValue }
    }
    return { ...item, done: !item.done }
  }))

  const add = () => {
    if (!form.title.trim()) return
    const colors = ['primary', 'secondary', 'tertiary']
    const c = colors[Math.floor(Math.random() * 3)]
    const block: ScheduleBlock = {
      id: Date.now(), time: `${form.hour}:${form.minute}`, title: form.title.trim(),
      duration: form.duration || '60 分鐘', icon: 'event', color: c, bg: `${c}-container`,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), done: false,
      recurring: form.recurring,
      doneDates: form.recurring ? {} : undefined,
    }
    if (form.recurring) {
      setDailyBlocks(items => [...items, block])
    } else {
      setBlocksByDate(current => ({
        ...current,
        [selectedDate]: [...(current[selectedDate] ?? []), block],
      }))
    }
    setForm({ hour: '08', minute: '00', title: '', duration: '', tags: '', recurring: false })
    setShowForm(false)
  }

  const doneCount = blocks.filter(b => b.done).length
  const pct = blocks.length ? Math.round((doneCount / blocks.length) * 100) : 0
  const selectedIsToday = selectedDate === todayKey
  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDow = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7
  const calendarCells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(year => year - 1)
      setCalendarMonth(11)
      return
    }
    setCalendarMonth(month => month - 1)
  }

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(year => year + 1)
      setCalendarMonth(0)
      return
    }
    setCalendarMonth(month => month + 1)
  }

  const selectCalendarDay = (day: number) => {
    setSelectedDate(toDateKey(new Date(calendarYear, calendarMonth, day)))
  }

  const jumpToDate = (dateKey: string) => {
    const date = fromDateKey(dateKey)
    setSelectedDate(dateKey)
    setCalendarYear(date.getFullYear())
    setCalendarMonth(date.getMonth())
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="ToMaple" subtitle="每日行程" />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6 md:px-8 md:py-8">
          <header className="mb-6">
            <p className="text-tertiary font-semibold tracking-widest uppercase text-xs mb-1">{dateStr}</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-on-surface font-headline">{selectedIsToday ? '今日行程' : '預排行程'}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => jumpToDate(addDays(selectedDate, -1))}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                    前一天
                  </button>
                  <span className="rounded-lg bg-surface-container-low px-3 py-1.5 text-sm font-bold text-on-surface">
                    {selectedDate}
                  </span>
                  <button onClick={() => jumpToDate(addDays(selectedDate, 1))}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                    後一天
                  </button>
                  {!selectedIsToday && (
                    <button onClick={() => jumpToDate(todayKey)}
                      className="px-3 py-1.5 rounded-lg bg-primary-container/40 text-sm font-bold text-on-primary-container hover:bg-primary-container/60 transition-colors">
                      回到今天
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setShowForm(v => !v)}
                className="min-h-11 justify-center flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>新增
              </button>
            </div>
          </header>

          <section className="mb-6 rounded-2xl bg-surface-container-lowest p-3 sm:p-5 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold font-headline text-on-surface">行事曆</h2>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <button onClick={prevMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors" aria-label="上一個月">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="w-32 text-center text-sm font-semibold text-on-surface">{monthLabel}</span>
                <button onClick={nextMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors" aria-label="下一個月">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center">
              {WEEKDAYS.map(day => (
                <div key={day} className="pb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">週{day}</div>
              ))}
              {calendarCells.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />

                const dateKey = toDateKey(new Date(calendarYear, calendarMonth, day))
                const isToday = dateKey === todayKey
                const isSelected = dateKey === selectedDate
                const hasDateBlocks = (blocksByDate[dateKey]?.length ?? 0) > 0
                const hasDailyBlocks = dailyBlocks.length > 0

                return (
                  <button
                    key={dateKey}
                    onClick={() => selectCalendarDay(day)}
                    className="relative flex h-11 sm:h-12 flex-col items-center justify-center rounded-xl transition-colors hover:bg-surface-container"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/20'
                        : isToday ? 'bg-primary-container text-on-primary-container font-bold'
                        : 'text-on-surface'
                    }`}>
                      {day}
                    </span>
                    {(hasDateBlocks || hasDailyBlocks) && (
                      <span className={`absolute bottom-1 h-1 w-1 rounded-full ${hasDateBlocks ? 'bg-primary' : 'bg-secondary'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {[
              { val: doneCount, label: '已完成', color: 'primary' },
              { val: blocks.length - doneCount, label: '待完成', color: 'secondary' },
              { val: `${pct}%`, label: '完成率', color: 'tertiary' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-low px-3 sm:px-5 py-3 rounded-xl text-center sm:text-left">
                <p className={`text-xl font-bold text-${s.color}`}>{s.val}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Add form */}
          {showForm && (
            <div className="mb-5 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <h3 className="text-sm font-bold text-on-surface">新增行程</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex bg-surface-container-lowest rounded-lg border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                  <select value={form.hour} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                    className="bg-transparent px-2 py-2 text-sm outline-none cursor-pointer appearance-none text-center">
                    {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="py-2 text-sm text-on-surface-variant">:</span>
                  <select value={form.minute} onChange={e => setForm(f => ({ ...f, minute: e.target.value }))}
                    className="bg-transparent px-2 py-2 text-sm outline-none cursor-pointer appearance-none text-center">
                    {Array.from({length: 12}, (_, i) => (i*5).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && add()} placeholder="行程標題" autoFocus
                  className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="時長 (e.g. 60 分鐘)"
                  className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="標籤（逗號分隔）"
                  className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <label className="flex items-start sm:items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={event => setForm(f => ({ ...f, recurring: event.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                每日固定行程
                <span className="text-xs font-normal text-on-surface-variant">每天都會出現，完成狀態按日期分開記錄</span>
              </label>
              <div className="flex gap-2">
                <button onClick={add} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold">新增</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-container rounded-lg text-sm">取消</button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2 relative">
            <div className="absolute left-18 top-0 bottom-0 w-px bg-surface-container-highest" />
            {blocks.map(block => (
              <div key={block.id} className={`flex items-start gap-4 group transition-opacity ${block.done ? 'opacity-55' : ''}`}>
                <div className="w-14 text-right shrink-0">
                  <span className="text-xs font-semibold text-on-surface-variant pt-4 block">{block.time}</span>
                </div>
                <div className={`relative z-10 mt-3.5 w-3 h-3 rounded-full shrink-0 ring-4 ring-surface-container-low transition-colors ${block.done ? 'bg-tertiary' : `bg-${block.color}`}`} />
                <div onClick={() => toggle(block)}
                  className={`flex-1 p-3 rounded-xl border cursor-pointer select-none transition-all ${block.done ? 'bg-surface-container border-transparent' : `bg-surface-container-lowest border-${block.color}/10 hover:shadow-sm hover:-translate-y-px`}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${block.done ? 'fill-icon text-tertiary' : `text-${block.color}`}`}>
                        {block.done ? 'check_circle' : block.icon}
                      </span>
                      <div>
                        <h3 className={`font-semibold text-sm ${block.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{block.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {block.duration}{block.recurring ? ' · 每日固定' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {block.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-medium text-on-surface-variant">{tag}</span>
                        ))}
                      </div>
                      <button onClick={e => { e.stopPropagation(); remove(block) }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all rounded-full">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
                這天還沒有行程。你可以替這一天預排行程，或新增每日固定行程讓它每天自動出現。
              </div>
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="hidden xl:flex flex-col w-72 bg-surface-container-low/50 p-6 gap-6 shrink-0">
          <div>
            <h3 className="text-base font-bold text-on-surface mb-4">今日進度</h3>
            <div className="bg-surface-container-lowest rounded-2xl p-5">
              <p className="text-sm text-on-surface-variant mb-1">完成率</p>
              <p className="text-3xl font-black text-primary font-headline">{pct}%</p>
              <div className="mt-3 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant mt-2">{doneCount} / {blocks.length} 項完成</p>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface mb-3">習慣追蹤</h3>
            <div className="space-y-2">
              {habits.map(h => (
                <button key={h.id} onClick={() => toggleHabit(h.id)}
                  className="w-full flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl text-left hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-${h.color}`}>{h.icon}</span>
                    <span className="text-sm font-semibold">{h.label}</span>
                  </div>
                  {typeof h.value === 'number' && typeof h.target === 'number'
                    ? <span className="text-xs font-bold text-secondary">{h.value}/{h.target}</span>
                    : <span className={`material-symbols-outlined ${h.done ? 'fill-icon' : ''} text-${h.color} text-lg`}>{h.done ? 'check_circle' : 'radio_button_unchecked'}</span>}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
