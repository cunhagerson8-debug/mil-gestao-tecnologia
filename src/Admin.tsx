import { useEffect, useState } from 'react'
import './Admin.css'
import { API_BASE_URL } from './api'

type Opportunity = {
  id: number
  nome: string
  empresa: string
  whatsapp: string
  email: string
  cidade: string
  estado: string
  interesse: string
  necessidade: string
  observacoes: string
  status: string
  consentimento_contato: number
  criado_em: string
  atualizado_em: string
  proximo_contato: string | null
}

type OpportunitiesResponse = {
  total: number
  oportunidades: Opportunity[]
}

type Note = {
  id: number
  oportunidade_id: number
  texto: string
  criado_em: string
}

const opportunityStatuses = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
]

function Admin() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [noteText, setNoteText] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteSaveError, setNoteSaveError] = useState('')
  const [isSavingNextContact, setIsSavingNextContact] = useState(false)
  const [nextContactError, setNextContactError] = useState('')
  const [nextContactDraft, setNextContactDraft] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/session`, {
          credentials: 'include',
        })
        const data = await response.json()
        setIsAuthenticated(response.ok && data.authenticated === true)
      } catch (requestError) {
        console.error('Erro ao verificar sessão administrativa:', requestError)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingSession(false)
      }
    }

    void checkSession()
  }, [])

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoggingIn) return

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível entrar no painel.')
      }

      setPassword('')
      setIsAuthenticated(true)
    } catch (requestError) {
      console.error('Erro ao entrar no painel:', requestError)
      setLoginError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível entrar no painel.'
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setIsAuthenticated(false)
      setOpportunities([])
      setSelectedOpportunity(null)
    }
  }

  const displayValue = (value: string | number | undefined) => {
    if (typeof value === 'number') return value ? 'Sim' : 'Não'
    return value?.trim() || 'Não informado'
  }

  const getStatusLabel = (status: string) =>
    opportunityStatuses.find((item) => item.value === status)?.label || status

  const formatCalendarDate = (value: string | null | undefined) => {
    if (!value) return '-'

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '-'
  }

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase()
  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch = [opportunity.nome, opportunity.empresa, opportunity.whatsapp]
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearchQuery))
    const matchesStatus = !statusFilter || opportunity.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const hasActiveFilters = Boolean(searchQuery || statusFilter)
  const opportunityCounts = opportunityStatuses.reduce<Record<string, number>>(
    (counts, status) => {
      counts[status.value] = opportunities.filter(
        (opportunity) => opportunity.status === status.value
      ).length
      return counts
    },
    {}
  )

  const summaryItems = [
    { value: '', label: 'Total', count: total },
    { value: 'novo', label: 'Novos', count: opportunityCounts.novo || 0 },
    { value: 'em_contato', label: 'Em contato', count: opportunityCounts.em_contato || 0 },
    { value: 'qualificado', label: 'Qualificados', count: opportunityCounts.qualificado || 0 },
    { value: 'proposta', label: 'Propostas', count: opportunityCounts.proposta || 0 },
    { value: 'fechado', label: 'Fechados', count: opportunityCounts.fechado || 0 },
    { value: 'perdido', label: 'Perdidos', count: opportunityCounts.perdido || 0 },
  ]

  useEffect(() => {
    const opportunityId = selectedOpportunity?.id

    if (!opportunityId) {
      setNotes([])
      setIsLoadingNotes(false)
      setNotesError('')
      setNoteText('')
      setNoteSaveError('')
      setNextContactDraft('')
      return
    }

    const controller = new AbortController()

    setNotes([])
    setIsLoadingNotes(true)
    setNotesError('')
    setNoteText('')
    setNoteSaveError('')
    setNextContactDraft(selectedOpportunity?.proximo_contato || '')

    const loadNotes = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/oportunidades/${opportunityId}/anotacoes`,
          { signal: controller.signal, credentials: 'include' }
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar as anotações.')
        }

        setNotes(Array.isArray(data.anotacoes) ? data.anotacoes : [])
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return

        console.error('Erro ao carregar anotações:', requestError)
        setNotesError('Não foi possível carregar as anotações agora.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingNotes(false)
      }
    }

    void loadNotes()

    return () => controller.abort()
  }, [selectedOpportunity?.id])

  const saveNote = async () => {
    const opportunityId = selectedOpportunity?.id
    const text = noteText.trim()

    if (!opportunityId || !text || isSavingNote) return

    setIsSavingNote(true)
    setNoteSaveError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/oportunidades/${opportunityId}/anotacoes`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ texto: text }),
        }
      )
      const data = await response.json()

      if (!response.ok || !data.success || !data.anotacao) {
        throw new Error(data?.error || 'Não foi possível salvar a anotação.')
      }

      setNotes((currentNotes) => [data.anotacao as Note, ...currentNotes])
      setNoteText('')
    } catch (requestError) {
      console.error('Erro ao salvar anotação:', requestError)
      setNoteSaveError('Não foi possível salvar a anotação. Tente novamente.')
    } finally {
      setIsSavingNote(false)
    }
  }

  const updateNextContact = async (nextContact: string | null) => {
    if (!selectedOpportunity || isSavingNextContact) return

    setIsSavingNextContact(true)
    setNextContactError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/oportunidades/${selectedOpportunity.id}/proximo-contato`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ proximo_contato: nextContact }),
        }
      )
      const data = await response.json()

      if (!response.ok || !data.success || !data.oportunidade) {
        throw new Error(data?.error || 'Não foi possível atualizar o próximo contato.')
      }

      const updatedOpportunity = data.oportunidade as Opportunity
      setOpportunities((currentOpportunities) =>
        currentOpportunities.map((opportunity) =>
          opportunity.id === updatedOpportunity.id ? updatedOpportunity : opportunity
        )
      )
      setSelectedOpportunity(updatedOpportunity)
      setNextContactDraft(updatedOpportunity.proximo_contato || '')
    } catch (requestError) {
      console.error('Erro ao atualizar próximo contato:', requestError)
      setNextContactError('Não foi possível salvar o próximo contato. Tente novamente.')
    } finally {
      setIsSavingNextContact(false)
    }
  }

  const updateOpportunityStatus = async (status: string) => {
    if (!selectedOpportunity || isSavingStatus || status === selectedOpportunity.status) return

    setIsSavingStatus(true)
    setStatusError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/oportunidades/${selectedOpportunity.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )
      const data = await response.json()

      if (!response.ok || !data.success || !data.oportunidade) {
        throw new Error(data?.error || 'Não foi possível atualizar o status.')
      }

      const updatedOpportunity = data.oportunidade as Opportunity
      setOpportunities((currentOpportunities) =>
        currentOpportunities.map((opportunity) =>
          opportunity.id === updatedOpportunity.id ? updatedOpportunity : opportunity
        )
      )
      setSelectedOpportunity(updatedOpportunity)
    } catch (requestError) {
      console.error('Erro ao atualizar status:', requestError)
      setStatusError('Não foi possível atualizar o status. Tente novamente.')
    } finally {
      setIsSavingStatus(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const loadOpportunities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/oportunidades`, {
          credentials: 'include',
        })
        const data = (await response.json()) as Partial<OpportunitiesResponse>

        if (!response.ok) {
          throw new Error('Não foi possível carregar as oportunidades.')
        }

        setOpportunities(Array.isArray(data.oportunidades) ? data.oportunidades : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      } catch (requestError) {
        console.error('Erro ao carregar oportunidades:', requestError)
        setError('Não foi possível carregar as oportunidades agora.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOpportunities()
  }, [isAuthenticated])

  if (isCheckingSession) {
    return (
      <main className="admin-page">
        <div className="admin-auth-state">Verificando acesso administrativo...</div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-page">
        <form className="admin-login" onSubmit={login}>
          <span className="admin-kicker">MIL GESTÃO & TECNOLOGIA</span>
          <h1>Acesso administrativo</h1>
          <p>Entre para consultar e gerenciar as oportunidades.</p>

          <label>
            <span>Usuário</span>
            <input
              type="text"
              value={username}
              autoComplete="username"
              required
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {loginError && <div className="admin-login-error" role="alert">{loginError}</div>}

          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? 'Entrando...' : 'Entrar no painel'}
          </button>
          <a className="admin-back-link" href="/">Voltar ao site</a>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">MIL GESTÃO & TECNOLOGIA</span>
            <h1>Oportunidades</h1>
            <p>Visão geral dos contatos recebidos pela MIL IA.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-back-link" href="/">Voltar ao site</a>
            <button className="admin-logout-button" type="button" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>

        <section className="admin-summary-grid" aria-label="Resumo por status">
          {summaryItems.map((item) => (
            <button
              key={item.value || 'total'}
              className={`admin-summary ${statusFilter === item.value ? 'admin-summary-active' : ''}`}
              type="button"
              onClick={() => setStatusFilter(item.value)}
            >
              <span>{item.value ? item.label : 'Total de oportunidades'}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </section>

        {isLoading && <div className="admin-state">Carregando oportunidades...</div>}

        {!isLoading && error && (
          <div className="admin-state admin-state-error" role="alert">
            {error}
          </div>
        )}

        {!isLoading && !error && opportunities.length === 0 && (
          <div className="admin-state">Nenhuma oportunidade cadastrada.</div>
        )}

        {!isLoading && !error && opportunities.length > 0 && (
          <>
            <div className="admin-filters">
              <label className="admin-search-field">
                <span>Pesquisar oportunidades</span>
                <input
                  type="search"
                  value={searchQuery}
                  placeholder="Buscar por nome, empresa ou WhatsApp..."
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>

              <label className="admin-filter-field">
                <span>Filtrar por status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Todos os status</option>
                  {opportunityStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              {hasActiveFilters && (
                <button
                  className="admin-clear-filters"
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('')
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="admin-results-summary">
              Exibindo {filteredOpportunities.length} de {total} oportunidades
            </div>

            {filteredOpportunities.length === 0 ? (
              <div className="admin-state">
                Nenhuma oportunidade encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Empresa</th>
                      <th>WhatsApp</th>
                      <th>Status</th>
                      <th>Próximo contato</th>
                      <th>Data de criação</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOpportunities.map((opportunity) => (
                      <tr key={opportunity.id}>
                        <td>{opportunity.id}</td>
                        <td className="admin-name">{opportunity.nome || '-'}</td>
                        <td>{opportunity.empresa || '-'}</td>
                        <td>{opportunity.whatsapp || '-'}</td>
                        <td>
                          <span className="admin-status">{getStatusLabel(opportunity.status) || '-'}</span>
                        </td>
                        <td>{formatCalendarDate(opportunity.proximo_contato)}</td>
                        <td>{opportunity.criado_em || '-'}</td>
                        <td>
                          <button
                            className="admin-details-button"
                            type="button"
                            onClick={() => setSelectedOpportunity(opportunity)}
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOpportunity && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedOpportunity(null)}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-kicker">OPORTUNIDADE #{selectedOpportunity.id}</span>
                <h2 id="admin-modal-title">Detalhes da oportunidade</h2>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedOpportunity(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-detail-grid">
              <div><span>ID</span><strong>{selectedOpportunity.id}</strong></div>
              <div><span>Nome</span><strong>{displayValue(selectedOpportunity.nome)}</strong></div>
              <div><span>Empresa</span><strong>{displayValue(selectedOpportunity.empresa)}</strong></div>
              <div><span>WhatsApp</span><strong>{displayValue(selectedOpportunity.whatsapp)}</strong></div>
              <div><span>E-mail</span><strong>{displayValue(selectedOpportunity.email)}</strong></div>
              <div><span>Cidade</span><strong>{displayValue(selectedOpportunity.cidade)}</strong></div>
              <div><span>Estado</span><strong>{displayValue(selectedOpportunity.estado)}</strong></div>
              <div className="admin-next-contact-field">
                <span>Próximo contato</span>
                <input
                  type="date"
                  value={nextContactDraft}
                  disabled={isSavingNextContact}
                  onChange={(event) => {
                    setNextContactError('')
                    setNextContactDraft(event.target.value)
                  }}
                />
                <div className="admin-next-contact-actions">
                  <button
                    className="admin-save-next-contact"
                    type="button"
                    disabled={isSavingNextContact}
                    onClick={() => void updateNextContact(nextContactDraft || null)}
                  >
                    {isSavingNextContact ? 'Salvando...' : 'Salvar próximo contato'}
                  </button>
                  {selectedOpportunity.proximo_contato && (
                    <button
                      className="admin-remove-next-contact"
                      type="button"
                      disabled={isSavingNextContact}
                      onClick={() => void updateNextContact(null)}
                    >
                      Remover data
                    </button>
                  )}
                </div>
                {nextContactError && <small className="admin-status-error">{nextContactError}</small>}
              </div>
              <div className="admin-status-field">
                <span>Status</span>
                <select
                  value={selectedOpportunity.status}
                  disabled={isSavingStatus}
                  onChange={(event) => void updateOpportunityStatus(event.target.value)}
                >
                  {opportunityStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {isSavingStatus && <small className="admin-status-message">Salvando...</small>}
                {statusError && <small className="admin-status-error">{statusError}</small>}
              </div>
              <div><span>Consentimento para contato</span><strong>{displayValue(selectedOpportunity.consentimento_contato)}</strong></div>
              <div><span>Data de criação</span><strong>{displayValue(selectedOpportunity.criado_em)}</strong></div>
              <div><span>Data de atualização</span><strong>{displayValue(selectedOpportunity.atualizado_em)}</strong></div>
              <div className="admin-detail-wide"><span>Interesse</span><p>{displayValue(selectedOpportunity.interesse)}</p></div>
              <div className="admin-detail-wide"><span>Necessidade</span><p>{displayValue(selectedOpportunity.necessidade)}</p></div>
              <div className="admin-detail-wide"><span>Observações</span><p>{displayValue(selectedOpportunity.observacoes)}</p></div>
            </div>

            <section className="admin-notes-section" aria-labelledby="admin-notes-title">
              <div className="admin-notes-heading">
                <div>
                  <span className="admin-kicker">REGISTRO INTERNO</span>
                  <h3 id="admin-notes-title">Anotações internas</h3>
                </div>
              </div>

              {isLoadingNotes && <p className="admin-notes-state">Carregando anotações...</p>}
              {!isLoadingNotes && notesError && (
                <p className="admin-notes-state admin-status-error" role="alert">{notesError}</p>
              )}
              {!isLoadingNotes && !notesError && notes.length === 0 && (
                <p className="admin-notes-state">Nenhuma anotação interna registrada.</p>
              )}
              {!isLoadingNotes && !notesError && notes.length > 0 && (
                <div className="admin-notes-list">
                  {notes.map((note) => (
                    <article className="admin-note" key={note.id}>
                      <p>{note.texto}</p>
                      <time dateTime={note.criado_em}>{note.criado_em}</time>
                    </article>
                  ))}
                </div>
              )}

              <div className="admin-note-form">
                <textarea
                  value={noteText}
                  placeholder="Adicionar uma anotação interna..."
                  rows={3}
                  disabled={isSavingNote}
                  onChange={(event) => setNoteText(event.target.value)}
                />
                <button
                  className="admin-save-note"
                  type="button"
                  disabled={!noteText.trim() || isSavingNote}
                  onClick={() => void saveNote()}
                >
                  {isSavingNote ? 'Salvando...' : 'Salvar anotação'}
                </button>
                {noteSaveError && (
                  <p className="admin-status-error" role="alert">{noteSaveError}</p>
                )}
              </div>
            </section>
          </section>
        </div>
      )}
    </main>
  )
}

export default Admin
