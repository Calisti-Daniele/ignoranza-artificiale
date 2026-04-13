import Navbar from './Navbar'

interface AppShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

export default function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[--background] flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-12">
        {sidebar && (
          <aside className="hidden lg:flex flex-col shrink-0 border-r border-[--border] overflow-y-auto"
            style={{ width: 'clamp(260px, 22vw, 320px)' }}
          >
            {sidebar}
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
