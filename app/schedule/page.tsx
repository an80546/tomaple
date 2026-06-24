'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'

interface Block {
  id: number; time: string; title: string; duration: string
  icon: string; color: string; bg: string; tags: string[]; done: boolean
}
interface Habit {
  id: string
  icon: string
  label: string
  value?: number
  target?: number
  done?: boolean
  color: string
}

const INIT_BLOCKS: Block[] = []
const INIT_HABITS: Habit[] = [
  { id: 'water', icon: 'water_drop', label: '補充水分', value: 0, target: 8, color: 'secondary' },
  { id: 'meditation', icon: 'self_improvement', label: '冥想', done: false, color: 'tertiary' },
  { id: 'walk', icon: 'directions_walk', label: '散步', done: false, color: 'primary' },
]

export default function SchedulePage() {
  const [blocks, setBlocks] = useLocalStorage<Block[]>('schedule', INIT_BLOCKS)
  const [habits, setHabits] = useLocalStorage<Habit[]>('schedule-habits', INIT_HABITS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ hour: '08', minute: '00', title: '', duration: '', tags: '' })

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  const toggle = (id: number) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, done: !b.done } : b))
  const remove = (id: number) => setBlocks(bs => bs.filter(b => b.id !== id))
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
    setBlocks(bs => [...bs, {
      id: Date.now(), time: `${form.hour}:${form.minute}`, title: form.title.trim(),
      duration: form.duration || '60 分鐘', icon: 'event', color: c, bg: `${c}-container`,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), done: false
    }])
    setForm({ hour: '08', minute: '00', title: '', duration: '', tags: '' })
    setShowForm(false)
  }

  const doneCount = blocks.filter(b => b.done).length
  const pct = blocks.length ? Math.round((doneCount / blocks.length) * 100) : 0

  const sortedBlocks = [...blocks].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="ToMaple" subtitle="每日行程" />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
          <header className="mb-6">
            <p className="text-tertiary font-semibold tracking-widest uppercase text-xs mb-1">{dateStr}</p>
            <div className="flex items-end justify-between">
              <h1 className="text-4xl font-black text-on-surface font-headline">今日行程</h1>
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>新增
              </button>
            </div>
          </header>

          {/* Stats */}
          <div className="flex gap-3 mb-6">
            {[
              { val: doneCount, label: '已完成', color: 'primary' },
              { val: blocks.length - doneCount, label: '待完成', color: 'secondary' },
              { val: `${pct}%`, label: '完成率', color: 'tertiary' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-low px-5 py-3 rounded-xl">
                <p className={`text-xl font-bold text-${s.color}`}>{s.val}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Add form */}
          {showForm && (
            <div className="mb-5 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <h3 className="text-sm font-bold text-on-surface">新增行程</h3>
              <div className="flex gap-2">
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
              <div className="flex gap-2">
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="時長 (e.g. 60 分鐘)"
                  className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="標籤（逗號分隔）"
                  className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-2">
                <button onClick={add} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold">新增</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-container rounded-lg text-sm">取消</button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2 relative">
            <div className="absolute left-18 top-0 bottom-0 w-px bg-surface-container-highest" />
            {sortedBlocks.map(block => (
              <div key={block.id} className={`flex items-start gap-4 group transition-opacity ${block.done ? 'opacity-55' : ''}`}>
                <div className="w-14 text-right shrink-0">
                  <span className="text-xs font-semibold text-on-surface-variant pt-4 block">{block.time}</span>
                </div>
                <div className={`relative z-10 mt-3.5 w-3 h-3 rounded-full shrink-0 ring-4 ring-surface-container-low transition-colors ${block.done ? 'bg-tertiary' : `bg-${block.color}`}`} />
                <div onClick={() => toggle(block.id)}
                  className={`flex-1 p-3 rounded-xl border cursor-pointer select-none transition-all ${block.done ? 'bg-surface-container border-transparent' : `bg-surface-container-lowest border-${block.color}/10 hover:shadow-sm hover:-translate-y-px`}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${block.done ? 'fill-icon text-tertiary' : `text-${block.color}`}`}>
                        {block.done ? 'check_circle' : block.icon}
                      </span>
                      <div>
                        <h3 className={`font-semibold text-sm ${block.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{block.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{block.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {block.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-medium text-on-surface-variant">{tag}</span>
                        ))}
                      </div>
                      <button onClick={e => { e.stopPropagation(); remove(block.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all rounded-full">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
