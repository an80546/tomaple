'use client'
import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'
import type { Note } from '../page'

const INIT_NOTES: Note[] = []

const PROJECT_COLORS: Record<string, string> = {
  '應用設計': 'primary', '撰寫報告': 'secondary', '學習 Python': 'tertiary',
}
const color = (p: string) => PROJECT_COLORS[p] ?? 'primary'

export default function NotesManagePage() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', INIT_NOTES)
  const [selected, setSelected] = useState<number[]>([])

  const togglePin = (id: number) => setNotes(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const deleteSelected = () => { setNotes(ns => ns.filter(n => !selected.includes(n.id))); setSelected([]) }
  const deleteOne = (id: number) => setNotes(ns => ns.filter(n => n.id !== id))
  const toggleAll = () => setSelected(s => s.length === notes.length ? [] : notes.map(n => n.id))

  const pinned = notes.filter(n => n.pinned)
  const rest = notes.filter(n => !n.pinned)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="管理筆記" subtitle="釘選與增刪" />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/notes" className="text-sm text-on-surface-variant hover:text-primary flex items-center gap-1 mb-2 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>返回筆記
            </Link>
            <h1 className="text-2xl md:text-3xl font-black font-headline text-on-surface">管理筆記</h1>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {notes.length > 0 && (
              <button onClick={toggleAll} className="min-h-11 text-sm text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl hover:bg-surface-container transition-colors">
                {selected.length === notes.length ? '取消全選' : '全選'}
              </button>
            )}
            {selected.length > 0 && (
              <button onClick={deleteSelected}
                className="min-h-11 justify-center flex items-center gap-2 bg-error-container/30 text-error px-4 py-2 rounded-xl text-sm font-semibold hover:bg-error-container/50 transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>刪除 {selected.length} 項
              </button>
            )}
            <Link href="/notes?new=1" className="min-h-11 justify-center flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dim transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>新增筆記
            </Link>
          </div>
        </header>

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3">note_add</span>
            <p className="text-sm">沒有筆記</p>
          </div>
        )}

        {pinned.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined fill-icon text-primary text-sm">push_pin</span>已釘選
            </h2>
            <div className="space-y-2">
              {pinned.map(note => <NoteRow key={note.id} note={note} selected={selected.includes(note.id)} onToggleSelect={toggleSelect} onTogglePin={togglePin} onDelete={deleteOne} colorKey={color(note.project)} />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">其他筆記</h2>
            <div className="space-y-2">
              {rest.map(note => <NoteRow key={note.id} note={note} selected={selected.includes(note.id)} onToggleSelect={toggleSelect} onTogglePin={togglePin} onDelete={deleteOne} colorKey={color(note.project)} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function NoteRow({ note, selected, onToggleSelect, onTogglePin, onDelete, colorKey }: {
  note: Note; selected: boolean; colorKey: string
  onToggleSelect: (id: number) => void
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4 rounded-xl transition-colors ${selected ? 'bg-primary-container/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}>
      <button onClick={() => onToggleSelect(note.id)}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-outline-variant hover:border-primary'}`}>
        {selected && <span className="material-symbols-outlined fill-icon text-white" style={{ fontSize: '12px' }}>check</span>}
      </button>
      <div className={`w-1 h-10 rounded-full bg-${colorKey} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface text-sm truncate">{note.title}</p>
        <p className="text-xs text-on-surface-variant">{note.project} · {note.date}</p>
      </div>
      <div className="ml-auto flex items-center gap-1">
      <button onClick={() => onTogglePin(note.id)}
        className={`min-w-10 min-h-10 flex items-center justify-center rounded-full transition-colors ${note.pinned ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
        <span className={`material-symbols-outlined text-lg ${note.pinned ? 'fill-icon' : ''}`}>push_pin</span>
      </button>
      <Link href={`/notes?note=${note.id}`} className="min-w-10 min-h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-lg">edit</span>
      </Link>
      <button onClick={() => onDelete(note.id)} className="min-w-10 min-h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error transition-colors">
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
      </div>
    </div>
  )
}
