'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { getBlocksForDate, ScheduleBlock, ScheduleByDate, toDateKey } from '@/lib/schedule'

interface TopBarProps {
  title?: string
  subtitle?: string
}

interface Note {
  id: number
  title: string
  pinned: boolean
}

const SEARCH_TARGETS = [
  { href: '/', label: '主頁面', icon: 'home', keywords: '首頁 儀表板 dashboard' },
  { href: '/schedule', label: '今日行程', icon: 'calendar_today', keywords: '行程 排程 日曆 schedule' },
  { href: '/pomodoro', label: '番茄鐘', icon: 'timer', keywords: '專注 計時 pomodoro timer' },
  { href: '/projects', label: '專案管理', icon: 'checklist', keywords: '專案 目標 進度 project goal' },
  { href: '/notes', label: '進度筆記', icon: 'book', keywords: '筆記 記錄 note' },
  { href: '/preparation', label: '準備清單', icon: 'checklist_rtl', keywords: '準備 提醒 reminder checklist' },
]

export default function TopBar({ title = '寧靜流動', subtitle }: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [activePanel, setActivePanel] = useState<'search' | 'notifications' | 'settings' | null>(null)
  const [blocksByDate] = useLocalStorage<ScheduleByDate>('schedule-by-date', {})
  const [dailyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule-daily', [])
  const [legacyBlocks] = useLocalStorage<ScheduleBlock[]>('schedule', [])
  const [notes] = useLocalStorage<Note[]>('notes', [])
  const [pomodorosDone] = useLocalStorage('pomodoro-done', 0)
  const [totalMins] = useLocalStorage('pomodoro-total-mins', 0)

  const todayKey = toDateKey(new Date())
  const todayBlocks = [
    ...getBlocksForDate(blocksByDate, dailyBlocks, todayKey),
    ...legacyBlocks,
  ]
  const pendingBlocks = todayBlocks.filter(block => !block.done)
  const pinnedNotes = notes.filter(note => note.pinned)

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return SEARCH_TARGETS
    return SEARCH_TARGETS.filter(item =>
      `${item.label} ${item.keywords}`.toLowerCase().includes(keyword)
    )
  }, [query])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActivePanel('search')
  }

  return (
    <header className="relative flex justify-between items-center px-4 sm:px-6 lg:px-10 py-4 w-full h-16 bg-surface border-b border-surface-container flex-shrink-0 z-40">
      <div className="flex items-center gap-8 min-w-0">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface font-headline truncate">{title}</h2>
        {subtitle && <p className="text-sm text-on-surface-variant hidden lg:block truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <form onSubmit={submitSearch} className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setActivePanel('search')
            }}
            onFocus={() => setActivePanel('search')}
            className="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-full text-sm focus:ring-1 focus:ring-primary-dim outline-none w-52 text-on-surface placeholder:text-on-surface-variant"
            placeholder="搜尋頁面..."
            type="search"
          />
        </form>

        <button
          type="button"
          aria-label="查看通知"
          onClick={() => setActivePanel(activePanel === 'notifications' ? null : 'notifications')}
          className="relative p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <span className="material-symbols-outlined">notifications</span>
          {(pendingBlocks.length > 0 || pinnedNotes.length > 0) && (
            <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-error" />
          )}
        </button>

        <button
          type="button"
          aria-label="開啟設定"
          onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
          U
        </div>
      </div>

      {activePanel === 'search' && (
        <div className="absolute right-20 sm:right-40 top-14 w-72 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg p-2">
          <p className="px-3 py-2 text-xs font-semibold text-on-surface-variant">快速前往</p>
          <div className="space-y-1">
            {results.length > 0 ? results.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActivePanel(null)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )) : (
              <p className="px-3 py-3 text-sm text-on-surface-variant">找不到符合的頁面</p>
            )}
          </div>
        </div>
      )}

      {activePanel === 'notifications' && (
        <div className="absolute right-16 top-14 w-80 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-on-surface">通知摘要</h3>
            <span className="text-xs text-on-surface-variant">{pendingBlocks.length + pinnedNotes.length} 則重點</span>
          </div>
          <div className="space-y-2">
            <NotificationRow icon="event_note" label="待完成行程" value={`${pendingBlocks.length} 項`} href="/schedule" />
            <NotificationRow icon="push_pin" label="釘選筆記" value={`${pinnedNotes.length} 則`} href="/notes" />
            <NotificationRow icon="timer" label="累積專注" value={`${pomodorosDone} 顆 / ${totalMins} 分`} href="/pomodoro" />
          </div>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="absolute right-6 top-14 w-80 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">偏好設定</h3>
              <p className="text-xs text-on-surface-variant mt-1">設定會儲存在這台瀏覽器。</p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="關閉設定"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between gap-4 rounded-xl bg-surface-container-low p-3 text-left hover:bg-surface-container transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              <span>
                <span className="block text-sm font-semibold text-on-surface">暗色模式</span>
                <span className="block text-xs text-on-surface-variant">{theme === 'dark' ? '目前開啟' : '目前關閉'}</span>
              </span>
            </span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-surface-container-highest'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </span>
          </button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/notes/manage" onClick={() => setActivePanel(null)} className="rounded-lg bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors">
              管理筆記
            </Link>
            <Link href="/preparation" onClick={() => setActivePanel(null)} className="rounded-lg bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors">
              準備清單
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function NotificationRow({ icon, label, value, href }: {
  icon: string
  label: string
  value: string
  href: string
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2 hover:bg-surface-container transition-colors">
      <span className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <span className="text-sm font-medium text-on-surface truncate">{label}</span>
      </span>
      <span className="text-xs font-bold text-on-surface-variant shrink-0">{value}</span>
    </Link>
  )
}
