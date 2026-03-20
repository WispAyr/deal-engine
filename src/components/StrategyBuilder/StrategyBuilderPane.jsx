import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import InputNode from './InputNode';
import ConditionNode from './ConditionNode';
import StrategyNode from './StrategyNode';
import { Workflow, Plus, Trash2, Save, RotateCcw, FilePlus, Star, LayoutGrid, ChevronRight, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const NODE_TYPES = {
  input: InputNode,
  condition: ConditionNode,
  strategy: StrategyNode,
};

const cloneFlow = (flow, suffix = '') => {
  const idMap = {};
  const suf = suffix ? `-${suffix}` : `-${Date.now()}`;
  const newId = (old) => (idMap[old] ??= String(old) + suf);
  const nodes = (flow.nodes || []).map((n) => ({
    ...n,
    id: newId(n.id),
    position: { ...n.position },
  }));
  const edges = (flow.edges || []).map((e, i) => ({
    ...e,
    id: `e${suf}-${i}`,
    source: idMap[e.source] ?? e.source,
    target: idMap[e.target] ?? e.target,
  }));
  return { nodes, edges };
};

const balancedFlow = () => ({
  nodes: [
    { id: 'input', type: 'input', position: { x: 80, y: 200 }, data: {} },
    { id: 'c1', type: 'condition', position: { x: 320, y: 120 }, data: { field: 'yieldMax', operator: '>', value: 12 } },
    { id: 'c2', type: 'condition', position: { x: 320, y: 280 }, data: { field: 'buyMax', operator: '>', value: 200000 } },
    { id: 's1', type: 'strategy', position: { x: 600, y: 60 }, data: { strategy: 'BRRR' } },
    { id: 's2', type: 'strategy', position: { x: 600, y: 220 }, data: { strategy: 'Flip' } },
    { id: 's3', type: 'strategy', position: { x: 600, y: 380 }, data: { strategy: 'BTL' } },
  ],
  edges: [
    { id: 'e1', source: 'input', target: 'c1', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e2', source: 'c1', target: 's1', sourceHandle: 'true', targetHandle: 'in' },
    { id: 'e3', source: 'c1', target: 'c2', sourceHandle: 'false', targetHandle: 'in' },
    { id: 'e4', source: 'c2', target: 's2', sourceHandle: 'true', targetHandle: 'in' },
    { id: 'e5', source: 'c2', target: 's3', sourceHandle: 'false', targetHandle: 'in' },
  ],
});

const DEFAULT_STRATEGIES = [
  { id: 'default-balanced', name: 'Balanced', desc: 'Yield >12% → BRRR, Buy >200k → Flip, else BTL', ...cloneFlow(balancedFlow(), '-bal') },
  { id: 'default-btl', name: 'BTL Focus', desc: 'Prioritise buy-to-let for steady income', ...cloneFlow({ nodes: [{ id: 'input', type: 'input', position: { x: 80, y: 150 }, data: {} }, { id: 's1', type: 'strategy', position: { x: 400, y: 150 }, data: { strategy: 'BTL' } }], edges: [{ id: 'e1', source: 'input', target: 's1', sourceHandle: 'out', targetHandle: 'in' }] }, '-btl') },
  { id: 'default-brrr', name: 'BRRR Focus', desc: 'Yield >10% → BRRR, else BTL', ...cloneFlow({ nodes: [{ id: 'input', type: 'input', position: { x: 80, y: 180 }, data: {} }, { id: 'c1', type: 'condition', position: { x: 320, y: 180 }, data: { field: 'yieldMax', operator: '>', value: 10 } }, { id: 's1', type: 'strategy', position: { x: 540, y: 80 }, data: { strategy: 'BRRR' } }, { id: 's2', type: 'strategy', position: { x: 540, y: 260 }, data: { strategy: 'BTL' } }], edges: [{ id: 'e1', source: 'input', target: 'c1', sourceHandle: 'out', targetHandle: 'in' }, { id: 'e2', source: 'c1', target: 's1', sourceHandle: 'true', targetHandle: 'in' }, { id: 'e3', source: 'c1', target: 's2', sourceHandle: 'false', targetHandle: 'in' }] }, '-brrr') },
  { id: 'default-flip', name: 'Flip Focus', desc: 'Buy >180k → Flip, else BTL', ...cloneFlow({ nodes: [{ id: 'input', type: 'input', position: { x: 80, y: 180 }, data: {} }, { id: 'c1', type: 'condition', position: { x: 320, y: 180 }, data: { field: 'buyMax', operator: '>', value: 180000 } }, { id: 's1', type: 'strategy', position: { x: 540, y: 80 }, data: { strategy: 'Flip' } }, { id: 's2', type: 'strategy', position: { x: 540, y: 260 }, data: { strategy: 'BTL' } }], edges: [{ id: 'e1', source: 'input', target: 'c1', sourceHandle: 'out', targetHandle: 'in' }, { id: 'e2', source: 'c1', target: 's1', sourceHandle: 'true', targetHandle: 'in' }, { id: 'e3', source: 'c1', target: 's2', sourceHandle: 'false', targetHandle: 'in' }] }, '-flip') },
  { id: 'default-hmo', name: 'HMO Focus', desc: 'Yield >14% → HMO, else BTL', ...cloneFlow({ nodes: [{ id: 'input', type: 'input', position: { x: 80, y: 180 }, data: {} }, { id: 'c1', type: 'condition', position: { x: 320, y: 180 }, data: { field: 'yieldMax', operator: '>', value: 14 } }, { id: 's1', type: 'strategy', position: { x: 540, y: 80 }, data: { strategy: 'HMO' } }, { id: 's2', type: 'strategy', position: { x: 540, y: 260 }, data: { strategy: 'BTL' } }], edges: [{ id: 'e1', source: 'input', target: 'c1', sourceHandle: 'out', targetHandle: 'in' }, { id: 'e2', source: 'c1', target: 's1', sourceHandle: 'true', targetHandle: 'in' }, { id: 'e3', source: 'c1', target: 's2', sourceHandle: 'false', targetHandle: 'in' }] }, '-hmo') },
];

function StrategyBuilderInner() {
  const { apiFetch } = useAuth();
  const [view, setView] = useState('browse');
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [flowName, setFlowName] = useState('');
  const [flows, setFlows] = useState([]);
  const [defaultId, setDefaultId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(balancedFlow().nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(balancedFlow().edges);

  const loadFlows = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/strategies`);
      if (res.ok) {
        const data = await res.json();
        const list = data.flows || [];
        setFlows(list);
        setDefaultId(data.defaultId ?? null);
      }
    } catch {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const selectFlow = (f) => {
    setCurrentFlowId(f.id || f.name);
    setFlowName(f.name || 'Unnamed');
    setNodes(f.nodes || []);
    setEdges(f.edges || []);
    setView('edit');
  };

  const useTemplate = (def) => {
    const suffix = `-${Date.now()}`;
    const { nodes: n, edges: e } = cloneFlow(def, suffix);
    const newId = `flow${suffix}`;
    setCurrentFlowId(newId);
    setFlowName(`${def.name} (copy)`);
    setNodes(n);
    setEdges(e);
    setView('edit');
    setMessage('Template applied — Save to persist');
    setTimeout(() => setMessage(null), 2000);
  };

  const newFlow = () => {
    const def = balancedFlow();
    setCurrentFlowId(`flow-${Date.now()}`);
    setFlowName('New Strategy');
    setNodes(def.nodes);
    setEdges(def.edges);
    setView('edit');
    setMessage('New flow created — Save to persist');
    setTimeout(() => setMessage(null), 2000);
  };

  const deleteFlow = async () => {
    if (!currentFlowId || !confirm(`Delete "${flowName}"?`)) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/strategies/${encodeURIComponent(currentFlowId)}`, { method: 'DELETE' });
      if (res.ok) {
        loadFlows();
        setView('browse');
      }
    } catch (e) {
      setMessage(e.message || 'Delete failed');
    }
  };

  const setAsDefault = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentFlowId,
          name: flowName,
          nodes: nodes.map(({ data, ...rest }) => ({ ...rest, data: { ...data, onUpdate: undefined } })),
          edges,
          setAsDefault: true,
        }),
      });
      if (res.ok) {
        setMessage('Set as default');
        loadFlows();
      }
    } catch (e) {
      setMessage(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
      )
    );
  }, [setNodes]);

  const nodesWithCallbacks = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onUpdate: (d) => updateNodeData(n.id, d),
    },
  }));

  const addNode = (type) => {
    const id = `${type}-${Date.now()}`;
    const basePos = { x: 400 + Math.random() * 100, y: 200 + Math.random() * 100 };
    const newNode = {
      id,
      type,
      position: basePos,
      data: type === 'condition' ? { field: 'yieldMax', operator: '>', value: 12 } : type === 'strategy' ? { strategy: 'BTL' } : {},
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelected = () => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    const ids = new Set(selected.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
  };

  const saveFlow = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentFlowId,
          name: flowName,
          nodes: nodes.map(({ data, ...rest }) => ({ ...rest, data: { ...data, onUpdate: undefined } })),
          edges,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCurrentFlowId(saved.id);
        setMessage('Saved');
        loadFlows();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(err.error || 'Save failed');
      }
    } catch (e) {
      setMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="strategy-builder-loading">
        <Workflow size={32} />
        <p>Loading strategies…</p>
      </div>
    );
  }

  if (view === 'browse') {
    return (
      <div className="strategy-builder strategy-builder-browse">
        <div className="strategy-browse-header">
          <h2>Strategy Flows</h2>
          <p className="helper-text">Choose a template or create your own. The default flow powers AI intel generation.</p>
          <button type="button" onClick={newFlow} className="toolbar-btn primary">
            <FilePlus size={16} /> New Strategy
          </button>
        </div>
        <div className="strategy-browse-grid">
          <section className="strategy-group">
            <h3>Default Strategies</h3>
            <p className="strategy-group-desc">Templates you can use as a starting point</p>
            <div className="strategy-cards">
              {DEFAULT_STRATEGIES.map((s) => (
                <motion.div
                  key={s.id}
                  className="strategy-card strategy-card-default"
                  whileHover={{ y: -4 }}
                  onClick={() => useTemplate(s)}
                >
                  <div className="strategy-card-icon">📋</div>
                  <h4>{s.name}</h4>
                  <p>{s.desc}</p>
                  <button type="button" className="strategy-card-btn" onClick={(e) => { e.stopPropagation(); useTemplate(s); }}>
                    <Copy size={14} /> Use template
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
          <section className="strategy-group">
            <h3>My Strategies</h3>
            <p className="strategy-group-desc">Your saved flows — click to edit</p>
            {flows.length === 0 ? (
              <p className="strategy-empty">No saved strategies yet. Use a template or create new.</p>
            ) : (
              <div className="strategy-cards">
                {flows.map((f) => (
                  <motion.div
                    key={f.id || f.name}
                    className={`strategy-card strategy-card-mine ${defaultId === (f.id || f.name) ? 'is-default' : ''}`}
                    whileHover={{ y: -4 }}
                    onClick={() => selectFlow(f)}
                  >
                    {defaultId === (f.id || f.name) && <span className="strategy-card-badge">Default</span>}
                    <div className="strategy-card-icon">⚡</div>
                    <h4>{f.name || f.id || 'Unnamed'}</h4>
                    <button type="button" className="strategy-card-btn" onClick={(e) => { e.stopPropagation(); selectFlow(f); }}>
                      <ChevronRight size={14} /> Edit
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="strategy-builder">
      <div className="strategy-builder-toolbar">
        <button type="button" onClick={() => setView('browse')} className="toolbar-btn" title="Browse strategies">
          <LayoutGrid size={16} /> Browse
        </button>
        <input
          type="text"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          placeholder="Strategy name"
          className="flow-name-input"
        />
        <div className="toolbar-actions">
          <button type="button" onClick={saveFlow} disabled={saving} className="toolbar-btn primary">
            <Save size={16} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={setAsDefault} disabled={saving || defaultId === currentFlowId} className="toolbar-btn" title="Use for intel generation">
            <Star size={16} /> Default
          </button>
          <button type="button" onClick={deleteFlow} className="toolbar-btn danger" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="toolbar-nodes">
          <button type="button" onClick={() => addNode('condition')} className="toolbar-btn small">
            <Plus size={14} /> Condition
          </button>
          <button type="button" onClick={() => addNode('strategy')} className="toolbar-btn small">
            <Plus size={14} /> Strategy
          </button>
          <button type="button" onClick={deleteSelected} className="toolbar-btn danger small">
            <Trash2 size={14} /> Delete
          </button>
        </div>
        {message && <span className="toolbar-message">{message}</span>}
      </div>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="strategy-flow"
      >
        <Background color="var(--border-subtle)" gap={20} size={1} />
        <Controls className="strategy-controls" />
        <MiniMap className="strategy-minimap" />
        <Panel position="top-right" className="strategy-panel">
          <p className="helper-text">Input → Condition → Strategy. Connect true/false branches.</p>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function StrategyBuilderPane() {
  return (
    <ReactFlowProvider>
      <StrategyBuilderInner />
    </ReactFlowProvider>
  );
}
