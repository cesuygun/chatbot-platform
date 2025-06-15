import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodePalette } from './NodePalette';
import { useCallback } from 'react';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 25 },
  },
];

const initialEdges: Edge[] = [];

export const ChatbotBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeAdd = useCallback(
    (nodeType: string) => {
      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type: nodeType,
        data: { label: `${nodeType} Node` },
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
      };
      setNodes(nds => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  return (
    <div className="grid grid-cols-4 h-screen">
      <div className="border-r p-4 bg-gray-50">
        <NodePalette onNodeAdd={onNodeAdd} />
      </div>
      <div className="col-span-3">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
