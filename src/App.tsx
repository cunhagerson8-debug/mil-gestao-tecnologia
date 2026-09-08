import './App.css'
import logoMil from './assets/logo-mil.png'

function App() {
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
            <a href="#mil-ia">MIL IA</a>
            <a href="#contato">Contato</a>
          </nav>

          <a href="#projeto" className="nav-cta">
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
              <a href="#projeto" className="btn-primary">
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

        <div className="ai-status">
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
          <button className="project-play" type="button" aria-label="Assistir apresentação">
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
          <a href="#projeto">Conheça o projeto →</a>
        </div>
      </article>

      <article className="project-card">
        <div className="project-media">
          <span className="project-category">GESTÃO OPERACIONAL</span>
          <div className="project-symbol">OPS</div>
          <button className="project-play" type="button" aria-label="Assistir apresentação">
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
          <a href="#projeto">Conheça o projeto →</a>
        </div>
      </article>

      <article className="project-card">
        <div className="project-media">
          <span className="project-category">APLICATIVOS</span>
          <div className="project-symbol">APP</div>
          <button className="project-play" type="button" aria-label="Assistir apresentação">
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
          <a href="#projeto">Veja nossas soluções →</a>
        </div>
      </article>

    </div>

    <div className="projects-more">
      <span>● NOVOS PROJETOS EM DESENVOLVIMENTO</span>
      <a href="#projeto">Transforme sua ideia em tecnologia →</a>
    </div>

  </div>
</section>
      </main>
    </div>
  )
}

export default App