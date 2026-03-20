import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PropertyCard from './PropertyCard'

describe('PropertyCard', () => {
  const baseProps = {
    id: 'test-1',
    rank: '01',
    title: 'Ayr – 1-Bed Flat',
    yieldText: '6.0-10.0%',
    icon: '🏠',
    tags: ['HM Land Registry: 0 Records', 'Rightmove: 5 Rentals', 'BTL'],
    stats: [
      { label: 'BUY BAND', value: '£35k-£80k' },
      { label: 'RENT PCM', value: '£400-£600' }
    ],
    banner: 'Buy under £35k if rent exceeds £600 | Confidence: Medium',
    expanded: false,
    intel: null,
    ka8Stats: null,
    ka7Stats: null,
    listings: [],
    rentals: []
  }

  it('renders collapsed card by default', () => {
    render(<PropertyCard {...baseProps} />)
    expect(screen.getByText('Ayr – 1-Bed Flat')).toBeInTheDocument()
    expect(screen.getByText('6.0-10.0%')).toBeInTheDocument()
  })

  it('renders Intel and Mkt tabs when expanded', () => {
    const intel = {
      strategy_primary: 'BTL',
      deal_rule: 'Buy under £35k',
      buy_min: 35000,
      buy_max: 80000,
      rent_min: 400,
      rent_max: 600,
      yield_min: 6,
      yield_max: 10,
      micro_locations: [],
      risks: []
    }
    render(<PropertyCard {...baseProps} expanded intel={intel} />)
    expect(screen.getByRole('button', { name: /intel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mkt/i })).toBeInTheDocument()
  })
})
