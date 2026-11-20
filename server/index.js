import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import pg from 'pg'
import { lostItems } from '../src/data/lostItems.js'

const { Pool } = pg
const port = Number(process.env.PORT || 3001)
const databaseUrl = process.env.DATABASE_URL
const adminPassword = process.env.ADMIN_PASSWORD

if (!databaseUrl) throw new Error('DATABASE_URL 환경 변수가 필요합니다.')
if (!adminPassword) throw new Error('ADMIN_PASSWORD 환경 변수가 필요합니다.')

const pool = new Pool({ connectionString: databaseUrl })
const app = express()
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('이 출처의 요청은 허용되지 않습니다.'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '25mb' }))

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}

function passwordsMatch(candidate) {
  if (typeof candidate !== 'string') return false
  const expectedBuffer = Buffer.from(adminPassword)
  const candidateBuffer = Buffer.from(candidate)
  return expectedBuffer.length === candidateBuffer.length
    && timingSafeEqual(expectedBuffer, candidateBuffer)
}

function requireAdmin(request, response, next) {
  const authorization = request.get('authorization') || ''
  const candidate = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''

  if (!passwordsMatch(candidate)) {
    response.status(401).json({ error: '관리자 인증이 필요합니다.' })
    return
  }
  next()
}

function validItem(item) {
  return item !== null
    && typeof item === 'object'
    && !Array.isArray(item)
    && typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.name === 'string'
    && typeof item.category === 'string'
}

async function getItems() {
  const { rows } = await pool.query(
    'SELECT data FROM lost_items ORDER BY created_at DESC, id ASC',
  )
  return rows.map((row) => row.data)
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lost_items (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM lost_items')
  if (rows[0].count === 0) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const item of lostItems) {
        await client.query(
          'INSERT INTO lost_items (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING',
          [item.id, JSON.stringify(item)],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

app.get('/healthz', asyncRoute(async (_request, response) => {
  await pool.query('SELECT 1')
  response.json({ status: 'ok' })
}))

app.get('/api/items', asyncRoute(async (_request, response) => {
  response.json({ items: await getItems() })
}))

app.post('/api/admin/login', (request, response) => {
  if (!passwordsMatch(request.body?.password)) {
    response.status(401).json({ error: '관리자 비밀번호가 올바르지 않습니다.' })
    return
  }
  response.json({ authenticated: true })
})

app.post('/api/items/import-local', requireAdmin, asyncRoute(async (request, response) => {
  const items = request.body
  if (!Array.isArray(items) || items.length > 1000 || !items.every(validItem)) {
    response.status(400).json({ error: '가져올 분실물 데이터 형식이 올바르지 않습니다.' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of items) {
      await client.query(
        'INSERT INTO lost_items (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING',
        [item.id, JSON.stringify(item)],
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  response.json({ items: await getItems() })
}))

app.post('/api/items', requireAdmin, asyncRoute(async (request, response) => {
  const item = request.body
  if (!validItem(item)) {
    response.status(400).json({ error: '분실물 데이터 형식이 올바르지 않습니다.' })
    return
  }

  const { rows } = await pool.query(
    'INSERT INTO lost_items (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING RETURNING data',
    [item.id, JSON.stringify(item)],
  )
  if (rows.length === 0) {
    response.status(409).json({ error: '같은 ID의 분실물이 이미 등록되어 있습니다.' })
    return
  }
  response.status(201).json({ item: rows[0].data })
}))

app.put('/api/items/:id', requireAdmin, asyncRoute(async (request, response) => {
  const item = request.body
  if (!validItem(item) || item.id !== request.params.id) {
    response.status(400).json({ error: '수정할 분실물 데이터 형식이 올바르지 않습니다.' })
    return
  }

  const { rows } = await pool.query(
    'UPDATE lost_items SET data = $2::jsonb WHERE id = $1 RETURNING data',
    [request.params.id, JSON.stringify(item)],
  )
  if (rows.length === 0) {
    response.status(404).json({ error: '수정할 분실물을 찾을 수 없습니다.' })
    return
  }
  response.json({ item: rows[0].data })
}))

app.delete('/api/items/:id', requireAdmin, asyncRoute(async (request, response) => {
  const { rowCount } = await pool.query(
    'DELETE FROM lost_items WHERE id = $1',
    [request.params.id],
  )
  if (rowCount === 0) {
    response.status(404).json({ error: '삭제할 분실물을 찾을 수 없습니다.' })
    return
  }
  response.json({ deleted: true })
}))

app.use((error, _request, response, _next) => {
  console.error('API 요청 처리 실패:', error)
  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: '요청 데이터가 너무 큽니다.' })
    return
  }
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, 'body')) {
    response.status(400).json({ error: 'JSON 요청 형식이 올바르지 않습니다.' })
    return
  }
  response.status(500).json({ error: '서버에서 요청을 처리하지 못했습니다.' })
})

initializeDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`API 서버가 ${port} 포트에서 실행 중입니다.`)
    })
  })
  .catch((error) => {
    console.error('데이터베이스 초기화 실패:', error)
    process.exitCode = 1
  })
