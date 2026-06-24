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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface flex items-center justify-around px-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] rounded-t-3xl">
      {items.map((item, i) => {
        const active = pathname.startsWith(item.href)
        // Insert FAB in the middle
        const nodes = []
        if (i === 2) {
          nodes.push(
            <Link key="fab" href="/notes?new=1" className="w-14 h-14 -mt-10 bg-linear-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined">add</span>
            </Link>
          )
        }
        nodes.push(
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-label font-bold">{item.label}</span>
          </Link>
        )
        return nodes
      })}
    </nav>
  )
}
