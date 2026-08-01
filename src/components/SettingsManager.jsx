import { useState } from 'react'
import { useData } from '../DataContext'
import { api } from '../api'
import { maskCNPJ, maskTelefone } from '../utils/masks'
import { Coffee, Plus, Pencil, Trash2, X, Check, Upload, Download } from 'lucide-react'

const emptyForm = {
  nome: '',
  local: '',
  cnpj: '',
  endereco: '',
  telefone: '',
  email: '',
  responsavel: '',
}

export default function SettingsManager() {
  const { cafeterias, carregar, adicionar, atualizar, excluir } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [importMsg, setImportMsg] = useState('')
  const [importando, setImportando] = useState(false)

  const CHAVES = {
    coffeecraft_products: 'produtos',
    coffeecraft_clientes: 'clientes',
    coffeecraft_cafeterias: 'cafeterias',
    coffeecraft_categorias: 'categorias',
    coffeecraft_receitas: 'receitas',
    coffeecraft_historico: 'propostas',
    coffeecraft_proposta_contador: 'contador',
  }

  function lerDadosNavegador() {
    const dados = {}
    for (const [chave, tabela] of Object.entries(CHAVES)) {
      try {
        const raw = window.localStorage.getItem(chave)
        if (!raw) continue
        dados[tabela] = JSON.parse(raw)
      } catch {
        // ignora chave inválida
      }
    }
    if (Array.isArray(dados.categorias)) {
      dados.categorias = dados.categorias.map(nome => ({ nome: String(nome) }))
    }
    return dados
  }

  async function handleImportar() {
    const dados = lerDadosNavegador()
    const total = Object.values(dados).reduce((acc, v) => acc + (Array.isArray(v) ? v.length : Object.keys(v || {}).length), 0)
    if (total === 0) {
      setImportMsg('Nenhum dado antigo encontrado neste navegador.')
      return
    }
    if (!confirm(`Importar ${total} registro(s) deste navegador para o servidor? Os dados existentes no servidor não serão apagados.`)) return

    setImportando(true)
    setImportMsg('')
    try {
      const res = await api.importar(dados)
      await carregar()
      setImportMsg(`Importação concluída: ${Object.entries(res.totals).map(([t, n]) => `${t}: ${n}`).join(', ')}`)
    } catch (e) {
      setImportMsg(`Erro na importação: ${e.message}`)
    } finally {
      setImportando(false)
    }
  }

  function handleExportar() {
    const dados = lerDadosNavegador()
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'coffeecraft-dados.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave() {
    if (!form.nome.trim()) return
    const dados = { ...form, nome: form.nome.trim() }

    try {
      if (editingId) {
        await atualizar('cafeterias', editingId, dados)
      } else {
        await adicionar('cafeterias', dados)
      }
    } catch { return }
    resetForm()
  }

  function handleEdit(cafeteria) {
    setForm({
      nome: cafeteria.nome,
      local: cafeteria.local || '',
      cnpj: cafeteria.cnpj || '',
      endereco: cafeteria.endereco || '',
      telefone: cafeteria.telefone || '',
      email: cafeteria.email || '',
      responsavel: cafeteria.responsavel || '',
    })
    setEditingId(cafeteria.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await excluir('cafeterias', id)
    } catch { }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Configurações</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-brew hover:bg-brew-dark text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={18} /> Nova Cafeteria
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Cadastre as cafeterias que fornecem o coffee break. Na proposta, você escolhe qual delas
        irá fornecer — os dados dela aparecem no cabeçalho do PDF.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Upload size={16} className="text-amber-700" />
          <h3 className="font-semibold text-amber-900">Dados deste navegador</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Os dados antigos (produtos, clientes, cafeterias, receitas e histórico) que ainda estão
          salvos neste navegador podem ser enviados para o servidor, ficando no banco de dados.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImportar}
            disabled={importando}
            className="flex items-center gap-2 bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Upload size={16} /> {importando ? 'Importando...' : 'Importar dados deste navegador'}
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 border-2 border-brew text-brew hover:bg-brew hover:text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Download size={16} /> Baixar backup (JSON)
          </button>
          {importMsg && (
            <span className="text-sm font-medium text-amber-800">{importMsg}</span>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-amber-800 mb-1">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Carile Cirqueira Cafeteria"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-amber-800 mb-1">Local / Espaço (2ª linha do cabeçalho)</label>
              <input
                type="text"
                value={form.local}
                onChange={e => setForm({ ...form, local: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Espaço Café"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="contato@cafeteria.com.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Responsável</label>
              <input
                type="text"
                value={form.responsavel}
                onChange={e => setForm({ ...form, responsavel: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nome do responsável"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-amber-800 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={form.endereco}
                onChange={e => setForm({ ...form, endereco: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Rua, número, bairro, cidade, UF, CEP"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!form.nome.trim()}
              className="flex items-center gap-1 bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Check size={16} /> {editingId ? 'Atualizar' : 'Salvar'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brew-soft text-white text-left">
              <th className="px-4 py-3 font-semibold">Cafeteria</th>
              <th className="px-4 py-3 font-semibold">CNPJ</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Responsável</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cafeterias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma cafeteria cadastrada.
                </td>
              </tr>
            )}
            {cafeterias.map((cafeteria, idx) => (
              <tr key={cafeteria.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                <td className="px-4 py-3 flex items-center gap-2 font-medium text-amber-900">
                  <Coffee size={16} className="text-amber-600 shrink-0" />
                  <span className="min-w-0">
                    {cafeteria.nome}
                    {cafeteria.local && (
                      <span className="block text-xs text-gray-400 font-normal">({cafeteria.local})</span>
                    )}
                    {cafeteria.endereco && (
                      <span className="block text-xs text-gray-400 font-normal">{cafeteria.endereco}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{cafeteria.cnpj || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cafeteria.telefone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cafeteria.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cafeteria.responsavel || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(cafeteria)}
                    className="text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cafeteria.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
