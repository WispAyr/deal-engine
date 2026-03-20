/**
 * Evaluate a strategy flow (nodes + edges) against segment data.
 * Used by generateRealIntel when strategy_flows.json exists.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRATEGY_DB = path.join(__dirname, '../src/data/strategy_flows.json');

const OPS = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b,
};

export function loadStrategyFlow() {
  if (!fs.existsSync(STRATEGY_DB)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(STRATEGY_DB, 'utf-8'));
    const flows = Array.isArray(data.flows) ? data.flows : (data.default ? [data.default] : []);
    const defaultId = data.defaultId ?? data.default?.id;
    const flow = flows.find((f) => (f.id || f.name) === defaultId) || flows[0];
    if (flow?.nodes?.length && flow?.edges?.length) return flow;
  } catch {}
  return null;
}

export function evaluateStrategyFlow(flow, segment) {
  const { nodes = [], edges = [] } = flow;
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const outEdges = {};
  edges.forEach((e) => {
    const key = `${e.source}-${e.sourceHandle || 'out'}`;
    if (!outEdges[key]) outEdges[key] = [];
    outEdges[key].push(e);
  });

  const ctx = {
    yieldMin: segment.yieldMin ?? 0,
    yieldMax: segment.yieldMax ?? 0,
    buyMin: segment.buyMin ?? 0,
    buyMax: segment.buyMax ?? 0,
    rentMin: segment.rentMin ?? 0,
    rentMax: segment.rentMax ?? 0,
    dataPoints: segment.dataPoints ?? 0,
  };

  function walk(nodeId, handle = 'out') {
    const key = `${nodeId}-${handle}`;
    const nextEdges = outEdges[key] || [];
    for (const e of nextEdges) {
      const target = nodeMap[e.target];
      if (!target) continue;
      if (target.type === 'strategy') {
        const s = target.data?.strategy;
        return s === '__custom__' ? (target.data?.custom || 'BTL') : (s || 'BTL');
      }
      if (target.type === 'condition') {
        const { field, operator, value } = target.data || {};
        const opFn = OPS[operator];
        const lhs = ctx[field];
        const rhs = value;
        const result = opFn ? opFn(Number(lhs), Number(rhs)) : false;
        const nextHandle = result ? 'true' : 'false';
        const res = walk(target.id, nextHandle);
        if (res) return res;
      }
    }
    return null;
  }

  const inputNode = nodes.find((n) => n.type === 'input');
  if (!inputNode) return 'BTL';
  return walk(inputNode.id, 'out') || 'BTL';
}
