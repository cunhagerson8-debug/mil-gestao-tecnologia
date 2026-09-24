import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import db from './database.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../dist');
const ADMIN_SESSION_TTL = 8 * 60 * 60 * 1000;
const adminSessions = new Map();
const SESSION_SECRET = process.env.SESSION_SECRET;

if (process.env.NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      credentials: true,
    })
  );
}

app.use(express.json());

const readCookie = (req, name) => {
  const cookies = req.headers.cookie?.split(';') || []
  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : ''
}

const credentialsMatch = (provided, expected) => {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false

  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  )
}

const createSessionToken = () => {
  const nonce = crypto.randomBytes(32).toString('hex')
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(nonce)
    .digest('hex')

  return `${nonce}.${signature}`
}

const isValidSessionToken = (token) => {
  const [nonce, signature] = token.split('.')

  if (!nonce || !signature || signature.length !== 64) return false

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(nonce)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

const getAdminSession = (req) => {
  const token = readCookie(req, 'admin_session')
  if (!SESSION_SECRET || !token || !isValidSessionToken(token)) return null

  const session = adminSessions.get(token)

  if (!session) return null

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token)
    return null
  }

  return { token, session }
}

const requireAdmin = (req, res, next) => {
  if (!getAdminSession(req)) {
    return res.status(401).json({ error: 'Autenticação administrativa necessária.' })
  }

  next()
}

const setAdminSessionCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ADMIN_SESSION_TTL / 1000}${secure}`
  )
}

app.post('/api/admin/login', async (req, res) => {
  const configuredUsername = process.env.ADMIN_USERNAME
  const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (
    !configuredUsername ||
    !configuredPasswordHash ||
    !SESSION_SECRET ||
    SESSION_SECRET.length < 32
  ) {
    return res.status(503).json({
      error: 'As credenciais administrativas ainda não foram configuradas.',
    })
  }

  const { username, password } = req.body || {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' })
  }

  let passwordMatches = false

  try {
    passwordMatches = await bcrypt.compare(password, configuredPasswordHash)
  } catch {
    return res.status(503).json({
      error: 'As credenciais administrativas ainda não foram configuradas.',
    })
  }

  if (!credentialsMatch(username, configuredUsername) || !passwordMatches) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' })
  }

  const token = createSessionToken()
  adminSessions.set(token, { expiresAt: Date.now() + ADMIN_SESSION_TTL })
  setAdminSessionCookie(res, token)

  return res.json({ success: true })
})

app.get('/api/admin/session', (req, res) => {
  return res.json({ authenticated: Boolean(getAdminSession(req)) })
})

app.post('/api/admin/logout', (req, res) => {
  const session = getAdminSession(req)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  if (session) adminSessions.delete(session.token)

  res.setHeader(
    'Set-Cookie',
    `admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
  )

  return res.json({ success: true })
})

app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    service: "MIL IA API",
  });
});

