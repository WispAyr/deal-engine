import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url?.includes?.('/api/auth/status')) return Promise.resolve({ ok: true, json: () => ({ authRequired: false, userMode: false }) });
    return Promise.reject(new Error('Network error'));
  }))
})

const renderWithRouter = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )

describe('App', () => {
  it('renders marketing page as default', () => {
    renderWithRouter(['/'])
    expect(screen.getByText(/Property Deal Intel for Ayrshire/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open deal engine/i })).toBeInTheDocument()
  })

  it('renders sidebar with Live Intel on /app', () => {
    renderWithRouter(['/app'])
    expect(screen.getByText(/Live Intel/)).toBeInTheDocument()
  })

  it('shows error when backend unavailable on app', async () => {
    renderWithRouter(['/app'])
    await screen.findByText(/Backend offline/, {}, { timeout: 3000 })
  })
})
