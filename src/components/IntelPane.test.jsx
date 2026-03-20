import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import IntelPane from './IntelPane'

describe('IntelPane', () => {
  const mockIntel = {
    strategy_primary: 'BTL',
    deal_rule: 'Buy under £35k if rent exceeds £600',
    why_this_works: ['Steady income. Buy band aligns with local rental demand.'],
    buy_min: 35000,
    buy_max: 80000,
    rent_min: 400,
    rent_max: 600,
    yield_min: 6,
    yield_max: 10,
    micro_locations: [
      { area: 'Central', description: 'Default focus zone.' }
    ],
    risks: ['Stable market dynamics.']
  }

  it('renders null when intel is missing', () => {
    const { container } = render(<IntelPane intel={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders strategy and deal rule', () => {
    render(<IntelPane intel={mockIntel} />)
    expect(screen.getByText(/BTL STRATEGY/)).toBeInTheDocument()
    expect(screen.getByText(/Buy under £35k if rent exceeds £600/)).toBeInTheDocument()
  })

  it('renders micro locations using description', () => {
    render(<IntelPane intel={mockIntel} />)
    expect(screen.getByText(/Central/)).toBeInTheDocument()
    expect(screen.getByText(/Default focus zone\./)).toBeInTheDocument()
  })

  it('falls back when why_this_works is missing', () => {
    const intelNoWhy = { ...mockIntel, why_this_works: undefined }
    render(<IntelPane intel={intelNoWhy} />)
    expect(screen.getByText(/yields 6\.0–10\.0%/)).toBeInTheDocument()
  })
})
