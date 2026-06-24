'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/schedule', icon: 'calendar_today', label: '每日行程' },
  { href: '/pomodoro', icon: 'timer', label: '番茄鐘' },
  { href: '/projects', icon: 'checklist', label: '任務項目' },
  { href: '/notes', icon: 'book', label: '進度筆記' },
  { href: '/preparation', icon: 'checklist_rtl', label: '前置準備' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col h-screen w-72 flex-shrink-0 bg-surface-container-low">
      <div className="px-8 py-10 flex flex-col h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined fill-icon text-white text-xl">filter_vintage</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface tracking-tight font-headline">楓－寧靜聖殿</h1>
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">保持當下</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 py-3 px-6 -ml-8 rounded-r-full transition-all duration-300 ${
                  active
                    ? 'text-primary font-semibold bg-surface-container-lowest'
                    : 'text-on-surface-variant hover:bg-surface transition-all'
                }`}
              >
                <span className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}>{item.icon}</span>
                <span className="font-label tracking-wide text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Start Focus CTA */}
        <div className="mt-8">
          <Link
            href="/pomodoro"
            className="block w-full py-4 px-6 rounded-xl bg-linear-to-br from-primary to-primary-container text-white font-bold text-sm text-center shadow-lg shadow-primary/10 hover:scale-[0.98] transition-transform duration-150"
          >
            開始專注時段
          </Link>
        </div>

        {/* Bottom Links */}
        <div className="mt-6 pt-4 border-t border-surface-container-highest/50 space-y-2">
          <Link href="/" className="flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors py-2">
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-sm font-medium">主頁面</span>
          </Link>
          <Link href="/preparation" className="flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors py-2">
            <span className="material-symbols-outlined text-xl">help</span>
            <span className="text-sm font-medium">操作準備</span>
          </Link>
          <Link href="/notes/manage" className="flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors py-2">
            <span className="material-symbols-outlined text-xl">history</span>
            <span className="text-sm font-medium">筆記管理</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
