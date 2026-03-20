import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Sidebar', () => {
  const defaultProps = {
    activeTown: 'Ayr',
    setActiveTown: vi.fn(),
    towns: ['Ayr', 'Kilmarnock'],
    onSync: vi.fn(),
    syncing: false,
    onNav: vi.fn(),
    activeNav: 'Dashboard',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) =>
      url?.includes?.('/api/auth/status')
        ? Promise.resolve({ ok: true, json: () => ({ authRequired: false, userMode: false }) })
        : Promise.reject(new Error('Network error'))
    ));
  });

  it('renders Live Intel and Shortlist', async () => {
    render(
      <Wrapper>
        <Sidebar {...defaultProps} />
      </Wrapper>
    );
    expect(screen.getByText(/Live Intel/)).toBeInTheDocument();
    expect(screen.getByText(/Shortlist/)).toBeInTheDocument();
  });

  it('calls onNav when Shortlist clicked', async () => {
    const onNav = vi.fn();
    render(
      <Wrapper>
        <Sidebar {...defaultProps} onNav={onNav} />
      </Wrapper>
    );
    fireEvent.click(screen.getByText(/Shortlist/));
    expect(onNav).toHaveBeenCalledWith('Shortlist');
  });
});
