let token = ''

export function setToken(t) {
  token = t
}

export function clearToken() {
  token = ''
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`/coffeecraft/api${path}`, { ...options, headers })

  if (res.status === 401) {
    const err = new Error('Sessão expirada')
    err.status = 401
    throw err
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`
    try {
      const j = await res.json()
      if (j.error) msg = j.error
    } catch {}
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: senha => request('/login', { method: 'POST', body: JSON.stringify({ senha }) }),
  list: tabela => request(`/${tabela}`),
  create: (tabela, item) => request(`/${tabela}`, { method: 'POST', body: JSON.stringify(item) }),
  update: (tabela, id, item) => request(`/${tabela}/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  remove: (tabela, id) => request(`/${tabela}/${id}`, { method: 'DELETE' }),
  contadorNext: chave => request('/contador/next', { method: 'POST', body: JSON.stringify({ chave }) }),
  importar: dados => request('/import', { method: 'POST', body: JSON.stringify(dados) }),
}
