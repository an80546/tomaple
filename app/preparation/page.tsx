'use client'
import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'

interface CheckItem { id: number; label: string; done: boolean; icon: string }
interface Reminder { id: number; time: string; title: string; type: string; icon: string; color: string; enabled: boolean }

const INIT_CHECKS: CheckItem[] = []

const INIT_REMINDERS: Reminder[] = []

export default function PreparationPage() {
  const [checks, setChecks] = useLocalStorage<CheckItem[]>('prep-checks', INIT_CHECKS)
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('prep-reminders', INIT_REMINDERS)
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [newCheck, setNewCheck] = useState('')
  const [newReminder, setNewReminder] = useState({ time: '', title: '', type: '每天' })

  const toggleCheck = (id: number) => setChecks(cs => cs.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const resetChecks = () => setChecks(cs => cs.map(c => ({ ...c, done: false })))
  const deleteCheck = (id: number) => setChecks(cs => cs.filter(c => c.id !== id))
  const toggleReminder = (id: number) => setReminders(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  const deleteReminder = (id: number) => setReminders(rs => rs.filter(r => r.id !== id))

  const addCheck = () => {
    if (!newCheck.trim()) return
    setChecks(cs => [...cs, { id: Date.now(), label: newCheck.trim(), done: false, icon: 'task_alt' }])
    setNewCheck('')
    setShowCheckForm(false)
  }

  const addReminder = () => {
    if (!newReminder.title.trim()) return
    const colors = ['primary', 'secondary', 'tertiary']
    const icons = ['alarm', 'event_note', 'notifications', 'timer']
    setReminders(rs => [...rs, {
      id: Date.now(), time: newReminder.time, title: newReminder.title.trim(),
      type: newReminder.type, icon: icons[Math.floor(Math.random() * icons.length)],
      color: colors[Math.floor(Math.random() * colors.length)], enabled: true
    }])
    setNewReminder({ time: '', title: '', type: '每天' })
    setShowReminderForm(false)
  }

  const doneCount = checks.filter(c => c.done).length
  const pct = checks.length ? Math.round((doneCount / checks.length) * 100) : 0
  const allDone = checks.length > 0 && doneCount === checks.length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="前置準備" subtitle="提醒管理" />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6 md:mb-8">
            <p className="text-on-surface-variant text-sm font-medium mb-1">開始前</p>
            <h1 className="text-2xl md:text-3xl font-black font-headline text-on-surface">前置準備</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Checklist */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold font-headline text-on-surface">準備清單</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">{doneCount}/{checks.length}</span>
                  <button onClick={resetChecks} className="min-h-10 text-xs text-on-surface-variant hover:text-primary px-2 py-1 rounded-lg hover:bg-surface-container transition-colors">重置</button>
                  <button onClick={() => setShowCheckForm(v => !v)} className="min-h-10 text-xs text-primary font-semibold px-2 py-1 rounded-lg hover:bg-primary-container/20 transition-colors">新增</button>
                </div>
              </div>

              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>

              {showCheckForm && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <input value={newCheck} onChange={e => setNewCheck(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCheck()} placeholder="檢查項目..." autoFocus
                    className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <div className="flex gap-2">
                    <button onClick={addCheck} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">新增</button>
                    <button onClick={() => setShowCheckForm(false)} className="flex-1 py-1.5 bg-surface-container rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {checks.map(item => (
                  <div key={item.id}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all group ${item.done ? 'bg-tertiary-container/30' : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}>
                    <button onClick={() => toggleCheck(item.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-tertiary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                      <span className={`material-symbols-outlined text-sm ${item.done ? 'fill-icon' : ''}`}>
                        {item.done ? 'check' : item.icon}
                      </span>
                    </button>
                    <button onClick={() => toggleCheck(item.id)}
                      className={`flex-1 text-left text-sm font-medium transition-colors ${item.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                      {item.label}
                    </button>
                    <button onClick={() => deleteCheck(item.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {checks.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  還沒有準備項目。新增常用檢查事項，之後就能一鍵重置重複使用。
                </div>
              )}

              {allDone && (
                <div className="p-4 rounded-xl bg-tertiary-container flex items-center gap-3 animate-pulse">
                  <span className="material-symbols-outlined fill-icon text-tertiary">celebration</span>
                  <div>
                    <p className="text-sm font-bold text-on-tertiary-container">準備完成！</p>
                    <p className="text-xs text-on-tertiary-container/70">可以開始你的專注時段了</p>
                  </div>
                </div>
              )}
            </section>

            {/* Reminders */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-headline text-on-surface">提醒設定</h2>
                <button onClick={() => setShowReminderForm(v => !v)}
                  className="min-h-10 flex items-center gap-1 text-sm text-primary font-semibold hover:bg-primary-container/20 px-2 py-1 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>新增
                </button>
              </div>

              {showReminderForm && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={newReminder.time} onChange={e => setNewReminder(r => ({ ...r, time: e.target.value }))}
                      type="time" className="w-full sm:w-28 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    <input value={newReminder.title} onChange={e => setNewReminder(r => ({ ...r, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addReminder()} placeholder="提醒名稱" autoFocus
                      className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    <select value={newReminder.type} onChange={e => setNewReminder(r => ({ ...r, type: e.target.value }))}
                      className="bg-surface-container-lowest rounded-lg px-2 py-2 text-xs outline-none">
                      <option>每天</option><option>重複</option><option>一次</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addReminder} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">新增</button>
                    <button onClick={() => setShowReminderForm(false)} className="flex-1 py-1.5 bg-surface-container rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {reminders.map(r => (
                  <div key={r.id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${r.enabled ? 'bg-surface-container-lowest' : 'bg-surface-container opacity-60'}`}>
                    <div className={`w-10 h-10 rounded-xl bg-${r.color}-container flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-${r.color} text-lg`}>{r.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{r.title}</p>
                      <p className="text-xs text-on-surface-variant">{r.time} · {r.type}</p>
                    </div>
                    <button onClick={() => toggleReminder(r.id)}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${r.enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => deleteReminder(r.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {reminders.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  尚未建立提醒。新增時間提醒，幫自己把準備節奏固定下來。
                </div>
              )}

              <Link href="/pomodoro"
                className="min-h-20 flex items-center justify-between p-5 rounded-xl bg-linear-to-br from-primary to-primary-container text-white hover:opacity-90 transition-opacity">
                <div>
                  <p className="text-sm font-medium opacity-90">準備好了嗎？</p>
                  <h3 className="text-xl font-black font-headline">開始專注</h3>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-80">play_circle</span>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
