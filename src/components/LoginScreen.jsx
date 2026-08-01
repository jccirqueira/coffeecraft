import { useState } from 'react'
import { Coffee, Lock } from 'lucide-react'

export default function LoginScreen({ onLogin }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!senha || carregando) return
    setCarregando(true)
    setErro('')
    try {
      await onLogin(senha)
    } catch (err) {
      setErro(err.message || 'Erro ao entrar')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-brew flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brew rounded-xl p-3 mb-4">
            <Coffee size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900">CoffeeCraft</h1>
          <p className="text-sm text-gray-500">Propostas de Coffee Break</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Senha de acesso</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={!senha || carregando}
            className="w-full bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white py-2.5 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
