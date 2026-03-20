import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateStrategyFlow, loadStrategyFlow } from './evaluateStrategyFlow.js';
import fs from 'fs';
import path from 'path';

const mockFlow = {
  nodes: [
    { id: 'input', type: 'input' },
    { id: 'c1', type: 'condition', data: { field: 'yieldMax', operator: '>', value: 12 } },
    { id: 'c2', type: 'condition', data: { field: 'buyMax', operator: '>', value: 200000 } },
    { id: 's1', type: 'strategy', data: { strategy: 'BRRR' } },
    { id: 's2', type: 'strategy', data: { strategy: 'Flip' } },
    { id: 's3', type: 'strategy', data: { strategy: 'BTL' } },
  ],
  edges: [
    { source: 'input', sourceHandle: 'out', target: 'c1' },
    { source: 'c1', sourceHandle: 'true', target: 's1' },
    { source: 'c1', sourceHandle: 'false', target: 'c2' },
    { source: 'c2', sourceHandle: 'true', target: 's2' },
    { source: 'c2', sourceHandle: 'false', target: 's3' },
  ],
};

describe('evaluateStrategyFlow', () => {
  it('returns BRRR when yieldMax > 12', () => {
    const seg = { yieldMax: 14, buyMax: 150000 };
    expect(evaluateStrategyFlow(mockFlow, seg)).toBe('BRRR');
  });
  it('returns Flip when yieldMax <= 12 and buyMax > 200000', () => {
    const seg = { yieldMax: 10, buyMax: 250000 };
    expect(evaluateStrategyFlow(mockFlow, seg)).toBe('Flip');
  });
  it('returns BTL when both conditions false', () => {
    const seg = { yieldMax: 8, buyMax: 120000 };
    expect(evaluateStrategyFlow(mockFlow, seg)).toBe('BTL');
  });
  it('handles custom strategy', () => {
    const flow = {
      ...mockFlow,
      nodes: mockFlow.nodes.map((n) =>
        n.id === 's3' ? { ...n, data: { strategy: '__custom__', custom: 'HMO' } } : n
      ),
    };
    const seg = { yieldMax: 8, buyMax: 120000 };
    expect(evaluateStrategyFlow(flow, seg)).toBe('HMO');
  });
});
