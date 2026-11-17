import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const itemsFile = join(homedir(), '.school-lost-and-found-kiosk', 'items.json')

function persistentItemsPlugin() {
  async function handleRequest(request, response, next) {
    if (new URL(request.url, 'http://localhost').pathname !== '/api/items') {
      next()
      return
    }

    response.setHeader('Content-Type', 'application/json; charset=utf-8')

    if (request.method === 'GET') {
      try {
        const items = JSON.parse(await readFile(itemsFile, 'utf8'))
        response.end(JSON.stringify({ items }))
      } catch (error) {
        if (error.code !== 'ENOENT') {
          response.statusCode = 500
          response.end(JSON.stringify({ error: '분실물 데이터를 읽지 못했습니다.' }))
          return
        }
        response.end(JSON.stringify({ items: null }))
      }
      return
    }

    if (request.method !== 'PUT') {
      response.statusCode = 405
      response.end(JSON.stringify({ error: '지원하지 않는 요청입니다.' }))
      return
    }

    try {
      const chunks = []
      let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 25_000_000) {
          response.statusCode = 413
          response.end(JSON.stringify({ error: '분실물 데이터가 너무 큽니다.' }))
          return
        }
        chunks.push(chunk)
      }

      const items = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!Array.isArray(items)) {
        response.statusCode = 400
        response.end(JSON.stringify({ error: '분실물 데이터 형식이 올바르지 않습니다.' }))
        return
      }

      await mkdir(join(homedir(), '.school-lost-and-found-kiosk'), { recursive: true })
      const temporaryFile = `${itemsFile}.tmp`
      await writeFile(temporaryFile, JSON.stringify(items), 'utf8')
      await rename(temporaryFile, itemsFile)
      response.end(JSON.stringify({ saved: true }))
    } catch {
      response.statusCode = 500
      response.end(JSON.stringify({ error: '분실물 데이터를 저장하지 못했습니다.' }))
    }
  }

  return {
    name: 'persistent-items',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

export default defineConfig({
  plugins: [react(), persistentItemsPlugin()],
})
