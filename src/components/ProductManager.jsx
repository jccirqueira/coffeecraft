import { useState } from 'react'
import { useData } from '../DataContext'
import { Coffee, Utensils, CakeSlice, Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'

const DEFAULT_CATEGORIAS = ['Salgados', 'Doces', 'Bebidas']

const categoriaIcon = {
  Salgados: Utensils,
  Doces: CakeSlice,
  Bebidas: Coffee,
}

function vendaOf(p) {
  return p.precoVenda ?? p.preco ?? 0
}

function custoOf(p) {
  return p.precoCusto ?? 0
}

function formatMoney(v) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function ProductManager() {
  const { produtos: products, categorias: catList, adicionar, atualizar, excluir, renomearCategoria } = useData()
  const categorias = catList.length ? catList : DEFAULT_CATEGORIAS
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nome: '', precoCusto: '', precoVenda: '', categoria: 'Salgados' })
  const [novaCategoria, setNovaCategoria] = useState('')
  const [editandoCategoria, setEditandoCategoria] = useState(null)
  const [editNomeCategoria, setEditNomeCategoria] = useState('')

  function resetForm() {
    setForm({ nome: '', precoCusto: '', precoVenda: '', categoria: 'Salgados' })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.precoVenda) return
    const precoVenda = parseFloat(form.precoVenda)
    if (isNaN(precoVenda) || precoVenda <= 0) return
    const precoCusto = parseFloat(form.precoCusto)
    const custo = isNaN(precoCusto) || precoCusto < 0 ? 0 : precoCusto
    const dados = { nome: form.nome.trim(), precoCusto: custo, precoVenda, categoria: form.categoria }

    try {
      if (editingId) {
        await atualizar('produtos', editingId, dados)
      } else {
        await adicionar('produtos', dados)
      }
    } catch { return }
    resetForm()
  }

  function handleEdit(product) {
    setForm({
      nome: product.nome,
      precoCusto: String(custoOf(product) || ''),
      precoVenda: String(vendaOf(product) || ''),
      categoria: product.categoria,
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    try {
      await excluir('produtos', id)
    } catch { }
  }

  async function handleAddCategoria() {
    const nome = novaCategoria.trim()
    if (!nome || categorias.includes(nome)) return
    try {
      await adicionar('categorias', { nome })
      setNovaCategoria('')
    } catch { }
  }

  async function handleRenameCategoria() {
    const nome = editNomeCategoria.trim()
    const antiga = editandoCategoria
    if (!antiga) return
    if (!nome || nome === antiga) {
      setEditandoCategoria(null)
      return
    }
    if (categorias.includes(nome)) return
    try {
      await renomearCategoria(antiga, nome)
      setEditandoCategoria(null)
    } catch { }
  }

  async function handleDeleteCategoria(nome) {
    if (!confirm(`Excluir a categoria "${nome}"? Os produtos desta categoria continuarão cadastrados.`)) return
    try {
      await excluir('categorias', nome)
    } catch { }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Cardápio / Produtos</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-brew hover:bg-brew-dark text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={18} /> Novo Item
        </button>
      </div>

      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Nome do Item</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Brownie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Preço Unit. Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precoCusto}
                onChange={e => setForm({ ...form, precoCusto: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Preço Unit. Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precoVenda}
                onChange={e => setForm({ ...form, precoVenda: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-brew hover:bg-brew-dark text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brew-soft text-white text-left">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Preço Custo</th>
              <th className="px-4 py-3 font-semibold">Preço Venda</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
            {products.map((product, idx) => {
              const Icon = categoriaIcon[product.categoria] || Coffee
              return (
                <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Icon size={16} className="text-amber-600" />
                    {product.nome}
                  </td>
                  <td className="px-4 py-3">{formatMoney(custoOf(product))}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(vendaOf(product))}</td>
                  <td className="px-4 py-3">
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                      {product.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <Tag size={16} className="text-amber-700" />
          <h3 className="font-semibold text-gray-700">Categorias</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nova Categoria</label>
              <input
                type="text"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategoria() }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Frutas"
              />
            </div>
            <button
              onClick={handleAddCategoria}
              disabled={!novaCategoria.trim()}
              className="flex items-center gap-1 bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => {
              const Icon = categoriaIcon[cat] || Tag
              return (
                <div
                  key={cat}
                  className="flex items-center gap-2 bg-amber-100 text-amber-900 text-sm px-3 py-1.5 rounded-full"
                >
                  <Icon size={14} className="text-amber-600" />
                  {editandoCategoria === cat ? (
                    <>
                      <input
                        type="text"
                        value={editNomeCategoria}
                        onChange={e => setEditNomeCategoria(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameCategoria() }}
                        className="w-28 border border-amber-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <button onClick={handleRenameCategoria} className="text-green-600 hover:text-green-800 cursor-pointer" title="Confirmar">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditandoCategoria(null)} className="text-gray-500 hover:text-gray-700 cursor-pointer" title="Cancelar">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      {cat}
                      <button
                        onClick={() => { setEditandoCategoria(cat); setEditNomeCategoria(cat) }}
                        className="text-amber-600 hover:text-amber-800 cursor-pointer"
                        title="Renomear"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoria(cat)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
