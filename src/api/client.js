const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const ACCESS_TOKEN_KEY = 'acrembura_access_token'
const REFRESH_TOKEN_KEY = 'acrembura_refresh_token'

let refreshPromise = null

function buildHeaders(options, token) {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    ...(options.body && !isFormData
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...options.headers,
  }

  if (isFormData) {
    delete headers['Content-Type']
    delete headers['content-type']
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function parseResponse(response) {
  return response.json().catch(() => ({
    success: false,
    message: 'The server returned an invalid response.',
    data: {},
  }))
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      throw new Error('No refresh token is available.')
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    const result = await parseResponse(response)

    if (!response.ok || !result.success || !result.data?.access_token) {
      throw new Error(result.message || 'Your session has expired.')
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, result.data.access_token)

    return result.data.access_token
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function performRequest(path, options, token) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options, token),
  })
}

export async function apiRequest(path, options = {}) {
  const isAuthEndpoint =
    path === '/auth/login' || path === '/auth/refresh'

  let token = localStorage.getItem(ACCESS_TOKEN_KEY)

  let response

  try {
    response = await performRequest(path, options, token)
  } catch {
    throw new Error(
      'Unable to connect to the server. Check that the backend is running.'
    )
  }

  let result = await parseResponse(response)

  if (response.status === 401 && !isAuthEndpoint) {
    try {
      token = await refreshAccessToken()
      response = await performRequest(path, options, token)
      result = await parseResponse(response)
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      window.dispatchEvent(new Event('acrembura:unauthorized'))
      throw error
    }
  }

  if (!response.ok || result.success === false) {
    if (response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      window.dispatchEvent(new Event('acrembura:unauthorized'))
    }

    throw new Error(result.message || 'The request failed.')
  }

  return result
}
