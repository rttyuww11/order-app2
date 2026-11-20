const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export async function apiRequest(path, { method = 'GET', body, adminPassword } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (adminPassword) headers.Authorization = `Bearer ${adminPassword}`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('서버 응답을 읽지 못했습니다.')
  }

  if (!response.ok) {
    const error = new Error(result.error || `요청에 실패했습니다. (${response.status})`)
    error.status = response.status
    throw error
  }

  return result
}
