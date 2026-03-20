import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const FIELDS = [
  { value: 'yieldMax', label: 'Yield Max %' },
  { value: 'yieldMin', label: 'Yield Min %' },
  { value: 'buyMax', label: 'Buy Max £' },
  { value: 'buyMin', label: 'Buy Min £' },
  { value: 'rentMax', label: 'Rent Max £' },
  { value: 'dataPoints', label: 'Data Points' },
];

const OPS = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
];

function ConditionNode({ data, selected }) {
  const { field = 'yieldMax', operator = '>', value = 12, onUpdate } = data;

  const update = (key, val) => {
    if (onUpdate) onUpdate({ ...data, [key]: val });
  };

  return (
    <div className={`strategy-node strategy-node-condition ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" className="node-handle" />
      <div className="node-header">🔀 Condition</div>
      <div className="node-edit nodrag" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={field} onChange={(e) => update('field', e.target.value)} className="strategy-select">
          {FIELDS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select value={operator} onChange={(e) => update('operator', e.target.value)} className="strategy-select" style={{ width: 60 }}>
          {OPS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => update('value', parseInt(e.target.value, 10) || 0)}
          className="strategy-input"
          style={{ width: 80 }}
        />
      </div>
      <div className="node-handles-out">
        <Handle type="source" position={Position.Right} id="true" style={{ top: '60%' }} className="node-handle node-handle-true" />
        <Handle type="source" position={Position.Right} id="false" style={{ top: '85%' }} className="node-handle node-handle-false" />
        <span className="handle-label true">✓ true</span>
        <span className="handle-label false">✗ false</span>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
