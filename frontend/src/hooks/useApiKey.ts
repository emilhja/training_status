const STORAGE_KEY = 'app_api_key'

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function setApiKey(key: string): void {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
