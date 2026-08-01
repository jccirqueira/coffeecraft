import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, setToken } from './api'

const DataContext = createContext(null)

const TABELAS = ['produtos', 'clientes', 'cafeterias', 'categorias', 'receitas', 'propostas']

const INICIAL = {
  produtos: [],
  clientes: [],
  cafeterias: [],
  categorias: [],
  receitas: [],
  propostas: [],
}

function erroNaMao(e, onLogout) {
  if (e.status === 401) {
    onLogout()
    return true
  }
  return false
}

export function DataProvider({ token, onLogout, children }) {
  const [dados, setDados] = useState(INICIAL)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const categoriaIds = useRef({})

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const novo = {}
      for (const t of TABELAS) {
        novo[t] = await api.list(t)
      }
      const ids = {}
      novo.categorias.forEach(c => { ids[c.nome] = c.id })
      categoriaIds.current = ids
      setDados({
        ...novo,
        categorias: novo.categorias.map(c => c.nome),
      })
    } catch (e) {
      if (erroNaMao(e, onLogout)) return
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [onLogout])

  useEffect(() => {
    setToken(token)
    let cancelado = false

    async function inicial() {
      await carregar()
      if (cancelado) return
    }

    inicial()
    return () => { cancelado = true }
  }, [token, carregar])

  async function mutacao(fn) {
    try {
      return await fn()
    } catch (e) {
      if (erroNaMao(e, onLogout)) return undefined
      setErro(e.message)
      throw e
    }
  }

  async function adicionar(tabela, item) {
    return mutacao(async () => {
      if (tabela === 'categorias') {
        const row = await api.create('categorias', item)
        categoriaIds.current[row.nome] = row.id
        setDados(d => ({ ...d, categorias: [...d.categorias, row.nome] }))
        return row
      }
      const row = await api.create(tabela, item)
      setDados(d => ({ ...d, [tabela]: [...d[tabela], row] }))
      return row
    })
  }

  async function atualizar(tabela, id, item) {
    return mutacao(async () => {
      const row = await api.update(tabela, id, item)
      setDados(d => ({ ...d, [tabela]: d[tabela].map(r => r.id === row.id ? row : r) }))
      return row
    })
  }

  async function renomearCategoria(antiga, nova) {
    return mutacao(async () => {
      const catId = categoriaIds.current[antiga]
      if (!catId) throw new Error('Categoria não encontrada')
      const row = await api.update('categorias', catId, { nome: nova })
      delete categoriaIds.current[antiga]
      categoriaIds.current[row.nome] = row.id
      setDados(d => ({
        ...d,
        categorias: d.categorias.map(c => c === antiga ? row.nome : c),
      }))
      return row
    })
  }

  async function excluir(tabela, id) {
    return mutacao(async () => {
      if (tabela === 'categorias') {
        const nome = id
        const catId = categoriaIds.current[nome]
        if (!catId) throw new Error('Categoria não encontrada')
        await api.remove('categorias', catId)
        delete categoriaIds.current[nome]
        setDados(d => ({ ...d, categorias: d.categorias.filter(c => c !== nome) }))
        return true
      }
      await api.remove(tabela, id)
      setDados(d => ({ ...d, [tabela]: d[tabela].filter(r => r.id !== id) }))
      return true
    })
  }

  const value = {
    ...dados,
    carregando,
    erro,
    setErro,
    carregar,
    adicionar,
    atualizar,
    renomearCategoria,
    excluir,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider')
  return ctx
}
