import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TownsInfoPane from './TownsInfoPane'

describe('TownsInfoPane', () => {
  it('renders town cards grouped by area', () => {
    render(
      <TownsInfoPane
        listings={[]}
        rentals={[]}
        statsData={{}}
        priceHistory={[]}
      />
    )
    expect(screen.getByText('South Ayrshire')).toBeInTheDocument()
    expect(screen.getByText('East Ayrshire')).toBeInTheDocument()
    expect(screen.getByText('North Ayrshire')).toBeInTheDocument()
    expect(screen.getByText('Ayr')).toBeInTheDocument()
    expect(screen.getByText('Kilmarnock')).toBeInTheDocument()
    expect(screen.getByText('Irvine')).toBeInTheDocument()
  })

  it('shows helper text about price history', () => {
    render(
      <TownsInfoPane listings={[]} rentals={[]} statsData={{}} priceHistory={[]} />
    )
    expect(screen.getByText(/Town-level market stats/)).toBeInTheDocument()
  })
})
