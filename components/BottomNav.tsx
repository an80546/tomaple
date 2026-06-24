'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/schedule', icon: 'calendar_today', label: '行程' },
  { href: '/pomodoro', icon: 'timer', label: '專注' },
  { href: '/projects', icon: 'checklist', label: '任務' },
  { href: '/notes', icon: 'book', label: '筆記' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4.75rem+env(safe-area-inset-bottom))] bg-surface border-t border-surface-container flex items-start justify-around px-3 pt-2 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] rounded-t-2xl">
      {items.map((item, i) => {
        const active = pathname.startsWith(item.href)
        // Insert FAB in the middle
        const nodes = []
        if (i === 2) {
          nodes.push(
            <Link key="fab" href="/notes?new=1" aria-label="新增筆記" className="w-14 h-14 -mt-8 bg-linear-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform">
              <span className="material-symbols-outlined">add</span>
            </Link>
          )
        }
        nodes.push(
          <Link key={item.href} href={item.href} className={`min-w-12 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl active:bg-surface-container transition-colors ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-label font-bold">{item.label}</span>
          </Link>
        )
        return nodes
      })}
    </nav>
  )
}
