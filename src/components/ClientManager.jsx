import { useState } from 'react'
import { useData } from '../DataContext'
import { maskCPF, maskCNPJ, maskTelefone } from '../utils/masks'
import { Users, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const emptyForm = {
  nome: '',
  cpf: '',
  cnpj: '',
  endereco: '',
  email: '',
  telefone: '',
  contato: '',
}

export default function ClientManager() {
  const { clientes, adicionar, atualizar, excluir } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

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
        await atualizar('clientes', editingId, dados)
      } else {
        await adicionar('clientes', dados)
      }
    } catch { return }
    resetForm()
  }

  function handleEdit(cliente) {
    setForm({
      nome: cliente.nome,
      cpf: cliente.cpf || '',
      cnpj: cliente.cnpj || '',
      endereco: cliente.endereco || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      contato: cliente.contato || '',
    })
    setEditingId(cliente.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await excluir('clientes', id)
    } catch { }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Clientes</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-brew hover:bg-brew-dark text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={18} /> Novo Cliente
        </button>
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
                placeholder="Nome ou razão social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={e => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="000.000.000-00"
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
              <label className="block text-sm font-medium text-amber-800 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="email@empresa.com.br"
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-amber-800 mb-1">Contato</label>
              <input
                type="text"
                value={form.contato}
                onChange={e => setForm({ ...form, contato: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nome da pessoa de contato"
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
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">Contato</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {clientes.map((cliente, idx) => (
              <tr key={cliente.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                <td className="px-4 py-3 flex items-center gap-2 font-medium text-amber-900">
                  <Users size={16} className="text-amber-600 shrink-0" />
                  <span className="min-w-0">
                    {cliente.nome}
                    {cliente.endereco && (
                      <span className="block text-xs text-gray-400 font-normal">{cliente.endereco}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cliente.cpf || cliente.cnpj || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{cliente.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cliente.telefone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cliente.contato || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id)}
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
