import Sidebar from '../Sidebar'
import Header from '../Header'
import GlobalStyles from './GlobalStyles'

export interface AppShellProps {
  children: React.ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <>
      <GlobalStyles />
      <Sidebar />
      <div className="flex min-h-screen flex-col bg-background pl-72">
        <Header />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </>
  )
}

export default AppShell
