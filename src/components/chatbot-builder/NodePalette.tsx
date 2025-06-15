import { NodePaletteProps } from './types';

const NODE_TYPES = [
  { type: 'message', label: 'Message Node' },
  { type: 'condition', label: 'Condition Node' },
  { type: 'api', label: 'API Node' },
  { type: 'output', label: 'Output Node' },
];

export const NodePalette = ({ onNodeAdd }: NodePaletteProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Node Types</h2>
      <div className="space-y-2">
        {NODE_TYPES.map(node => (
          <button
            key={node.type}
            onClick={() => onNodeAdd(node.type)}
            className="w-full p-2 text-left border rounded hover:bg-gray-100 transition-colors"
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/reactflow', node.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            {node.label}
          </button>
        ))}
      </div>
    </div>
  );
};
