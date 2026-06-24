'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import TopBar from '@/components/TopBar'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { toLocalDateKey } from '@/lib/focusStats'

const DEFAULT_SESSIONS = [
  { label: '番茄鐘', mins: 25, color: 'primary' },
  { label: '短休息', mins: 5, color: 'secondary' },
  { label: '長休息', mins: 15, color: 'tertiary' },
]

function beep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 880
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.8)
}

export default function PomodoroPage() {
  const [sessions, setSessions] = useLocalStorage('pomodoro-sessions', DEFAULT_SESSIONS)
  const [sessionIdx, setSessionIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(sessions[0].mins * 60)
  const [running, setRunning] = useState(false)
  const [pomodorosDone, setPomodorosDone] = useLocalStorage('pomodoro-done', 0)
  const [totalMins, setTotalMins] = useLocalStorage('pomodoro-total-mins', 0)
  const [, setDailyMins] = useLocalStorage<Record<string, number>>('pomodoro-daily-mins', {})
  const [muted, setMuted] = useState(false)
  const [currentTask, setCurrentTask] = useLocalStorage('pomodoro-current-task', '編輯任務名稱...')
  const [editingTask, setEditingTask] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showSettings, setShowSettings] = useState(false)
  const [editSessions, setEditSessions] = useState([...sessions])
  const [showMore, setShowMore] = useState(false)

  const saveSettings = () => {
    setSessions(editSessions)
    setShowSettings(false)
    setSecondsLeft(editSessions[sessionIdx].mins * 60)
    setRunning(false)
  }

  const totalSecs = sessions[sessionIdx].mins * 60
  const progress = 1 - secondsLeft / totalSecs
  const circumference = 2 * Math.PI * 120
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  const playBeep = useCallback(() => {
    if (muted) return
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    beep(audioCtxRef.current)
  }, [muted])

  const switchSession = useCallback((idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSessionIdx(idx)
    setSecondsLeft(sessions[idx].mins * 60)
    setRunning(false)
  }, [sessions])

  const handleDone = useCallback(() => {
    playBeep()
    setRunning(false)
    if (sessionIdx === 0) {
      setPomodorosDone((n) => n + 1)
      setTotalMins((n) => n + sessions[0].mins)
      setDailyMins((daily) => {
        const todayKey = toLocalDateKey(new Date())
        return { ...daily, [todayKey]: (daily[todayKey] ?? 0) + sessions[0].mins }
      })
      // auto advance: after 4 pomodoros go long break
      const next = (pomodorosDone + 1) % 4 === 0 ? 2 : 1
      setTimeout(() => switchSession(next), 1500)
    } else {
      setTimeout(() => switchSession(0), 1500)
    }
  }, [sessionIdx, pomodorosDone, playBeep, setPomodorosDone, setTotalMins, switchSession])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { handleDone(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, handleDone])

  const stop = () => {
    setRunning(false)
    setSecondsLeft(sessions[sessionIdx].mins * 60)
  }

  const skip = () => switchSession((sessionIdx + 1) % sessions.length)
  const resetStats = () => {
    setPomodorosDone(0)
    setTotalMins(0)
    setShowMore(false)
  }
  const clearTask = () => {
    setCurrentTask('')
    setShowMore(false)
  }

  const pomodorosThisCycle = pomodorosDone % 4

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="番茄鐘" subtitle="專注模式" />

      <main className="flex-1 relative flex flex-col items-center justify-start md:justify-center bg-surface p-4 sm:p-6 overflow-y-auto custom-scrollbar">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-container/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-tertiary-container/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center py-4 md:py-0">
          <div className="absolute right-0 top-0">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          {showSettings && (
            <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:top-12 sm:right-0 bg-surface-container-low rounded-xl shadow-lg p-4 z-50 sm:w-64 border border-outline-variant/20">
              <h3 className="text-sm font-bold text-on-surface mb-3">計時長度設定 (分鐘)</h3>
              <div className="space-y-3 mb-4">
                {editSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-on-surface">{s.label}</span>
                    <div className="flex bg-surface-container-lowest rounded-lg border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                      <select
                        value={s.mins}
                        onChange={(e) => {
                          const newS = [...editSessions];
                          newS[i].mins = Number(e.target.value);
                          setEditSessions(newS);
                        }}
                        className="bg-transparent px-2 py-1 text-sm outline-none cursor-pointer appearance-none w-16 text-center"
                      >
                        {Array.from({ length: 60 }, (_, j) => j + 1).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveSettings} className="flex-1 bg-primary text-white py-1.5 rounded-lg text-sm font-bold">儲存</button>
                <button onClick={() => setShowSettings(false)} className="flex-1 bg-surface-container text-on-surface py-1.5 rounded-lg text-sm">取消</button>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-5 sm:gap-6 mb-6 sm:mb-8 text-center">
            <div>
              <p className="text-2xl font-black font-headline text-primary">{pomodorosDone}</p>
              <p className="text-xs text-on-surface-variant">今日完成</p>
            </div>
            <div className="w-px bg-surface-container-highest" />
            <div>
              <p className="text-2xl font-black font-headline text-secondary">{totalMins}</p>
              <p className="text-xs text-on-surface-variant">專注分鐘</p>
            </div>
          </div>

          {/* Session tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 bg-surface-container rounded-2xl sm:rounded-full p-1">
            {sessions.map((s, i) => (
              <button key={i} onClick={() => switchSession(i)}
                className={`min-h-10 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all ${sessionIdx === i ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Task indicator */}
          <div className="w-full sm:w-auto flex items-center gap-2 mb-6 sm:mb-8 bg-surface-container-low/60 px-4 sm:px-5 py-2 rounded-2xl sm:rounded-full border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse inline-block" />
            {editingTask ? (
              <input autoFocus value={currentTask} onChange={e => setCurrentTask(e.target.value)}
                onBlur={() => setEditingTask(false)} onKeyDown={e => e.key === 'Enter' && setEditingTask(false)}
                className="bg-transparent outline-none text-sm font-bold text-on-surface w-full sm:w-40" />
            ) : (
              <p className="text-on-surface-variant text-sm min-w-0 flex-1">
                正在專注於：<button onClick={() => setEditingTask(true)} className="text-on-surface font-bold hover:underline">{currentTask}</button>
              </p>
            )}
            <button onClick={() => setEditingTask(true)} className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
            </button>
          </div>

          {/* Timer circle */}
          <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="120" fill="none" stroke="#e6e9e6" strokeWidth="12" />
              <circle cx="140" cy="140" r="120" fill="none"
                stroke="url(#timerGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3d618a" />
                  <stop offset="100%" stopColor="#abcffe" />
                </linearGradient>
              </defs>
            </svg>
            <div className="glass-panel w-[85%] h-[85%] rounded-full flex flex-col items-center justify-center shadow-xl shadow-primary/5">
              <span className="text-5xl sm:text-6xl md:text-7xl font-headline font-extrabold tracking-tighter text-on-surface leading-none">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="mt-3 text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                {sessions[sessionIdx].label}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-2 sm:gap-5">
            <button onClick={() => setMuted(m => !m)}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors ${muted ? 'text-error bg-error-container/20' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
              <span className="material-symbols-outlined">{muted ? 'volume_off' : 'volume_up'}</span>
            </button>
            <button onClick={stop}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-surface-container-highest hover:bg-surface-container-high transition-all active:scale-95">
              <span className="material-symbols-outlined fill-icon text-2xl">stop</span>
            </button>
            <button onClick={() => setRunning(r => !r)}
              className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-3xl bg-linear-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-4xl">{running ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={skip}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-surface-container-highest hover:bg-surface-container-high transition-all active:scale-95">
              <span className="material-symbols-outlined text-2xl">skip_next</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMore(value => !value)}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="開啟更多番茄鐘操作"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              {showMore && (
                <div className="absolute right-0 bottom-14 w-48 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg p-2 text-sm">
                  <button onClick={resetStats} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-lg text-primary">restart_alt</span>
                    重設統計
                  </button>
                  <button onClick={clearTask} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-lg text-secondary">backspace</span>
                    清空目前任務
                  </button>
                  <button onClick={() => { setMuted(true); setShowMore(false) }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">volume_off</span>
                    靜音提醒
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quote */}
          <p className="mt-8 text-on-surface-variant italic text-sm leading-relaxed">"成功的秘訣在於開始。"</p>

          {/* Cycle dots */}
          <div className="mt-4 flex gap-2">
            {[0, 1, 2, 3].map((n) => (
              <span key={n} className={`w-2.5 h-2.5 rounded-full transition-colors ${n < pomodorosThisCycle ? 'bg-primary' : 'bg-surface-container-highest'}`} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
