import { useState, useCallback } from 'react'
import { Coffee, Package, FileText, BookOpen, Users, Settings } from 'lucide-react'
import { api } from './api'
import { DataProvider, useData } from './DataContext'
import LoginScreen from './components/LoginScreen'
import ProductManager from './components/ProductManager'
import RecipeManager from './components/RecipeManager'
import ClientManager from './components/ClientManager'
import SettingsManager from './components/SettingsManager'
import ProposalBuilder from './components/ProposalBuilder'

function MainApp() {
  const [tab, setTab] = useState('proposta')
  const { carregando, erro, setErro } = useData()

  if (carregando) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-brew rounded-xl p-3 w-fit mx-auto mb-4 animate-pulse">
            <Coffee size={32} className="text-white" />
          </div>
          <p className="text-amber-900 font-medium">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {erro && (
        <div className="bg-red-100 border-b border-red-300 text-red-700 text-sm px-4 py-2 flex items-center justify-between gap-4">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="font-semibold cursor-pointer">✕</button>
        </div>
      )}
      <div className="flex flex-col lg:flex-row min-h-screen">
        <aside className="w-full lg:w-64 bg-brew text-amber-50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-brew-dark rounded-xl p-2">
              <Coffee size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CoffeeCraft</h1>
              <p className="text-amber-300 text-xs">Propostas de Coffee Break</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => setTab('proposta')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                tab === 'proposta'
                  ? 'bg-brew text-white font-semibold'
                  : 'text-amber-200 hover:bg-brew-dark/50 hover:text-white'
              }`}
            >
              <FileText size={18} />
              Nova Proposta
            </button>
            <button
              onClick={() => setTab('clientes')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                tab === 'clientes'
                  ? 'bg-brew text-white font-semibold'
                  : 'text-amber-200 hover:bg-brew-dark/50 hover:text-white'
              }`}
            >
              <Users size={18} />
              Clientes
            </button>
            <button
              onClick={() => setTab('produtos')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                tab === 'produtos'
                  ? 'bg-brew text-white font-semibold'
                  : 'text-amber-200 hover:bg-brew-dark/50 hover:text-white'
              }`}
            >
              <Package size={18} />
              Produtos
            </button>
            <button
              onClick={() => setTab('receitas')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                tab === 'receitas'
                  ? 'bg-brew text-white font-semibold'
                  : 'text-amber-200 hover:bg-brew-dark/50 hover:text-white'
              }`}
            >
              <BookOpen size={18} />
              Receitas
            </button>
            <button
              onClick={() => setTab('configuracoes')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                tab === 'configuracoes'
                  ? 'bg-brew text-white font-semibold'
                  : 'text-amber-200 hover:bg-brew-dark/50 hover:text-white'
              }`}
            >
              <Settings size={18} />
              Configurações
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-amber-700 text-amber-400 text-xs">
            <p>© 2026 CoffeeCraft</p>
            <p className="mt-1">Powered By Cacir Soluções Tecnológicas</p>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {tab === 'clientes' && <ClientManager />}
            {tab === 'produtos' && <ProductManager />}
            {tab === 'receitas' && <RecipeManager />}
            {tab === 'configuracoes' && <SettingsManager />}
            {tab === 'proposta' && <ProposalBuilder />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem('coffeecraft_token') || '')

  const handleLogin = useCallback(async senha => {
    const res = await api.login(senha)
    window.localStorage.setItem('coffeecraft_token', res.token)
    setToken(res.token)
  }, [])

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem('coffeecraft_token')
    setToken('')
  }, [])

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <DataProvider token={token} onLogout={handleLogout}>
      <MainApp />
    </DataProvider>
  )
}
