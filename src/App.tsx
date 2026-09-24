import './App.css'
import logoMil from './assets/logo-mil.png'
import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from './api'

function App() {
    const [isMilAiOpen, setIsMilAiOpen] = useState(false)
    const [milAiMessage, setMilAiMessage] = useState('')

const [milAiLoading, setMilAiLoading] = useState(false)
const milAiRegistrationCompletedRef = useRef(false)

const [milAiMessages, setMilAiMessages] = useState<
  { role: 'user' | 'assistant'; text: string }[]
>([])

const milAiMessagesRef = useRef<HTMLDivElement | null>(null)

useEffect(() => {
  const chat = milAiMessagesRef.current

  if (chat) {
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: 'smooth',
    })
  }
}, [milAiMessages, milAiLoading])

const sendMilAiMessage = async () => {
  const message = milAiMessage.trim()

  if (!message || milAiLoading) return

  const conversation = [
    ...milAiMessages,
    { role: 'user' as const, text: message },
  ]

  setMilAiMessages((prev) => [
  ...prev,
  { role: 'user', text: message },
])

  try {
    setMilAiLoading(true)


    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversation,
        registrationCompleted: milAiRegistrationCompletedRef.current,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'Erro ao consultar a MIL IA.')
    }

    const cleanAnswer = (
  data.answer || 'Não consegui gerar uma resposta.'
).replace(/\*\*/g, '')



setMilAiMessages((prev) => [
  ...prev,
  { role: 'assistant', text: cleanAnswer },
])

    if (data.opportunityRegistration === 'success') {
      milAiRegistrationCompletedRef.current = true
      setMilAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Seu cadastro foi realizado com sucesso. Obrigado pelas informações.',
        },
      ])
    } else if (data.opportunityRegistration === 'failed') {
      setMilAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Houve uma dificuldade para registrar seus dados. Podemos continuar o atendimento por aqui.',
        },
      ])
    }
    setMilAiMessage('')
  } catch (error) {
    console.error('Erro MIL IA:', error)
    setMilAiMessages((prev) => [
      ...prev,
      { role: 'assistant', text: 'Não foi possível falar com a MIL IA neste momento. Tente novamente.' },
    ])
  } finally {
    setMilAiLoading(false)
  }
}

  return (
    <div className="home">
      <header className="header">
        <div className="container nav">
         <a href="#" className="brand">
  <img
    src={logoMil}
    alt="MIL Gestão & Tecnologia"
    className="brand-logo"
  />
</a>

          <nav className="nav-links">
            <a href="#inicio">Início</a>
            <a href="#empresa">Empresa</a>
            <a href="#solucoes">Soluções</a>
            <a href="#produtos">Produtos</a>
            <a
  href="#mil-ia"
  onClick={(e) => {
    e.preventDefault()
    setIsMilAiOpen(true)
  }}
>
  MIL IA
</a>
            <a href="#contato">Contato</a>
          </nav>

          <a
            href="#projeto"
            className="nav-cta"
            onClick={(e) => {
              e.preventDefault()
              setIsMilAiOpen(true)
            }}
          >
            Crie seu projeto
          </a>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="tech-background" aria-hidden="true">
  <div className="tech-grid"></div>
  <div className="tech-orb tech-orb-1"></div>
  <div className="tech-orb tech-orb-2"></div>

  <div className="tech-line line-1"></div>
  <div className="tech-line line-2"></div>
  <div className="tech-line line-3"></div>

  <span className="tech-node node-1"></span>
  <span className="tech-node node-2"></span>
  <span className="tech-node node-3"></span>
  <span className="tech-node node-4"></span>
</div>
          <div className="container hero">
            <div className="eyebrow">
              ● TECNOLOGIA • INTELIGÊNCIA ARTIFICIAL • AUTOMAÇÃO
            </div>

            <h1>
              Tecnologia que transforma
              <br />
              <span>ideias em negócios.</span>
            </h1>

            <p>
              Desenvolvemos plataformas, aplicativos, inteligência artificial
              e automações para empresas que querem crescer, inovar e operar
              em outro nível.
            </p>

            <div className="hero-actions">
              <a
                href="#projeto"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  setIsMilAiOpen(true)
                }}
              >
                Transforme sua ideia em um projeto →
              </a>

              <a href="#solucoes" className="btn-secondary">
                Conheça nossas soluções
              </a>
            </div>
          </div>
        </section>
        <section id="solucoes" className="solutions-section">
  <div className="container">

    <div className="section-heading">
      <span className="section-label">ECOSSISTEMA MIL</span>

      <h2>
        Não entregamos apenas software.
        <span> Construímos operações inteligentes.</span>
      </h2>

      <p>
        Tecnologia desenvolvida para transformar ideias, processos
        e empresas em operações digitais mais inteligentes.
      </p>
    </div>

    <div className="solutions-grid">

      <article className="solution-card">
        <div className="solution-icon">AI</div>
        <span>01</span>
        <h3>Inteligência Artificial</h3>
        <p>
          Agentes inteligentes para gestão, atendimento,
          análise, vendas e automação de operações.
        </p>
      </article>

      <article className="solution-card">
        <div className="solution-icon">⌘</div>
        <span>02</span>
        <h3>Plataformas</h3>
        <p>
          Sistemas completos para centralizar processos,
          dados, equipes, clientes e operações.
        </p>
      </article>

      <article className="solution-card">
        <div className="solution-icon">APP</div>
        <span>03</span>
        <h3>Aplicativos</h3>
        <p>
          Aplicativos modernos para conectar empresas,
          clientes, equipes e serviços.
        </p>
      </article>

      <article className="solution-card">
        <div className="solution-icon">⚡</div>
        <span>04</span>
        <h3>Automação</h3>
        <p>
          Processos automáticos para reduzir tarefas manuais,
          custos e tempo operacional.
        </p>
      </article>

      <article className="solution-card">
        <div className="solution-icon">API</div>
        <span>05</span>
        <h3>Integrações</h3>
        <p>
          Conectamos sistemas, APIs, pagamentos,
          comunicação e serviços externos.
        </p>
      </article>

      <article className="solution-card">
        <div className="solution-icon">&lt;/&gt;</div>
        <span>06</span>
        <h3>Engenharia de Software</h3>
        <p>
          Projetos personalizados, arquitetura,
          segurança e desenvolvimento de soluções escaláveis.
        </p>
      </article>

    </div>
  </div>
