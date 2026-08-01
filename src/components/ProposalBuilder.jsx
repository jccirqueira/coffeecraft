import { useState, useRef, useMemo, useCallback } from 'react'
import { useData } from '../DataContext'
import { api } from '../api'
import { Plus, Trash2, Printer, Percent, DollarSign, BookOpen, Wand2, Save, History, RefreshCw, FolderOpen } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function novaSessao(id) {
  return { id, data: '', horaInicio: '', horaFim: '', participantes: 1, itens: [] }
}

function vendaOf(p) {
  return p.precoVenda ?? p.preco ?? 0
}

function custoOf(p) {
  return p.precoCusto ?? 0
}

export default function ProposalBuilder() {
  const { produtos: products, receitas, clientes, cafeterias, categorias, propostas: historico, adicionar, excluir } = useData()
  const [cliente, setCliente] = useState('')
  const [cafeteriaId, setCafeteriaId] = useState('')
  const [sessoes, setSessoes] = useState([novaSessao(1)])
  const [receitaItens, setReceitaItens] = useState([])
  const [receitaSelecionada, setReceitaSelecionada] = useState('')
  const [nomeNovaReceita, setNomeNovaReceita] = useState('')
  const [taxaTipo, setTaxaTipo] = useState('percentual')
  const [taxaValor, setTaxaValor] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [receitaMsg, setReceitaMsg] = useState('')
  const [addForm, setAddForm] = useState(null)
  const [numeroAtual, setNumeroAtual] = useState('')
  const [propostaMsg, setPropostaMsg] = useState('')
  const nextSessaoId = useRef(1)
  const pdfRef = useRef(null)
  const resultadoPdfRef = useRef(null)

  const cafeteria = cafeterias.find(c => c.id === parseInt(cafeteriaId)) || null

  async function gerarNumeroProposta() {
    const hoje = new Date()
    const dd = String(hoje.getDate()).padStart(2, '0')
    const mm = String(hoje.getMonth() + 1).padStart(2, '0')
    const aa = String(hoje.getFullYear()).slice(-2)
    const chave = `${dd}${mm}${aa}`
    const res = await api.contadorNext(chave)
    return `${chave}-${String(res.seq).padStart(2, '0')}-R00`
  }

  async function salvarProposta(criarRevisao) {
    if (!podeGerarPDF) {
      setPropostaMsg('Preencha o cliente e adicione itens antes de salvar.')
      setTimeout(() => setPropostaMsg(''), 4000)
      return
    }

    let numero = numeroAtual
    try {
      if (!numero) {
        numero = await gerarNumeroProposta()
      }

      if (criarRevisao && numeroAtual) {
        const base = numeroAtual.slice(0, -3)
        const rev = parseInt(numeroAtual.slice(-2)) + 1
        numero = `${base}R${String(rev).padStart(2, '0')}`
      }

      const entrada = {
        numero,
        cliente,
        cafeteriaId: parseInt(cafeteriaId) || 0,
        cafeteriaNome: cafeteria ? cafeteria.nome : '',
        cafeteriaLocal: cafeteria && cafeteria.local ? cafeteria.local : '',
        sessoes: JSON.parse(JSON.stringify(sessoes)),
        taxaTipo,
        taxaValor,
        subtotal,
        totalGeral,
        salvoEm: new Date().toISOString(),
      }

      await adicionar('propostas', entrada)
    } catch {
      setPropostaMsg('Erro ao salvar a proposta. Tente novamente.')
      setTimeout(() => setPropostaMsg(''), 4000)
      return
    }

    setNumeroAtual(numero)
    setPropostaMsg(criarRevisao
      ? `Revisão criada: ${numero}`
      : `Proposta salva: ${numero}`)
    setTimeout(() => setPropostaMsg(''), 4000)
  }

  function carregarProposta(entrada) {
    setCliente(entrada.cliente)
    setCafeteriaId(String(entrada.cafeteriaId || ''))
    setSessoes(entrada.sessoes.map(s => ({ ...s, itens: s.itens.map(i => ({ ...i })) })))
    setTaxaTipo(entrada.taxaTipo || 'percentual')
    setTaxaValor(entrada.taxaValor || 0)
    setNumeroAtual(entrada.numero)
    setPropostaMsg(`Proposta ${entrada.numero} carregada.`)
    setTimeout(() => setPropostaMsg(''), 4000)
  }

  async function excluirProposta(id) {
    try {
      await excluir('propostas', id)
    } catch { }
  }

  function formatMoney(v) {
    return `R$ ${v.toFixed(2).replace('.', ',')}`
  }

  function dataLabel(s) {
    return s.data ? new Date(s.data).toLocaleDateString('pt-BR') : 'sem data'
  }

  function horarioLabel(s) {
    if (s.horaInicio && s.horaFim) return `${s.horaInicio} às ${s.horaFim}`
    return s.horaInicio || s.horaFim || ''
  }

  function orderByCategoria(itens) {
    const catOrder = {}
    categorias.forEach((cat, i) => { catOrder[cat] = i })

    const grouped = {}
    itens.forEach(item => {
      const p = products.find(prod => prod.id === item.id)
      const cat = p ? p.categoria : 'Outros'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push({ ...item, product: p })
    })

    const result = []
    Object.keys(grouped)
      .sort((a, b) => (catOrder[a] ?? 99) - (catOrder[b] ?? 99))
      .forEach(cat => {
        result.push({ type: 'header', categoria: cat })
        grouped[cat].forEach(item => result.push({ type: 'item', ...item }))
      })
    return result
  }

  function sessaoSubtotal(sessao) {
    return sessao.itens.reduce((acc, si) => {
      const p = products.find(prod => prod.id === si.id)
      if (!p) return acc
      return acc + si.qtdPorPessoa * sessao.participantes * vendaOf(p)
    }, 0)
  }

  function sessaoCusto(sessao) {
    return sessao.itens.reduce((acc, si) => {
      const p = products.find(prod => prod.id === si.id)
      if (!p) return acc
      return acc + si.qtdPorPessoa * sessao.participantes * custoOf(p)
    }, 0)
  }

  function sessaoResultado(sessao) {
    return sessaoSubtotal(sessao) - sessaoCusto(sessao)
  }

  const subtotal = sessoes.reduce((acc, s) => acc + sessaoSubtotal(s), 0)

  const taxaCalculada = useMemo(() => {
    if (taxaTipo === 'percentual') return subtotal * (taxaValor / 100)
    return taxaValor
  }, [taxaTipo, taxaValor, subtotal])

  const totalGeral = subtotal + taxaCalculada

  const custoTotal = sessoes.reduce((acc, s) => acc + sessaoCusto(s), 0)
  const resultado = totalGeral - custoTotal
  const margem = totalGeral > 0 ? (resultado / totalGeral) * 100 : 0

  const podeGerarPDF = cliente.trim() !== '' && sessoes.some(s => s.itens.length > 0)

  function addSessao() {
    nextSessaoId.current += 1
    setSessoes([...sessoes, novaSessao(nextSessaoId.current)])
  }

  function removeSessao(id) {
    setSessoes(sessoes.filter(s => s.id !== id))
    setAddForm(null)
  }

  function updateSessao(id, campo, valor) {
    setSessoes(sessoes.map(s => s.id === id ? { ...s, [campo]: valor } : s))
  }

  function handleAddItemSessao(sessaoId) {
    if (!addForm || addForm.sessaoId !== sessaoId || !addForm.itemId) return
    const id = parseInt(addForm.itemId)
    const qtd = parseInt(addForm.qtd) || 1
    setSessoes(sessoes.map(s => s.id === sessaoId ? {
      ...s,
      itens: s.itens.some(i => i.id === id) ? s.itens : [...s.itens, { id, qtdPorPessoa: qtd }],
    } : s))
    setAddForm(null)
  }

  function updateQtdSessao(sessaoId, itemId, value) {
    setSessoes(sessoes.map(s => s.id === sessaoId ? {
      ...s,
      itens: s.itens.map(i => i.id === itemId ? { ...i, qtdPorPessoa: parseInt(value) || 0 } : i),
    } : s))
  }

  function removeItemSessao(sessaoId, itemId) {
    setSessoes(sessoes.map(s => s.id === sessaoId ? {
      ...s,
      itens: s.itens.filter(i => i.id !== itemId),
    } : s))
  }

  function carregarReceita(id) {
    const r = receitas.find(rec => rec.id === parseInt(id))
    if (!r) return
    setReceitaItens(r.itens.map(i => ({ ...i })))
    setReceitaSelecionada(id)
    setReceitaMsg('')
  }

  function handleAddItemReceita() {
    if (!addForm || addForm.sessaoId !== 'receita' || !addForm.itemId) return
    const id = parseInt(addForm.itemId)
    const qtd = parseInt(addForm.qtd) || 1
    if (receitaItens.find(i => i.id === id)) return
    setReceitaItens([...receitaItens, { id, qtdPorPessoa: qtd }])
    setAddForm(null)
  }

  function updateQtdReceita(itemId, value) {
    setReceitaItens(receitaItens.map(i => i.id === itemId ? { ...i, qtdPorPessoa: parseInt(value) || 0 } : i))
  }

  function removeItemReceita(itemId) {
    setReceitaItens(receitaItens.filter(i => i.id !== itemId))
  }

  async function salvarNovaReceita() {
    const nome = nomeNovaReceita.trim()
    if (!nome || receitaItens.length === 0) return
    try {
      await adicionar('receitas', { nome, itens: receitaItens.map(i => ({ ...i })) })
    } catch { return }
    setNomeNovaReceita('')
    setReceitaMsg('Receita salva com sucesso!')
    setTimeout(() => setReceitaMsg(''), 3000)
  }

  function distribuirNosDias() {
    if (sessoes.length === 0) {
      setReceitaMsg('Adicione ao menos uma data/horário antes de distribuir.')
      return
    }
    if (receitaItens.length === 0) {
      setReceitaMsg('Crie ou carregue uma receita antes de distribuir.')
      return
    }

    const novas = sessoes.map(s => ({ ...s, itens: [] }))

    receitaItens.forEach(ri => {
      const p = products.find(pr => pr.id === ri.id)
      if (!p) return

      if (p.categoria === 'Bebidas') {
        novas.forEach(s => {
          s.itens.push({ id: ri.id, qtdPorPessoa: ri.qtdPorPessoa })
        })
        return
      }

      let best = null
      novas.forEach(s => {
        const load = s.itens.reduce((acc, i) => acc + i.qtdPorPessoa, 0)
        const hasCat = s.itens.some(i => {
          const pr = products.find(prod => prod.id === i.id)
          return pr && pr.categoria === p.categoria
        })
        if (!best || load < best.load || (load === best.load && !hasCat && best.hasCat)) {
          best = { s, load, hasCat }
        }
      })
      best.s.itens.push({ id: ri.id, qtdPorPessoa: ri.qtdPorPessoa })
    })

    setSessoes(novas)
    setReceitaMsg('Itens distribuídos entre as datas! Ajuste manualmente se precisar.')
    setTimeout(() => setReceitaMsg(''), 5000)
  }

  const pdfContainerRef = useCallback(node => {
    pdfRef.current = node
  }, [])

  const resultadoPdfContainerRef = useCallback(node => {
    resultadoPdfRef.current = node
  }, [])

  async function capturarPDF(ref, nomeArquivo) {
    if (!ref.current) return
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: ref.current.scrollWidth,
        height: ref.current.scrollHeight,
        windowWidth: ref.current.scrollWidth,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      pdf.save(nomeArquivo)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.')
    }
  }

  async function gerarPDF() {
    if (!pdfRef.current) return
    await capturarPDF(pdfRef, `proposta_coffeecraft_${cliente.replace(/\s+/g, '_') || 'cliente'}.pdf`)
    setSuccessMessage('PDF gerado com sucesso!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  async function gerarPDFResultado() {
    if (!resultadoPdfRef.current) return
    await capturarPDF(resultadoPdfRef, `resultado_coffeecraft_${cliente.replace(/\s+/g, '_') || 'cliente'}.pdf`)
  }

  function pdfItemRows(itens, participantes) {
    const rows = []
    const entries = orderByCategoria(itens)
    entries.forEach((entry, i) => {
      if (entry.type === 'header') {
        rows.push(
          <tr key={`cat-${entry.categoria}`}>
            <td colSpan={3} style={{
              padding: '4px 12px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 'bold',
              fontSize: '12px',
              borderBottom: '1px solid #fde68a',
            }}>
              {entry.categoria}
            </td>
          </tr>
        )
        return
      }
      const p = entry.product
      if (!p) return
      const qtdTotal = entry.qtdPorPessoa * participantes
      rows.push(
        <tr
          key={entry.id}
          style={{
            backgroundColor: i % 2 === 0 ? '#fff' : '#fafaf9',
            borderBottom: '1px solid #e7e5e4',
          }}
        >
          <td style={{ padding: '4px 12px' }}>{p.nome}</td>
          <td style={{ padding: '4px 12px', textAlign: 'center' }}>{entry.qtdPorPessoa}</td>
          <td style={{ padding: '4px 12px', textAlign: 'center' }}>{qtdTotal}</td>
        </tr>
      )
    })
    return rows
  }

  function pdfHeader(tituloCor, bordaCor, subtitulo) {
    return (
      <div style={{
        borderBottom: `4px solid ${bordaCor}`,
        paddingBottom: '12px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: tituloCor, margin: 0 }}>
            {cafeteria ? cafeteria.nome : '☕ CoffeeCraft'}
          </h1>
          {cafeteria && cafeteria.local && (
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: tituloCor, margin: '2px 0 0' }}>
              ({cafeteria.local})
            </p>
          )}
          <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0' }}>
            {subtitulo}
          </p>
        </div>
        <div style={{ textAlign: 'left', fontSize: '11px', color: '#78716c' }}>
          <p style={{ margin: '0 0 1px' }}>Celular: (16) 99768-8203</p>
          <p style={{ margin: '0 0 1px' }}>E-mail: fabianacarile@gmail.com</p>
          <p style={{ margin: '0 0 1px' }}>Avenida Presidente Vargas, 2001, Sala 2</p>
          <p style={{ margin: '0 0 1px' }}>CEP: 14020-260 - Jardim Califórnia</p>
          <p style={{ margin: 0 }}>Ribeirão Preto - SP</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h2 className="text-xl font-bold text-amber-900">Nova Proposta</h2>
        {numeroAtual && (
          <span className="text-sm font-semibold bg-brew-soft text-white px-3 py-1.5 rounded-lg">
            Proposta nº {numeroAtual}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-1">Cafeteria que fornecerá o coffee break</label>
        <select
          value={cafeteriaId}
          onChange={e => setCafeteriaId(e.target.value)}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
        >
          <option value="">Nenhuma selecionada</option>
          {cafeterias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {cafeterias.length === 0 && (
          <p className="text-xs text-gray-400 -mt-3 mb-4">
            Nenhuma cafeteria cadastrada. Adicione em Configurações.
          </p>
        )}
        <label className="block text-sm font-medium text-gray-600 mb-1">Cliente cadastrado</label>
        <select
          value=""
          onChange={e => { if (e.target.value) setCliente(e.target.value) }}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
        >
          <option value="">Selecione um cliente...</option>
          {clientes.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>
        <label className="block text-sm font-medium text-gray-600 mb-1">Cliente / Empresa</label>
        <input
          type="text"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Nome do cliente"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Datas e Horários</h3>
          <button
            onClick={addSessao}
            className="flex items-center gap-1 text-sm bg-brew hover:bg-brew-dark text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={15} /> Adicionar Data
          </button>
        </div>

        {sessoes.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">
            Nenhuma data adicionada. Clique em "Adicionar Data" para criar uma sessão.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessoes.map((s, i) => (
              <div key={s.id} className="px-5 py-4 grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Evento</label>
                  <div className="font-bold text-amber-800 py-1.5">{i + 1}</div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                  <input
                    type="date"
                    value={s.data}
                    onChange={e => updateSessao(s.id, 'data', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
                  <input
                    type="time"
                    value={s.horaInicio}
                    onChange={e => updateSessao(s.id, 'horaInicio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fim</label>
                  <input
                    type="time"
                    value={s.horaFim}
                    onChange={e => updateSessao(s.id, 'horaFim', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Participantes</label>
                  <input
                    type="number"
                    min="1"
                    value={s.participantes}
                    onChange={e => updateSessao(s.id, 'participantes', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeSessao(s.id)}
                    className="text-red-400 hover:text-red-600 cursor-pointer"
                    title="Remover data"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-amber-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <BookOpen size={18} className="text-amber-700" />
            Receita do Pacote
          </h3>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            Uso interno — não aparece no PDF do cliente
          </span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Carregar receita salva</label>
          <select
            value={receitaSelecionada}
            onChange={e => { carregarReceita(e.target.value) }}
            className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Selecione...</option>
            {receitas.map(r => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
          {receitas.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Nenhuma receita salva ainda. Crie uma na aba Receitas ou monte abaixo.
            </p>
          )}
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-lg overflow-hidden mb-3">
          <div className="px-4 py-2 border-b border-amber-200 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1">Adicionar Item</label>
              <select
                value={addForm && addForm.sessaoId === 'receita' ? addForm.itemId : ''}
                onChange={e => setAddForm({ sessaoId: 'receita', itemId: e.target.value, qtd: addForm ? addForm.qtd : 1 })}
                className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecione...</option>
                {products.filter(p => !receitaItens.find(i => i.id === p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - {p.categoria}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1">Qtd por Pessoa</label>
              <input
                type="number"
                min="1"
                value={addForm && addForm.sessaoId === 'receita' ? addForm.qtd : 1}
                onChange={e => setAddForm({
                  sessaoId: 'receita',
                  itemId: addForm ? addForm.itemId : '',
                  qtd: parseInt(e.target.value) || 1,
                })}
                className="w-20 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={handleAddItemReceita}
              disabled={!addForm || addForm.sessaoId !== 'receita' || !addForm.itemId}
              className="bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
          </div>

          <table className="w-full text-sm">
            <tbody>
              {receitaItens.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400">
                    Receita vazia. Adicione os itens e as quantidades por pessoa do pacote.
                  </td>
                </tr>
              )}
              {receitaItens.map((item, idx) => {
                const p = products.find(prod => prod.id === item.id)
                return (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-4 py-2">{p ? p.nome : 'Item removido'}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.qtdPorPessoa}
                        onChange={e => updateQtdReceita(item.id, e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => removeItemReceita(item.id)}
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={distribuirNosDias}
            disabled={receitaItens.length === 0 || sessoes.length === 0}
            className="flex items-center gap-2 bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Wand2 size={18} /> Distribuir nos Dias
          </button>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={nomeNovaReceita}
              onChange={e => setNomeNovaReceita(e.target.value)}
              className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Nome da nova receita"
            />
            <button
              onClick={salvarNovaReceita}
              disabled={!nomeNovaReceita.trim() || receitaItens.length === 0}
              className="flex items-center gap-1 text-sm border border-brew text-brew hover:bg-brew/5 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Save size={15} /> Salvar como Receita
            </button>
          </div>
        </div>
        {receitaMsg && (
          <p className="text-sm text-amber-700 mt-3">{receitaMsg}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">Itens por Dia</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Ajuste livremente após a distribuição automática.
          </p>
        </div>

        {sessoes.length === 0 && (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">
            Adicione uma data na seção "Datas e Horários".
          </p>
        )}

        {sessoes.map((s, i) => {
          const entries = orderByCategoria(s.itens)
          const disponiveis = products.filter(p => !s.itens.find(si => si.id === p.id))
          return (
            <div key={s.id} className="border-b border-gray-100 last:border-b-0">
              <div className="bg-gray-50/60 px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-amber-900">
                  Evento {i + 1} — {dataLabel(s)}
                  {horarioLabel(s) && <span className="text-gray-500 font-normal"> · {horarioLabel(s)}</span>}
                  <span className="text-gray-500 font-normal"> · {s.participantes} participante(s)</span>
                </span>
                <button
                  onClick={() => setAddForm({ sessaoId: s.id, itemId: '', qtd: 1 })}
                  disabled={disponiveis.length === 0}
                  className="flex items-center gap-1 text-sm bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus size={14} /> Adicionar Item
                </button>
              </div>

              {addForm && addForm.sessaoId === s.id && (
                <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">Item</label>
                    <select
                      value={addForm.itemId}
                      onChange={e => setAddForm({ ...addForm, itemId: e.target.value })}
                      className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Selecione...</option>
                      {disponiveis.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} - R$ {vendaOf(p).toFixed(2).replace('.', ',')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">Qtd por Pessoa</label>
                    <input
                      type="number"
                      min="1"
                      value={addForm.qtd}
                      onChange={e => setAddForm({ ...addForm, qtd: parseInt(e.target.value) || 1 })}
                      className="w-20 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => handleAddItemSessao(s.id)}
                    disabled={!addForm.itemId}
                    className="bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setAddForm(null)}
                    className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold text-center">Qtd / Pessoa</th>
                    <th className="px-4 py-3 font-semibold text-center">Participantes</th>
                    <th className="px-4 py-3 font-semibold text-center">Qtd Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Preço Unit.</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                        Nenhum item nesta sessão. Use a receita para distribuir ou adicione manualmente.
                      </td>
                    </tr>
                  )}
                  {entries.map((entry, idx) => {
                    if (entry.type === 'header') {
                      return (
                        <tr key={`header-${entry.categoria}`}>
                          <td colSpan={7} className="px-4 py-2 bg-amber-100 text-amber-800 font-semibold text-sm">
                            {entry.categoria}
                          </td>
                        </tr>
                      )
                    }
                    const p = entry.product
                    if (!p) return null
                    const qtdTotal = entry.qtdPorPessoa * s.participantes
                    const totalItem = qtdTotal * vendaOf(p)
                    return (
                      <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3">{p.nome}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.qtdPorPessoa}
                            onChange={e => updateQtdSessao(s.id, entry.id, e.target.value)}
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{s.participantes}</td>
                        <td className="px-4 py-3 text-center font-medium">{qtdTotal}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(vendaOf(p))}</td>
                        <td className="px-4 py-3 text-right font-medium text-amber-800">{formatMoney(totalItem)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItemSessao(s.id, entry.id)}
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
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
              {taxaTipo === 'percentual' ? <Percent size={14} /> : <DollarSign size={14} />}
              Taxa / Desconto
            </label>
            <div className="flex gap-2">
              <select
                value={taxaTipo}
                onChange={e => setTaxaTipo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="percentual">%</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={taxaValor}
                onChange={e => setTaxaValor(parseFloat(e.target.value) || 0)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0"
              />
            </div>
          </div>
          <div className="sm:col-span-2 sm:text-right">
            {sessoes.map((s, i) => (
              <div key={s.id} className="text-sm text-gray-500">
                Evento {i + 1} ({dataLabel(s)}):{' '}
                <span className="text-gray-700 font-medium">{formatMoney(sessaoSubtotal(s))}</span>
              </div>
            ))}
            <div className="text-sm text-gray-500">
              Subtotal: <span className="text-gray-700 font-medium">{formatMoney(subtotal)}</span>
            </div>
            <div className="text-sm text-gray-500">
              {taxaTipo === 'percentual'
                ? `Taxa (${taxaValor}%):`
                : 'Taxa / Desconto:'}{' '}
              <span className={taxaCalculada >= 0 ? 'text-gray-700 font-medium' : 'text-green-600 font-medium'}>
                {formatMoney(taxaCalculada)}
              </span>
            </div>
            <div className="text-lg font-bold text-amber-800 mt-1">
              Total Geral: {formatMoney(totalGeral)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden mb-6">
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-emerald-900">Resultado Financeiro</h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
            Uso interno — não aparece no PDF do cliente
          </span>
        </div>

        <div className="p-5">
          {sessoes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Adicione datas na seção "Datas e Horários".
            </p>
          )}

          {sessoes.map((s, i) => (
            <div key={s.id} className="mb-5 last:mb-0">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Sessão {i + 1} — {dataLabel(s)}
                {horarioLabel(s) && <span className="text-gray-500 font-normal"> · {horarioLabel(s)}</span>}
                <span className="text-gray-500 font-normal"> · {s.participantes} participante(s)</span>
              </div>
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-emerald-100 text-emerald-900 text-left">
                    <th className="px-3 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold text-center">Qtd Total</th>
                    <th className="px-3 py-2 font-semibold text-right">Custo Unit.</th>
                    <th className="px-3 py-2 font-semibold text-right">Venda Unit.</th>
                    <th className="px-3 py-2 font-semibold text-right">Custo Total</th>
                    <th className="px-3 py-2 font-semibold text-right">Venda Total</th>
                    <th className="px-3 py-2 font-semibold text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {s.itens.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                        Sem itens nesta sessão.
                      </td>
                    </tr>
                  )}
                  {s.itens.map((si, idx) => {
                    const p = products.find(prod => prod.id === si.id)
                    if (!p) return null
                    const qtdTotal = si.qtdPorPessoa * s.participantes
                    const custoTotal = qtdTotal * custoOf(p)
                    const vendaTotal = qtdTotal * vendaOf(p)
                    const res = vendaTotal - custoTotal
                    return (
                      <tr key={si.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'}>
                        <td className="px-3 py-2">{p.nome}</td>
                        <td className="px-3 py-2 text-center">{qtdTotal}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(custoOf(p))}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(vendaOf(p))}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(custoTotal)}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(vendaTotal)}</td>
                        <td className={`px-3 py-2 text-right font-medium ${res >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatMoney(res)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-emerald-50 border-t border-emerald-200 font-medium">
                    <td colSpan={4} className="px-3 py-2 text-right text-emerald-900">Subtotal Evento {i + 1}</td>
                    <td className="px-3 py-2 text-right text-emerald-900">{formatMoney(sessaoCusto(s))}</td>
                    <td className="px-3 py-2 text-right text-emerald-900">{formatMoney(sessaoSubtotal(s))}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${sessaoResultado(s) >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
                      {formatMoney(sessaoResultado(s))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <div className="border-t-2 border-emerald-200 pt-4 mt-2 text-right">
            <div className="text-sm text-gray-500">
              Receita Total (Venda + Taxa): <span className="text-gray-700 font-medium">{formatMoney(totalGeral)}</span>
            </div>
            <div className="text-sm text-gray-500">
              Custo Total: <span className="text-gray-700 font-medium">{formatMoney(custoTotal)}</span>
            </div>
            <div className={`text-lg font-bold mt-1 ${resultado >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              Resultado: {formatMoney(resultado)}
            </div>
            <div className="text-sm text-gray-500">
              Margem: <span className="text-gray-700 font-medium">{margem.toFixed(1).replace('.', ',')}%</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={gerarPDFResultado}
              disabled={!podeGerarPDF}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer size={18} /> Gerar PDF do Resultado (uso interno)
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={gerarPDF}
          disabled={!podeGerarPDF}
          className="flex items-center gap-2 bg-brew hover:bg-brew-dark disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Printer size={20} /> Gerar Proposta em PDF
        </button>
        <button
          onClick={() => salvarProposta(false)}
          disabled={!podeGerarPDF}
          className="flex items-center gap-2 border-2 border-brew text-brew hover:bg-brew disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Save size={20} /> Salvar Proposta
        </button>
        <button
          onClick={() => salvarProposta(true)}
          disabled={!podeGerarPDF || !numeroAtual}
          className="flex items-center gap-2 border-2 border-brew text-brew hover:bg-brew disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent px-5 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} /> Criar Revisão
        </button>
        <div className="flex flex-col">
          {successMessage && (
            <span className="text-green-600 font-medium text-sm">{successMessage}</span>
          )}
          {propostaMsg && (
            <span className="text-brew font-medium text-sm">{propostaMsg}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <History size={16} className="text-brew" />
          <h3 className="font-semibold text-gray-700">Histórico de Propostas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brew-soft text-white text-left">
              <th className="px-4 py-3 font-semibold">Número</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Cafeteria</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Salvo em</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {historico.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma proposta salva ainda. Use "Salvar Proposta" para gerar o número e guardar o histórico.
                </td>
              </tr>
            )}
            {historico.map((h, idx) => (
              <tr key={h.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                <td className="px-4 py-3 font-semibold text-amber-900">{h.numero}</td>
                <td className="px-4 py-3">{h.cliente}</td>
                <td className="px-4 py-3 text-gray-600">{h.cafeteriaNome || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatMoney(h.totalGeral)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(h.salvoEm).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => carregarProposta(h)}
                    className="text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                    title="Carregar"
                  >
                    <FolderOpen size={16} />
                  </button>
                  <button
                    onClick={() => excluirProposta(h.id)}
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

      <div className="fixed left-[-9999px] top-0" ref={pdfContainerRef}>
        <div
          style={{
            width: '800px',
            padding: '40px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#333',
            backgroundColor: '#fff',
          }}
        >
          {pdfHeader('#92400e', '#d97706', 'Proposta de Coffee Break')}

          <div style={{ marginBottom: '16px', fontSize: '14px' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#57534e' }}><strong>Cliente:</strong> </span>
              {cliente || '—'}
            </div>
            <div>
              <span style={{ color: '#57534e' }}><strong>Proposta nº:</strong> </span>
              {numeroAtual || '—'}
            </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#d97706', color: '#fff' }}>
                  <th style={{ padding: '5px 12px', textAlign: 'left', fontWeight: 'bold' }}>Evento</th>
                  <th style={{ padding: '5px 12px', textAlign: 'left', fontWeight: 'bold' }}>Data</th>
                  <th style={{ padding: '5px 12px', textAlign: 'left', fontWeight: 'bold' }}>Horário</th>
                  <th style={{ padding: '5px 12px', textAlign: 'center', fontWeight: 'bold' }}>Participantes</th>
                </tr>
              </thead>
              <tbody>
                {sessoes.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
                    <td style={{ padding: '4px 12px', fontWeight: 'bold' }}>Evento {i + 1}</td>
                    <td style={{ padding: '4px 12px' }}>{dataLabel(s)}</td>
                    <td style={{ padding: '4px 12px' }}>{horarioLabel(s) || '—'}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>{s.participantes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          {sessoes.map((s, i) => (
            <div key={s.id} style={{ marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 'bold',
                fontSize: '13px',
                padding: '5px 12px',
                borderBottom: '1px solid #fde68a',
                borderRadius: '4px 4px 0 0',
              }}>
                Sessão {i + 1} — {dataLabel(s)}
                {horarioLabel(s) ? ` das ${horarioLabel(s)}` : ''} · {s.participantes} participante(s)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#d97706', color: '#fff' }}>
                    <th style={{ padding: '5px 12px', textAlign: 'left', fontWeight: 'bold' }}>Item</th>
                    <th style={{ padding: '5px 12px', textAlign: 'center', fontWeight: 'bold' }}>Qtd / Pessoa</th>
                    <th style={{ padding: '5px 12px', textAlign: 'center', fontWeight: 'bold' }}>Qtd Total</th>
                  </tr>
                </thead>
                <tbody>
                  {s.itens.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '6px', textAlign: 'center', color: '#a8a29e' }}>
                        Sem itens nesta sessão.
                      </td>
                    </tr>
                  )}
                  {pdfItemRows(s.itens, s.participantes)}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#57534e' }}>Subtotal: </span>
              <span style={{ fontWeight: 'bold' }}>{formatMoney(subtotal)}</span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#57534e' }}>
                {taxaTipo === 'percentual' ? `Taxa (${taxaValor}%):` : 'Taxa / Desconto:'}
              </span>{' '}
              <span style={{ fontWeight: 'bold', color: taxaCalculada >= 0 ? '#333' : '#16a34a' }}>
                {formatMoney(taxaCalculada)}
              </span>
            </div>
            <div style={{
              borderTop: '2px solid #d97706',
              paddingTop: '6px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#92400e',
            }}>
              Total Geral: {formatMoney(totalGeral)}
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #d6d3d1',
            paddingTop: '8px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#a8a29e',
          }}>
            Proposta {numeroAtual ? `nº ${numeroAtual} · ` : ''}gerada via CoffeeCraft
          </div>
        </div>
      </div>

      <div className="fixed left-[-9999px] top-0" ref={resultadoPdfContainerRef}>
        <div
          style={{
            width: '800px',
            padding: '40px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#333',
            backgroundColor: '#fff',
          }}
        >
          {pdfHeader('#065f46', '#059669', 'Resultado Financeiro — Coffee Break (uso interno)')}

          <div style={{ marginBottom: '16px', fontSize: '14px' }}>
            <span style={{ color: '#57534e' }}><strong>Cliente:</strong> </span>
            {cliente || '—'}
            <span style={{ color: '#57534e', marginLeft: '24px' }}><strong>Total Geral:</strong> </span>
            <strong>{formatMoney(totalGeral)}</strong>
            {numeroAtual && (
              <>
                <span style={{ color: '#57534e', marginLeft: '24px' }}><strong>Proposta nº:</strong> </span>
                <strong>{numeroAtual}</strong>
              </>
            )}
          </div>

          {sessoes.map((s, i) => (
            <div key={s.id} style={{ marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#d1fae5',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '13px',
                padding: '5px 12px',
                borderBottom: '1px solid #a7f3d0',
                borderRadius: '4px 4px 0 0',
              }}>
                Sessão {i + 1} — {dataLabel(s)}
                {horarioLabel(s) ? ` das ${horarioLabel(s)}` : ''} · {s.participantes} participante(s)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#059669', color: '#fff' }}>
                    <th style={{ padding: '5px 12px', textAlign: 'left', fontWeight: 'bold' }}>Item</th>
                    <th style={{ padding: '5px 12px', textAlign: 'center', fontWeight: 'bold' }}>Qtd Total</th>
                    <th style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Custo Unit.</th>
                    <th style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Venda Unit.</th>
                    <th style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Custo Total</th>
                    <th style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Venda Total</th>
                    <th style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {s.itens.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '6px', textAlign: 'center', color: '#a8a29e' }}>
                        Sem itens nesta sessão.
                      </td>
                    </tr>
                  )}
                  {s.itens.map((si, idx) => {
                    const p = products.find(prod => prod.id === si.id)
                    if (!p) return null
                    const qtdTotal = si.qtdPorPessoa * s.participantes
                    const custoTotal = qtdTotal * custoOf(p)
                    const vendaTotal = qtdTotal * vendaOf(p)
                    const res = vendaTotal - custoTotal
                    return (
                      <tr
                        key={si.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f0fdf4',
                          borderBottom: '1px solid #d1fae5',
                        }}
                      >
                        <td style={{ padding: '4px 12px' }}>{p.nome}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'center' }}>{qtdTotal}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'right' }}>{formatMoney(custoOf(p))}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'right' }}>{formatMoney(vendaOf(p))}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'right' }}>{formatMoney(custoTotal)}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'right' }}>{formatMoney(vendaTotal)}</td>
                        <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 'bold', color: res >= 0 ? '#047857' : '#dc2626' }}>
                          {formatMoney(res)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ backgroundColor: '#ecfdf5', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ padding: '4px 12px', textAlign: 'right', color: '#065f46' }}>
                      Subtotal Evento {i + 1}
                    </td>
                    <td style={{ padding: '4px 12px', textAlign: 'right', color: '#065f46' }}>{formatMoney(sessaoCusto(s))}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'right', color: '#065f46' }}>{formatMoney(sessaoSubtotal(s))}</td>
                    <td style={{ padding: '4px 12px', textAlign: 'right', color: sessaoResultado(s) >= 0 ? '#047857' : '#dc2626' }}>
                      {formatMoney(sessaoResultado(s))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#57534e' }}>Receita Total (Venda + Taxa): </span>
              <span style={{ fontWeight: 'bold' }}>{formatMoney(totalGeral)}</span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#57534e' }}>Custo Total: </span>
              <span style={{ fontWeight: 'bold' }}>{formatMoney(custoTotal)}</span>
            </div>
            <div style={{
              borderTop: '2px solid #059669',
              paddingTop: '6px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: resultado >= 0 ? '#047857' : '#dc2626',
            }}>
              Resultado: {formatMoney(resultado)}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ color: '#57534e' }}>Margem: </span>
              <span style={{ fontWeight: 'bold' }}>{margem.toFixed(1).replace('.', ',')}%</span>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #d6d3d1',
            paddingTop: '12px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#a8a29e',
          }}>
            Documento interno — não deve ser enviado ao cliente · Gerado via CoffeeCraft
          </div>
        </div>
      </div>
    </div>
  )
}
