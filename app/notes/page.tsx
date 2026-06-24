'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'

export interface Note {
  id: number; title: string; content: string; project: string
  tags: string; pinned: boolean; date: string
}

interface Project { id: number; name: string; progress: number }

const INIT_NOTES: Note[] = []

const PROJECT_COLORS: Record<string, string> = {
  '應用設計': 'primary', '撰寫報告': 'secondary', '學習 Python': 'tertiary', '市場調查': 'secondary',
}
const color = (p: string) => PROJECT_COLORS[p] ?? 'primary'

const EMPTY: Note = { id: 0, title: '', content: '', project: '', tags: '', pinned: false, date: '' }

export default function NotesPage() {
  const openedFromQuery = useRef(false)
  const [dbProjects] = useLocalStorage<Project[]>('projects', [])
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', INIT_NOTES)
  const [filter, setFilter] = useState('全部')
  const [modal, setModal] = useState<Note | null>(null)   // null = closed
  const [editing, setEditing] = useState(false)

  const activeProjects = dbProjects.map(p => p.name)
  if (activeProjects.length === 0) activeProjects.push('一般筆記') // Fallback if empty

  const projects = ['全部', ...Array.from(new Set([...notes.map(n => n.project), ...activeProjects]))]

  const visible = filter === '全部' ? notes : notes.filter(n => n.project === filter)
  const pinned = visible.filter(n => n.pinned)
  const rest = visible.filter(n => !n.pinned)
  const sorted = [...pinned, ...rest]

  const openNew = () => { setModal({ ...EMPTY, id: Date.now(), date: new Date().toISOString().slice(0, 10) }); setEditing(true) }
  const openView = (n: Note) => { setModal(n); setEditing(false) }

  useEffect(() => {
    if (openedFromQuery.current) return
    const searchParams = new URLSearchParams(window.location.search)
    const shouldCreate = searchParams.get('new') === '1'
    const noteId = Number(searchParams.get('note'))
    if (shouldCreate) {
      openedFromQuery.current = true
      openNew()
      return
    }
    if (noteId) {
      const found = notes.find(note => note.id === noteId)
      if (found) {
        openedFromQuery.current = true
        openView(found)
      }
    }
  }, [notes])

  const save = () => {
    if (!modal) return
    setNotes(ns => ns.find(n => n.id === modal.id) ? ns.map(n => n.id === modal.id ? modal : n) : [modal, ...ns])
    setModal(null)
  }

  const del = (id: number) => { setNotes(ns => ns.filter(n => n.id !== id)); setModal(null) }
  const togglePin = (id: number) => setNotes(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="進度筆記" subtitle="歷史記錄" />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
          <header className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-on-surface">進度筆記</h1>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Link href="/notes/manage" className="min-h-11 justify-center flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-sm">tune</span>管理
              </Link>
              <button onClick={openNew} className="min-h-11 justify-center flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>新增
              </button>
            </div>
          </header>

          {/* Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 custom-scrollbar sm:flex-wrap">
            {projects.map(p => (
              <button key={p} onClick={() => setFilter(p)}
                className={`shrink-0 min-h-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === p ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                {p}
              </button>
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3">note_add</span>
              <p className="text-sm">還沒有筆記，點擊「新增」開始記錄</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map(note => (
              <div key={note.id} onClick={() => openView(note)}
                className={`p-4 sm:p-5 rounded-xl bg-surface-container-lowest border-l-4 border-${color(note.project)} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider text-${color(note.project)}`}>{note.project}</span>
                    <h3 className="font-bold text-on-surface mt-0.5">{note.title}</h3>
                  </div>
                  <button onClick={e => { e.stopPropagation(); togglePin(note.id) }}
                    className={`min-w-10 min-h-10 flex items-center justify-center rounded-full transition-colors ${note.pinned ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'}`}>
                    <span className={`material-symbols-outlined text-lg ${note.pinned ? 'fill-icon' : ''}`}>push_pin</span>
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">{note.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {note.tags.split(',').filter(Boolean).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-medium text-on-surface-variant">{t.trim()}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{note.date}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-inverse-surface/30 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 space-y-4">
            {editing ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-headline">{modal.id && notes.find(n=>n.id===modal.id) ? '編輯筆記' : '新增筆記'}</h2>
                  <button onClick={() => setModal(null)} className="p-1 text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <input value={modal.title} onChange={e => setModal(m => m && ({ ...m, title: e.target.value }))}
                  placeholder="標題" className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={modal.project || activeProjects[0]} onChange={e => setModal(m => m && ({ ...m, project: e.target.value }))}
                    className="flex-1 bg-surface-container-low rounded-xl px-3 py-2 text-sm outline-none">
                    {activeProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input value={modal.tags} onChange={e => setModal(m => m && ({ ...m, tags: e.target.value }))}
                    placeholder="標籤（逗號分隔）" className="flex-1 bg-surface-container-low rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <textarea value={modal.content} onChange={e => setModal(m => m && ({ ...m, content: e.target.value }))}
                  placeholder="筆記內容..." rows={6}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
                <div className="flex gap-2 pt-1">
                  <button onClick={save} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dim transition-colors">儲存</button>
                  <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-surface-container rounded-xl text-sm hover:bg-surface-container-high transition-colors">取消</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase text-${color(modal.project)}`}>{modal.project}</span>
                    <h2 className="text-xl font-bold font-headline mt-0.5">{modal.title}</h2>
                  </div>
                  <button onClick={() => setModal(null)} className="p-1 text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{modal.content}</p>
                <div className="flex gap-1 flex-wrap">
                  {modal.tags.split(',').filter(Boolean).map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-medium text-on-surface-variant">{t.trim()}</span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(true)} className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors">編輯</button>
                  <button onClick={() => del(modal.id)} className="px-4 py-2.5 bg-error-container/30 text-error rounded-xl text-sm font-semibold hover:bg-error-container/50 transition-colors">刪除</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