</section>
<section id="mil-ia" className="mil-ia-section">
  <div className="container mil-ia-layout">

    <div className="mil-ia-copy">
      <span className="section-label">MIL IA</span>

      <h2>
        Inteligência que
        <span> gerencia operações.</span>
      </h2>

      <p>
        A MIL IA foi pensada para analisar dados, acompanhar processos,
        identificar oportunidades, gerar diagnósticos e apoiar decisões
        em tempo real.
      </p>

      <p>
        Tecnologia, marketing, suporte, financeiro e gestão trabalhando
        de forma integrada em uma única inteligência operacional.
      </p>

      <a href="#projeto" className="btn-primary">
        Quero uma solução com IA →
      </a>
    </div>

    <div className="ai-console">
      <div className="ai-console-header">
        <div>
          <span className="status-dot"></span>
          MIL IA
        </div>
        <span>ONLINE</span>
      </div>

      <div className="ai-console-body">

        <div
  className="ai-status"
  onClick={() => setIsMilAiOpen(true)}
  role="button"
  tabIndex={0}
>
  <span>Operação</span>
  <strong>98%</strong>
  <small>Normal</small>
</div>

        <div className="ai-status">
          <span>Projetos ativos</span>
          <strong>07</strong>
          <small>Monitorados</small>
        </div>

        <div className="ai-status">
          <span>Leads comerciais</span>
          <strong>14</strong>
          <small>Em análise</small>
        </div>

        <div className="ai-status">
          <span>Alertas</span>
          <strong>02</strong>
          <small>Requer atenção</small>
        </div>

      </div>

      <div className="ai-feed">
        <div>
          <span>01</span>
          <p>Analisando desempenho operacional...</p>
        </div>

        <div>
          <span>02</span>
          <p>Monitorando campanhas e captação...</p>
        </div>

        <div>
          <span>03</span>
          <p>Verificando suporte e prioridades...</p>
        </div>

        <div>
          <span>04</span>
          <p>Gerando diagnóstico executivo...</p>
        </div>
      </div>

      <div className="ai-console-footer">
        <span>MIL IA • CENTRAL INTELIGENTE</span>
        <span className="ai-processing">PROCESSANDO</span>
      </div>
    </div>

  </div>
