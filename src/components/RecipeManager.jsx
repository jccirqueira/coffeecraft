import { useState } from 'react'
import { useData } from '../DataContext'
import { BookOpen, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

export default function RecipeManager() {
  const { produtos: products, receitas: recipes, adicionar, atualizar, excluir } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [nome, setNome] = useState('')
  const [itens, setItens] = useState([])
  const [addItemId, setAddItemId] = useState('')
  const [addQtd, setAddQtd] = useState(1)

  const disponiveis = products.filter(p => !itens.find(i => i.id === p.id))

  function resetForm() {
    setNome('')
    setItens([])
    setAddItemId('')
    setAddQtd(1)
    setEditingId(null)
    setShowForm(false)
  }

  function handleAddItem() {
    if (!addItemId) return
    const id = parseInt(addItemId)
    const qtd = parseInt(addQtd) || 1
    if (itens.find(i => i.id === id)) return
    setItens([...itens, { id, qtdPorPessoa: qtd }])
    setAddItemId('')
    setAddQtd(1)
  }

  function handleQtdChange(id, value) {
    setItens(itens.map(i => i.id === id ? { ...i, qtdPorPessoa: parseInt(value) || 0 } : i))
  }

  function handleRemoveItem(id) {
    setItens(itens.filter(i => i.id !== id))
  }

  async function handleSave() {
    if (!nome.trim() || itens.length === 0) return
    const novosItens = itens.map(i => ({ ...i }))

    try {
      if (editingId) {
        await atualizar('receitas', editingId, { nome: nome.trim(), itens: novosItens })
      } else {
        await adicionar('receitas', { nome: nome.trim(), itens: novosItens })
      }
    } catch { return }
    resetForm()
  }

  function handleEdit(recipe) {
    setNome(recipe.nome)
    setItens(recipe.itens.map(i => ({ ...i })))
    setEditingId(recipe.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await excluir('receitas', id)
    } catch { }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Receitas (uso interno)</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-brew hover:bg-brew-dark text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={18} /> Nova Receita
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        As receitas definem as quantidades por pessoa do pacote e não aparecem na proposta do cliente.
        Elas são usadas para distribuir os itens automaticamente entre as datas do coffee break.
      </p>

      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Nome da Receita</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Coffee Break Básico"
              />
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg overflow-hidden mb-4">
            <div className="bg-amber-100/60 px-4 py-2 border-b border-amber-200 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Adicionar Item</label>
                <select
                  value={addItemId}
                  onChange={e => setAddItemId(e.target.value)}
                  className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecione...</option>
                  {disponiveis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} - {p.categoria}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Qtd por Pessoa</label>
                <input
                  type="number"
                  min="1"
                  value={addQtd}
                  onChange={e => setAddQtd(parseInt(e.target.value) || 1)}
                  className="w-20 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleAddItem}
                disabled={!addItemId}
                className="bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {itens.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-400">
                      Nenhum item na receita. Adicione os itens e a quantidade por pessoa.
                    </td>
                  </tr>
                )}
                {itens.map((item, idx) => {
                  const p = products.find(prod => prod.id === item.id)
                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                      <td className="px-4 py-2">{p ? p.nome : 'Item removido'}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.qtdPorPessoa}
                          onChange={e => handleQtdChange(item.id, e.target.value)}
                          className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-600 cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!nome.trim() || itens.length === 0}
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
              <th className="px-4 py-3 font-semibold">Receita</th>
              <th className="px-4 py-3 font-semibold">Itens (por pessoa)</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma receita cadastrada.
                </td>
              </tr>
            )}
            {recipes.map((r, idx) => {
              const labels = r.itens.map(i => {
                const p = products.find(pr => pr.id === i.id)
                return p ? `${p.nome} ×${i.qtdPorPessoa}` : ''
              }).filter(Boolean)
              return (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 flex items-center gap-2 font-semibold text-amber-900">
                    <BookOpen size={16} className="text-amber-600" />
                    {r.nome}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{labels.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(r)}
                      className="text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