app.post('/api/oportunidades', (req, res) => {
  try {
    const {
      nome,
      empresa,
      whatsapp,
      email,
      cidade,
      estado,
      interesse,
      necessidade,
      observacoes,
      consentimento_contato
    } = req.body

    if (!nome || (!whatsapp && !email)) {
      return res.status(400).json({
        error: 'Informe o nome e pelo menos WhatsApp ou e-mail.'
      })
    }

    const stmt = db.prepare(`
      INSERT INTO oportunidades (
        nome,
        empresa,
        whatsapp,
        email,
        cidade,
        estado,
        interesse,
        necessidade,
        observacoes,
        consentimento_contato
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      nome,
      empresa || '',
      whatsapp || '',
      email || '',
      cidade || '',
      estado || '',
      interesse || '',
      necessidade || '',
      observacoes || '',
      consentimento_contato ? 1 : 0
    )

    return res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Oportunidade cadastrada com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao cadastrar oportunidade:', error)

    return res.status(500).json({
      error: 'Não foi possível cadastrar a oportunidade.'
    })
  }
})

app.get('/api/oportunidades', requireAdmin, (req, res) => {
  try {
    const oportunidades = db
      .prepare(`
        SELECT *
        FROM oportunidades
        ORDER BY id DESC
      `)
      .all()

    return res.json({
      success: true,
      total: oportunidades.length,
      oportunidades
    })
  } catch (error) {
    console.error('Erro ao listar oportunidades:', error)

    return res.status(500).json({
      error: 'Não foi possível listar as oportunidades.'
    })
  }
})

app.get('/api/oportunidades/:id/anotacoes', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de oportunidade inválido.'
      })
    }

    const oportunidade = db
      .prepare('SELECT id FROM oportunidades WHERE id = ?')
      .get(id)

    if (!oportunidade) {
      return res.status(404).json({
        error: 'Oportunidade não encontrada.'
      })
    }

    const anotacoes = db
      .prepare(`
        SELECT id, oportunidade_id, texto, criado_em
        FROM oportunidade_anotacoes
        WHERE oportunidade_id = ?
        ORDER BY criado_em DESC, id DESC
      `)
      .all(id)

    return res.json({
      success: true,
      anotacoes
    })
  } catch (error) {
    console.error('Erro ao listar anotações da oportunidade:', error)

    return res.status(500).json({
      error: 'Não foi possível carregar as anotações.'
    })
  }
})

app.post('/api/oportunidades/:id/anotacoes', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const texto = req.body?.texto

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de oportunidade inválido.'
      })
    }

    if (typeof texto !== 'string' || texto.trim().length === 0) {
      return res.status(400).json({
        error: 'Informe o texto da anotação.'
      })
    }

    const textoLimpo = texto.trim()

    if (textoLimpo.length > 2000) {
      return res.status(400).json({
        error: 'A anotação deve ter no máximo 2000 caracteres.'
      })
    }

    const oportunidade = db
      .prepare('SELECT id FROM oportunidades WHERE id = ?')
      .get(id)

    if (!oportunidade) {
      return res.status(404).json({
        error: 'Oportunidade não encontrada.'
      })
    }

    const result = db
      .prepare(`
        INSERT INTO oportunidade_anotacoes (oportunidade_id, texto)
        VALUES (?, ?)
      `)
      .run(id, textoLimpo)

    const anotacao = db
      .prepare(`
        SELECT id, oportunidade_id, texto, criado_em
        FROM oportunidade_anotacoes
        WHERE id = ?
      `)
      .get(result.lastInsertRowid)

    return res.status(201).json({
      success: true,
      anotacao
    })
  } catch (error) {
    console.error('Erro ao criar anotação da oportunidade:', error)

    return res.status(500).json({
      error: 'Não foi possível salvar a anotação.'
    })
  }
})

app.patch('/api/oportunidades/:id/proximo-contato', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const bodyKeys = Object.keys(req.body || {})
    const nextContact = req.body?.proximo_contato

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de oportunidade inválido.'
      })
    }

    if (bodyKeys.length !== 1 || !('proximo_contato' in (req.body || {}))) {
      return res.status(400).json({
        error: 'Envie somente o campo proximo_contato.'
      })
    }

    if (
      nextContact !== null &&
      (typeof nextContact !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(nextContact))
    ) {
      return res.status(400).json({
        error: 'Informe uma data válida no formato YYYY-MM-DD ou null.'
      })
    }

    if (typeof nextContact === 'string') {
      const [, year, month, day] = nextContact.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()

      if (
        Number(month) < 1 ||
        Number(month) > 12 ||
        Number(day) < 1 ||
        Number(day) > daysInMonth
      ) {
        return res.status(400).json({
          error: 'A data informada não existe.'
        })
      }
    }

    const oportunidade = db
      .prepare('SELECT id FROM oportunidades WHERE id = ?')
      .get(id)

    if (!oportunidade) {
      return res.status(404).json({
        error: 'Oportunidade não encontrada.'
      })
    }

    db.prepare(`
      UPDATE oportunidades
      SET proximo_contato = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextContact, id)

    const updatedOpportunity = db
      .prepare('SELECT * FROM oportunidades WHERE id = ?')
      .get(id)

    return res.json({
      success: true,
      oportunidade: updatedOpportunity
    })
  } catch (error) {
    console.error('Erro ao atualizar próximo contato:', error)

    return res.status(500).json({
      error: 'Não foi possível atualizar o próximo contato.'
    })
  }
})

