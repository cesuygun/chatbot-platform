export interface ChatbotNode {
  id: string;
  type: 'input' | 'output' | 'message' | 'condition' | 'api';
  data: {
    label: string;
    message?: string;
    condition?: string;
    apiEndpoint?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface NodePaletteProps {
  onNodeAdd: (nodeType: string) => void;
}

export interface NodeData {
  label: string;
  message?: string;
  condition?: string;
  apiEndpoint?: string;
}
