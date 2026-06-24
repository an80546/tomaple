'use client'
import { useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'

interface Project { id: number; name: string; progress: number }
interface Goal { id: number; title: string; due: string; done: boolean; priority: '高' | '中' | '低' }
interface Milestone { id: number; title: string; date: string; done: boolean }

const INIT_PROJECTS: Project[] = []
const INIT_GOALS: Goal[] = []
const INIT_MILESTONES: Milestone[] = []

export default function ProjectsPage() {
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', INIT_PROJECTS)
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', INIT_GOALS)
  const [milestones, setMilestones] = useLocalStorage<Milestone[]>('milestones', INIT_MILESTONES)
  const [newProject, setNewProject] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newGoalDue, setNewGoalDue] = useState('')
  const [newGoalPriority, setNewGoalPriority] = useState<'高' | '中' | '低'>('中')
  const [newMilestone, setNewMilestone] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)

  const toggleGoal = (id: number) =>
    setGoals(gs => gs.map(g => g.id === id ? { ...g, done: !g.done } : g))

  const toggleMilestone = (id: number) =>
    setMilestones(ms => ms.map(m => m.id === id ? { ...m, done: !m.done } : m))

  const setProgress = (id: number, delta: number) =>
    setProjects(ps => ps.map(p => p.id === id ? { ...p, progress: Math.max(0, Math.min(100, p.progress + delta)) } : p))

  const addProject = () => {
    if (!newProject.trim()) return
    setProjects(ps => [...ps, { id: Date.now(), name: newProject.trim(), progress: 0 }])
    setNewProject('')
    setShowProjectForm(false)
  }

  const removeProject = (id: number) => setProjects(ps => ps.filter(p => p.id !== id))

  const addGoal = () => {
    if (!newGoal.trim()) return
    setGoals(gs => [...gs, { id: Date.now(), title: newGoal.trim(), due: newGoalDue || '未定', done: false, priority: newGoalPriority }])
    setNewGoal(''); setNewGoalDue(''); setShowGoalForm(false)
  }

  const removeGoal = (id: number) => setGoals(gs => gs.filter(g => g.id !== id))
  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setMilestones(ms => [...ms, {
      id: Date.now(),
      title: newMilestone.trim(),
      date: newMilestoneDate || new Date().toISOString().slice(0, 10),
      done: false,
    }])
    setNewMilestone('')
    setNewMilestoneDate('')
    setShowMilestoneForm(false)
  }
  const removeMilestone = (id: number) => setMilestones(ms => ms.filter(m => m.id !== id))

  const COLORS = ['primary', 'secondary', 'tertiary']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="項目目標" subtitle="進度追蹤" />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6 md:mb-8 flex items-end justify-between">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-on-surface">項目目標與進度</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Projects */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-headline">進行中項目</h2>
                <button onClick={() => setShowProjectForm(v => !v)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dim transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                </button>
              </div>

              {showProjectForm && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <input value={newProject} onChange={e => setNewProject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addProject()}
                    placeholder="項目名稱..." autoFocus
                    className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <div className="flex gap-2">
                    <button onClick={addProject} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">新增</button>
                    <button onClick={() => setShowProjectForm(false)} className="flex-1 py-1.5 bg-surface-container rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              {projects.map((p, i) => (
                <div key={p.id} className="p-4 rounded-xl bg-surface-container-lowest shadow-sm group">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm text-on-surface">{p.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold text-${COLORS[i % 3]}`}>{p.progress}%</span>
                      <button onClick={() => removeProject(p.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-linear-to-r from-primary to-primary-container rounded-full transition-all duration-300"
                      style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setProgress(p.id, -5)} className="flex-1 py-1 bg-surface-container rounded text-xs font-medium hover:bg-surface-container-high transition-colors">-5%</button>
                    <button onClick={() => setProgress(p.id, -1)} className="px-2 py-1 bg-surface-container rounded text-xs hover:bg-surface-container-high transition-colors">-1</button>
                    <button onClick={() => setProgress(p.id, 1)} className="px-2 py-1 bg-surface-container rounded text-xs hover:bg-surface-container-high transition-colors">+1</button>
                    <button onClick={() => setProgress(p.id, 5)} className="flex-1 py-1 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors">+5%</button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  尚未建立專案。按右上角加號建立第一個專案。
                </div>
              )}
            </section>

            {/* Goals */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-headline">目標清單</h2>
                <button onClick={() => setShowGoalForm(v => !v)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dim transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                </button>
              </div>

              {showGoalForm && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
                    placeholder="目標名稱..." autoFocus
                    className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={newGoalDue} onChange={e => setNewGoalDue(e.target.value)} placeholder="截止日期"
                      className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" />
                    <select value={newGoalPriority} onChange={e => setNewGoalPriority(e.target.value as '高' | '中' | '低')}
                      className="bg-surface-container-lowest rounded-lg px-2 py-1.5 text-xs outline-none">
                      <option>高</option><option>中</option><option>低</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addGoal} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">新增</button>
                    <button onClick={() => setShowGoalForm(false)} className="flex-1 py-1.5 bg-surface-container rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              {goals.map((g) => (
                <div key={g.id} className={`flex items-start gap-3 p-3 rounded-xl group transition-all ${g.done ? 'bg-tertiary-container/30' : 'bg-surface-container-lowest'}`}>
                  <button onClick={() => toggleGoal(g.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${g.done ? 'bg-tertiary border-tertiary' : 'border-outline-variant hover:border-tertiary'}`}>
                    {g.done && <span className="material-symbols-outlined fill-icon text-white" style={{ fontSize: '12px' }}>check</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${g.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{g.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-on-surface-variant">{g.due}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        g.priority === '高' ? 'bg-error-container/40 text-error' :
                        g.priority === '中' ? 'bg-primary-container/40 text-on-primary-container' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>{g.priority}</span>
                    </div>
                  </div>
                  <button onClick={() => removeGoal(g.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              ))}
              {goals.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  還沒有目標。新增一個本週要完成的具體事項。
                </div>
              )}
            </section>

            {/* Milestones */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-headline">里程碑</h2>
                <button onClick={() => setShowMilestoneForm(v => !v)}
                  className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dim transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                </button>
              </div>

              {showMilestoneForm && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addMilestone()}
                    placeholder="里程碑名稱..." autoFocus
                    className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <input value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)}
                    type="date"
                    className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <div className="flex gap-2">
                    <button onClick={addMilestone} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">新增</button>
                    <button onClick={() => setShowMilestoneForm(false)} className="flex-1 py-1.5 bg-surface-container rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-surface-container-highest" />
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-start gap-4">
                      <button onClick={() => toggleMilestone(m.id)}
                        className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${m.done ? 'bg-primary border-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-primary'}`}>
                        {m.done && <span className="material-symbols-outlined fill-icon text-white" style={{ fontSize: '12px' }}>check</span>}
                      </button>
                      <div className={`flex-1 p-3 rounded-xl transition-colors group ${m.done ? 'bg-primary-container/20' : 'bg-surface-container-lowest'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{m.title}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{m.date}</p>
                          </div>
                          <button onClick={() => removeMilestone(m.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {milestones.length === 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  沒有里程碑。用時間軸記錄專案關鍵節點。
                </div>
              )}
              <Link href="/notes" className="flex items-center justify-center gap-2 mt-4 p-4 rounded-xl bg-primary-container/20 hover:bg-primary-container/40 transition-colors">
                <span className="material-symbols-outlined text-primary">book</span>
                <p className="text-sm font-bold text-primary">查看進度筆記</p>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
