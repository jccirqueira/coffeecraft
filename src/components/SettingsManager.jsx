import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { maskCNPJ, maskTelefone } from '../utils/masks'
import { Coffee, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

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
  const [cafeterias, setCafeterias] = useLocalStorage('coffeecraft_cafeterias', [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const nextId = cafeterias.length ? Math.max(...cafeterias.map(c => c.id)) + 1 : 1

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  function handleSave() {
    if (!form.nome.trim()) return

    if (editingId) {
      setCafeterias(cafeterias.map(c =>
        c.id === editingId ? { ...form, id: editingId, nome: form.nome.trim() } : c
      ))
    } else {
      setCafeterias([...cafeterias, { ...form, id: nextId, nome: form.nome.trim() }])
    }
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

  function handleDelete(id) {
    setCafeterias(cafeterias.filter(c => c.id !== id))
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
