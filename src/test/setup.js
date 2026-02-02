import '@testing-library/jest-dom'

// Мок localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i) => Object.keys(store)[i] ?? null)
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Мок clipboard (configurable: true чтобы @testing-library/user-event мог переопределить)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  },
  writable: true,
  configurable: true
})

// Сбрасываем localStorage между тестами
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})
