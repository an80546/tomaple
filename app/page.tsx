'use client'
import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { getBlocksForDate, ScheduleBlock, ScheduleByDate, toDateKey } from '@/lib/schedule'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  // 0=Sun..6=Sat → convert to Mon-based (0=Mon)
  return (new Date(year, month, 1).getDay() + 6) % 7
}

interface HistoryItem {
  id: number; tag: string; tagColor: string; time: string; title: string; desc: string; borderColor: string
}

const INIT_HISTORY: HistoryItem[] = []

export default function HomePage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [pomodorosDone] = useLocalStorage('pomodoro-done', 0)
  const [totalMins] = useLocalStorage('pomodoro-total-mins', 0)
  const [history] = useLocalStorage<HistoryItem[]>('home-history', INIT_HISTORY)
  const [compactHistory, setCompactHistory] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const selectedDateKey = toDateKey(new Date(year, month, Math.min(selectedDay, daysInMonth)))
  const todayKey = toDateKey(today)

  const [blocksByDate] = useLocalStorage<ScheduleByDate>('schedule-by-date', {})
  const [dailyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule-daily', [])
  const [legacyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule', [])
  const selectedBlocks = getBlocksForDate(blocksByDate, dailyBlocks, selectedDateKey)
  const blocks = selectedDateKey === todayKey
    ? [...selectedBlocks, ...legacyBlocks].sort((a, b) => a.time.localeCompare(b.time))
    : selectedBlocks
  const nextTask = blocks.find(b => !b.done)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const monthLabel = new Date(year, month).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })

  // Cells: leading nulls + days
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const visibleHistory = compactHistory ? history.slice(0, 3) : history

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="ToMaple" />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
        {/* Header */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <p className="text-on-surface-variant font-medium tracking-wide text-sm">歡迎回來</p>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">主頁面</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              <div className="bg-primary-container/30 px-4 py-2 rounded-xl text-center">
                <p className="text-xl font-black text-primary">{pomodorosDone}</p>
                <p className="text-xs text-on-surface-variant">今日番茄</p>
              </div>
              <div className="bg-secondary-container/30 px-4 py-2 rounded-xl text-center">
                <p className="text-xl font-black text-secondary">{totalMins}</p>
                <p className="text-xs text-on-surface-variant">專注分鐘</p>
              </div>
            </div>
            <div className="bg-surface-container-low px-3 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block" />
              <span className="text-sm font-medium text-secondary">專注模式已就緒</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Calendar */}
          <section className="col-span-12 lg:col-span-8 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-headline">月曆視圖</h2>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <button onClick={prevMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="font-semibold text-on-surface w-32 text-center">{monthLabel}</span>
                <button onClick={nextMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-7 gap-y-2 text-center">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest pb-2">週{d}</div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />
                  const isToday = isCurrentMonth && day === today.getDate()
                  const isSelected = day === selectedDay
                  return (
                    <div key={day} onClick={() => setSelectedDay(day)}
                      className="h-11 flex flex-col items-center justify-center relative cursor-pointer group">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                        ${isToday ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                          : isSelected ? 'bg-primary-container text-on-primary-container font-semibold'
                          : 'hover:bg-surface-container text-on-surface'}`}>
                        {day}
                      </div>
                      {isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Today task card */}
            <div className="bg-surface-container-low rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined">{nextTask?.icon || 'event_note'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{selectedDateKey === todayKey ? '今日重點任務' : '選取日期任務'}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {nextTask ? `${nextTask.time} — ${nextTask.title}` : '目前無排定任務，享受平靜的一天。'}
                  </p>
                </div>
              </div>
              <Link href={`/schedule?date=${selectedDateKey}`} className="text-primary font-bold text-sm hover:underline">查看詳情</Link>
            </div>
          </section>

          {/* History */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-headline">進度歷程</h2>
              <button
                type="button"
                onClick={() => setCompactHistory(value => !value)}
                className={`p-2 rounded-full transition-colors ${compactHistory ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                aria-label="切換歷程篩選"
                title={compactHistory ? '顯示全部歷程' : '只顯示最近三筆'}
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>

            <div className="space-y-3">
              {visibleHistory.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                  還沒有歷程。完成番茄鐘、建立行程或整理筆記後，這裡會成為你的近期摘要。
                </div>
              )}
              {visibleHistory.map(item => (
                <div key={item.id} className={`bg-surface-container-lowest rounded-xl p-4 border-l-4 border-${item.borderColor} shadow-sm hover:-translate-y-0.5 transition-transform`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full bg-${item.tagColor} text-[10px] font-bold uppercase`}>{item.tag}</span>
                    <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Weekly bar chart */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-3">本週專注時長</h3>
              <div className="flex items-end justify-between gap-1.5 h-14">
                {[40, 100, 70, 110, 90, 20, 15].map((h, i) => (
                  <div key={i} className="flex-1 bg-surface-container-low rounded-full flex flex-col justify-end h-full">
                    <div className={`rounded-full transition-all ${i === 3 ? 'bg-primary' : i < 5 ? 'bg-primary-container/70' : 'bg-surface-container-highest'}`}
                      style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {['一','二','三','四','五','六','日'].map(d => (
                  <span key={d} className="flex-1 text-center text-[10px] text-on-surface-variant">{d}</span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FAB */}
      <Link href="/notes?new=1" className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
        <span className="material-symbols-outlined">add</span>
      </Link>
    </div>
  )
}