app.patch('/api/oportunidades/:id/status', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const allowedStatuses = new Set([
      'novo',
      'em_contato',
      'qualificado',
      'proposta',
      'fechado',
      'perdido'
    ])
    const bodyKeys = Object.keys(req.body || {})
    const status = req.body?.status

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de oportunidade inválido.'
      })
    }

    if (
      bodyKeys.length !== 1 ||
      typeof status !== 'string' ||
      !allowedStatuses.has(status)
    ) {
      return res.status(400).json({
        error: 'Status inválido.'
      })
    }

    const update = db.prepare(`
      UPDATE oportunidades
      SET status = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id)

    if (update.changes === 0) {
      return res.status(404).json({
        error: 'Oportunidade não encontrada.'
      })
    }

    const oportunidade = db
      .prepare('SELECT * FROM oportunidades WHERE id = ?')
      .get(id)

    return res.json({
      success: true,
      oportunidade
    })
  } catch (error) {
    console.error('Erro ao atualizar status da oportunidade:', error)

    return res.status(500).json({
      error: 'Não foi possível atualizar o status da oportunidade.'
    })
  }
})


const normalizeText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const hasExplicitAuthorization = (messages) => {
  const authorizationPatterns = [
    /\b(sim\s*,?\s*)?(eu\s+)?autorizo\s+(o\s+)?cadastro\b/,
    /\b(sim\s*,?\s*)?(eu\s+)?concordo\s+com\s+(o\s+)?cadastro\b/,
    /\b(sim\s*,?\s*)?(eu\s+)?aceito\s+(o\s+)?cadastro\b/,
    /\b(sim\s*,?\s*)?pode\s+cadastrar\s+(meus\s+)?dados\b/,
  ]

  return messages
    .filter((message) => message.role === 'user')
    .some((message) => {
      const text = normalizeText(message.text)

      if (/\bnao\s+(autorizo|concordo|aceito|pode|cadastre)/.test(text)) {
        return false
      }

      return authorizationPatterns.some((pattern) => pattern.test(text))
    })
}

const validateOpportunity = (opportunity) => {
  const fields = [
    'nome',
    'empresa',
    'whatsapp',
    'email',
    'cidade',
    'estado',
    'interesse',
    'necessidade',
    'observacoes',
  ]

  if (!opportunity || typeof opportunity !== 'object') return null

  for (const field of fields) {
    if (
      opportunity[field] !== undefined &&
      (typeof opportunity[field] !== 'string' || opportunity[field].length > 5000)
    ) {
      return null
    }
  }

  const sanitized = Object.fromEntries(
    fields.map((field) => [field, (opportunity[field] || '').trim()])
  )

  if (!sanitized.nome || (!sanitized.whatsapp && !sanitized.email)) {
    return null
  }

  if (
    sanitized.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)
  ) {
    return null
  }

  if (
    sanitized.whatsapp &&
    sanitized.whatsapp.replace(/\D/g, '').length < 8
  ) {
    return null
  }

  return {
    ...sanitized,
    consentimento_contato: true,
  }
}

const extractOpportunity = async (openai, input) => {
  try {
    const extractionResponse = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
Extraia exclusivamente os dados de oportunidade comercial presentes na conversa.
Não invente, complete ou deduza informações ausentes. Use strings vazias quando
um campo não estiver informado. Responda somente com um objeto JSON válido com
estes campos: nome, empresa, whatsapp, email, cidade, estado, interesse,
necessidade e observacoes. Considere todas as mensagens da conversa e combine
dados do mesmo cliente mesmo quando estiverem em mensagens diferentes.
      `,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'oportunidade',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              nome: { type: 'string' },
              empresa: { type: 'string' },
              whatsapp: { type: 'string' },
              email: { type: 'string' },
              cidade: { type: 'string' },
              estado: { type: 'string' },
              interesse: { type: 'string' },
              necessidade: { type: 'string' },
              observacoes: { type: 'string' },
            },
            required: [
              'nome',
              'empresa',
              'whatsapp',
              'email',
              'cidade',
              'estado',
              'interesse',
              'necessidade',
              'observacoes',
            ],
            additionalProperties: false,
          },
        },
      },
    })

    const parsedOpportunity = JSON.parse(extractionResponse.output_text || '{}')
    const fields = [
      'nome',
      'empresa',
      'whatsapp',
      'email',
      'cidade',
      'estado',
      'interesse',
      'necessidade',
      'observacoes',
    ]

    return Object.fromEntries(
      fields.map((field) => [
        field,
        typeof parsedOpportunity[field] === 'string'
          ? parsedOpportunity[field].trim()
          : '',
      ])
    )
  } catch (error) {
    console.error(
      'Erro ao extrair dados da oportunidade:',
      error?.message || error
    )
    return null
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return res.status(400).json({
        error: "Envie um histórico de conversa válido.",
      });
    }

    const input = messages.map((message) => {
      if (
        !message ||
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.text !== "string" ||
        !message.text.trim() ||
        message.text.length > 10000
      ) {
        return null;
      }

      return {
        role: message.role,
        content: message.text.trim(),
      };
    });

    if (input.some((message) => message === null)) {
      return res.status(400).json({
        error: "O histórico de conversa contém mensagens inválidas.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "A chave da MIL IA ainda não foi configurada.",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("MIL IA: enviando mensagem para OpenAI...");

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
Você é a MIL IA, consultora inteligente oficial da MIL Gestão & Tecnologia.

Sua função é atender visitantes e potenciais clientes da empresa.

A MIL Gestão & Tecnologia desenvolve soluções em:
- inteligência artificial;
- automação;
- plataformas e sistemas;
- aplicativos;
- gestão empresarial;
- engenharia financeira;
- inteligência de dados;
- governança e controle;
- reestruturação de operações;
- projetos tecnológicos personalizados.

Responda sempre em português do Brasil, de forma profissional,
clara, objetiva, consultiva e comercial.

Seu objetivo é transformar o atendimento em uma oportunidade comercial
para a MIL Gestão & Tecnologia, sem pressionar o visitante.

Primeiro entenda o que o visitante precisa.
Faça perguntas relevantes sobre o negócio, problema, objetivo e solução desejada.

Depois de entender a necessidade, explique de forma clara como a
MIL Gestão & Tecnologia pode desenvolver uma solução para aquele caso.

Não peça dados pessoais logo no início da conversa.
Primeiro ajude o visitante, demonstre como a MIL pode atender a necessidade
e esclareça as principais dúvidas.

Quando o visitante demonstrar interesse em continuar, pergunte se ele
deseja avançar com o projeto e autoriza o cadastro para continuidade
do atendimento.

Se ele aceitar, solicite os dados de forma gradual:
- nome;
- empresa, quando houver;
- telefone ou WhatsApp;
- e-mail;
- cidade e estado, quando forem relevantes ao projeto.

Também procure entender e registrar durante a conversa:
- o que o cliente precisa;
- qual problema deseja resolver;
- quais funcionalidades ou resultados espera;
- nível de urgência;
- outras informações importantes para a análise do projeto.

Não invente preços, descontos, contratos, clientes, certificações,
prazos, funcionalidades ou condições comerciais que não tenham sido
fornecidos pela MIL Gestão & Tecnologia.

Quando preço, prazo ou viabilidade dependerem de análise da equipe,
explique isso claramente. Continue qualificando o projeto em vez de
encerrar o atendimento imediatamente.

Nunca diga que o cadastro foi salvo, que uma proposta foi criada,
que um pagamento foi recebido ou que alguém entrará em contato,
a menos que o sistema realmente tenha executado essa ação.
      `,
      input,
    });

    const answer =
      response.output_text ||
      "Não consegui gerar uma resposta neste momento.";

    let opportunityRegistration = 'not_attempted';

    if (
      hasExplicitAuthorization(messages) &&
      req.body?.registrationCompleted !== true
    ) {
      const extractedOpportunity = await extractOpportunity(openai, input);
      const opportunity = validateOpportunity(extractedOpportunity);

      if (opportunity) {
        try {
          const registrationResponse = await fetch(
            `http://127.0.0.1:${PORT}/api/oportunidades`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(opportunity),
            }
          );

          opportunityRegistration = registrationResponse.ok
            ? 'success'
            : 'failed';
        } catch (error) {
          console.error('Erro ao enviar oportunidade para cadastro:', error);
          opportunityRegistration = 'failed';
        }
      }
    }

    return res.json({
      answer,
      opportunityRegistration,
    });
  } catch (error) {
    console.error("Erro MIL IA:", error?.message || error);

    return res.status(500).json({
      error:
        "A MIL IA encontrou uma dificuldade momentânea. Tente novamente.",
    });
  }
});

if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`MIL IA API funcionando na porta ${PORT}`);
});