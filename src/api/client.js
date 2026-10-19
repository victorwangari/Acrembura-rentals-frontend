
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('acrembura_access_token')

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(
      'Unable to connect to the server. Check that the backend is running.'
    )
  }

  const result = await response.json().catch(() => ({
    success: false,
    message: 'The server returned an invalid response.',
    data: {},
  }))

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('acrembura:unauthorized'))
    }

    throw new Error(result.message || 'The request failed.')
  }

  return result
}
