import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function InputNode() {
  return (
    <div className="strategy-node strategy-node-input">
      <div className="node-header">📥 Segment Data</div>
      <p className="node-desc">Market data (yield, buy band, rent) for town/type</p>
      <Handle type="source" position={Position.Right} id="out" className="node-handle" />
    </div>
  );
}

export default memo(InputNode);
