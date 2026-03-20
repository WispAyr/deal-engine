import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const PRESETS = ['BTL', 'BRRR', 'Flip', 'HMO', 'SA'];

function StrategyNode({ data, selected }) {
  const { strategy = 'BTL', custom = '', onUpdate } = data;
  const isCustom = strategy === '__custom__';
  const display = isCustom ? custom || 'Custom' : strategy;

  const update = (key, val) => {
    if (onUpdate) onUpdate({ ...data, [key]: val });
  };

  return (
    <div className={`strategy-node strategy-node-output ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" className="node-handle" />
      <div className="node-header">📤 Output</div>
      <div className="node-edit nodrag">
        <select
          value={strategy}
          onChange={(e) => {
            const v = e.target.value;
            update('strategy', v);
            if (v !== '__custom__') update('custom', v);
          }}
          className="strategy-select"
        >
          {PRESETS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="__custom__">Custom</option>
        </select>
        {isCustom && (
          <input
            type="text"
            value={custom}
            onChange={(e) => update('custom', e.target.value)}
            placeholder="Strategy name"
            className="strategy-input"
            style={{ marginTop: 6, width: '100%' }}
          />
        )}
      </div>
      <span className="node-strategy-badge">{display}</span>
    </div>
  );
}

export default memo(StrategyNode);
