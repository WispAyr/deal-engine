import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from './Dashboard'

vi.mock('./MapView', () => ({ default: () => <div data-testid="map-view">Map</div> }))

describe('Dashboard', () => {
  it('renders stat cards', () => {
    render(
      <Dashboard
        intelData={{ Ayr: {} }}
        statsData={{}}
        listings={[{ id: 1, town: 'Ayr' }, { id: 2, town: 'Ayr' }]}
        rentals={[{ id: 3, town: 'Ayr' }]}
        shortlistCount={2}
      />
    )
    expect(screen.getByText('Listings')).toBeInTheDocument()
    expect(screen.getByText('Rentals')).toBeInTheDocument()
    expect(screen.getByText('Shortlist')).toBeInTheDocument()
    expect(screen.getByText('Intel Prompts')).toBeInTheDocument()
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('renders by-town breakdown', () => {
    render(
      <Dashboard
        intelData={{ Ayr: {}, Kilmarnock: {} }}
        statsData={{}}
        listings={[{ id: 1, town: 'Ayr' }, { id: 2, town: 'Kilmarnock' }]}
        rentals={[]}
        shortlistCount={0}
      />
    )
    expect(screen.getByText('Ayr')).toBeInTheDocument()
    expect(screen.getByText('Kilmarnock')).toBeInTheDocument()
  })
})