</section>
<section id="produtos" className="projects-section">
  <div className="container">

    <div className="section-heading projects-heading">
      <span className="section-label">PROJETOS & TECNOLOGIA MIL</span>

      <h2>
        Tecnologia que já está
        <span> saindo do papel.</span>
      </h2>

      <p>
        Conheça plataformas, sistemas, aplicativos e soluções inteligentes
        desenvolvidos pela MIL Gestão & Tecnologia.
      </p>
    </div>

    <div className="projects-grid">

      <article className="project-card project-featured">
        <div className="project-media">
          <span className="project-category">INTELIGÊNCIA ARTIFICIAL</span>
          <div className="project-symbol">MIL IA</div>
          <button className="project-play" type="button" aria-hidden="true" disabled>
            ▶
          </button>
        </div>

        <div className="project-content">
          <span>PRODUTO MIL • 01</span>
          <h3>MIL Contábil IA</h3>
          <p>
            Plataforma inteligente para gestão contábil, automação,
            diagnóstico empresarial e operação assistida por IA.
          </p>
          <a
            href="#projeto"
            onClick={(e) => {
              e.preventDefault()
              setIsMilAiOpen(true)
            }}
          >
            Conheça o projeto →
          </a>
        </div>
      </article>

      <article className="project-card">
        <div className="project-media">
          <span className="project-category">GESTÃO OPERACIONAL</span>
          <div className="project-symbol">OPS</div>
          <button className="project-play" type="button" aria-hidden="true" disabled>
            ▶
          </button>
        </div>

        <div className="project-content">
          <span>PRODUTO MIL • 02</span>
          <h3>Central de Operações</h3>
          <p>
            Gestão integrada de empresas, equipes, dispositivos,
            operações de campo, documentos e processos.
          </p>
          <a href="#solucoes">Conheça o projeto →</a>
        </div>
      </article>

      <article className="project-card">
        <div className="project-media">
          <span className="project-category">APLICATIVOS</span>
          <div className="project-symbol">APP</div>
          <button className="project-play" type="button" aria-hidden="true" disabled>
            ▶
          </button>
        </div>

        <div className="project-content">
          <span>PRODUTO MIL • 03</span>
          <h3>Aplicativos Inteligentes</h3>
          <p>
            Aplicativos personalizados conectando empresas,
            clientes, equipes, serviços e inteligência artificial.
          </p>
          <a
            href="#solucoes"
            onClick={(e) => {
              e.preventDefault()
              const target = document.getElementById('solucoes')
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            Veja nossas soluções →
          </a>
        </div>
      </article>

    </div>

    <div className="projects-more">
      <span>● NOVOS PROJETOS EM DESENVOLVIMENTO</span>
      <a
        href="#projeto"
        onClick={(e) => {
          e.preventDefault()
          setIsMilAiOpen(true)
        }}
      >
        Transforme sua ideia em tecnologia →
      </a>
    </div>

  </div>
</section>
      </main>
      <div className="mil-ai-float">
  <button
  type="button"
  className="mil-ai-button"
  aria-label="Abrir MIL IA"
  onClick={() => setIsMilAiOpen(!isMilAiOpen)}
>
    <span className="mil-ai-status"></span>

    <div className="mil-ai-button-text">
      <strong>MIL IA</strong>
      <small>Consultora inteligente</small>
    </div>

    <span className="mil-ai-arrow">↗</span>
  </button>
</div>

{isMilAiOpen && (
  <div className="mil-ai-panel">
    <div className="mil-ai-panel-header">
      <div>
        <strong>MIL IA</strong>
        <span>Consultora Inteligente</span>
      </div>

      <button
        type="button"
        onClick={() => setIsMilAiOpen(false)}
        aria-label="Fechar MIL IA"
      >
        ×
      </button>
    </div>

    <div className="mil-ai-panel-body">
      <span className="mil-ai-online">● ONLINE</span>

      <h3>Olá, eu sou a MIL IA.</h3>

      <p>
        Conte o que sua empresa precisa e eu vou ajudar a transformar
        sua ideia em um projeto de tecnologia.
      </p>

<div className="mil-ai-chat-input">
  <textarea
    placeholder="Digite sua mensagem para a MIL IA..."
    rows={3}
    value={milAiMessage}
    onChange={(e) => setMilAiMessage(e.target.value)}
    />

  <button
  type="button"
  onClick={sendMilAiMessage}
  disabled={milAiLoading}
>
  {milAiLoading ? 'Pensando...' : 'Enviar'}
</button>

{milAiMessages.length > 0 && (

  <div
  className="mil-ai-chat-messages"
  ref={milAiMessagesRef}
>
    {milAiMessages.map((msg, index) => (
      <div
        key={index}
        className={`mil-ai-message ${
          msg.role === 'user' ? 'mil-ai-message-user' : 'mil-ai-message-assistant'
        }`}
      >
        <strong>
          {msg.role === 'user' ? 'Você' : 'MIL IA'}
        </strong>
        <p>{msg.text}</p>
      </div>
    ))}

    {milAiLoading && (
      <div className="mil-ai-message mil-ai-message-assistant">
        <strong>MIL IA</strong>
        <p>Pensando...</p>
      </div>
    )}

</div>

)}

</div>

    </div>
  </div>
)}

    </div>
  )
}

export default App