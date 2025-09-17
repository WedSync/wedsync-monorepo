'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Play, 
  Settings, 
  Trash2, 
  Edit3,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Calendar,
  CheckSquare,
  Zap
} from 'lucide-react';

// Journey node types
type NodeType = 'trigger' | 'email' | 'sms' | 'delay' | 'condition' | 'task' | 'meeting';

interface JourneyNode {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  connections: string[];
}

interface JourneyCanvasProps {
  journeyId?: string;
  onSave?: (nodes: JourneyNode[]) => void;
  readonly?: boolean;
}

const NODE_TYPES: Record<NodeType, { icon: any; label: string; color: string }> = {
  trigger: { icon: Zap, label: 'Trigger', color: 'bg-green-500' },
  email: { icon: Mail, label: 'Email', color: 'bg-blue-500' },
  sms: { icon: Phone, label: 'SMS', color: 'bg-purple-500' },
  delay: { icon: Clock, label: 'Delay', color: 'bg-orange-500' },
  condition: { icon: CheckSquare, label: 'Condition', color: 'bg-yellow-500' },
  task: { icon: CheckSquare, label: 'Task', color: 'bg-red-500' },
  meeting: { icon: Calendar, label: 'Meeting', color: 'bg-indigo-500' }
};

export default function JourneyCanvas({ journeyId, onSave, readonly = false }: JourneyCanvasProps) {
  const [nodes, setNodes] = useState<JourneyNode[]>([
    {
      id: 'start-trigger',
      type: 'trigger',
      title: 'Wedding Inquiry',
      description: 'When a couple submits an inquiry form',
      position: { x: 100, y: 100 },
      data: { triggerType: 'form_submission' },
      connections: []
    }
  ]);
  
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback((type: NodeType, position: { x: number; y: number }) => {
    const newNode: JourneyNode = {
      id: `node-${Date.now()}`,
      type,
      title: NODE_TYPES[type].label,
      position,
      data: {},
      connections: []
    };
    
    setNodes(prev => [...prev, newNode]);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<JourneyNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readonly) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(nodeId);
  }, [nodes, readonly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - canvasRect.left - dragOffset.x,
      y: e.clientY - canvasRect.top - dragOffset.y
    };

    updateNode(isDragging, { position: newPosition });
  }, [isDragging, dragOffset, updateNode]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
    }
  }, []);

  const renderNode = (node: JourneyNode) => {
    const NodeIcon = NODE_TYPES[node.type].icon;
    const isSelected = selectedNode?.id === node.id;
    
    return (
      <div
        key={node.id}
        className={`absolute cursor-move transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
        }`}
        style={{
          left: node.position.x,
          top: node.position.y,
          zIndex: isDragging === node.id ? 1000 : 1
        }}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(node);
        }}
      >
        <Card className="w-48 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${NODE_TYPES[node.type].color}`}>
                  <NodeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium truncate">{node.title}</span>
              </div>
              {!readonly && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          {node.description && (
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 truncate">{node.description}</p>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  const renderConnections = () => {
    return nodes.map(node => 
      node.connections.map(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return null;

        const startX = node.position.x + 192; // Card width
        const startY = node.position.y + 40; // Card center
        const endX = targetNode.position.x;
        const endY = targetNode.position.y + 40;

        return (
          <svg
            key={`${node.id}-${targetId}`}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
            <path
              d={`M ${startX} ${startY} Q ${startX + 50} ${startY} ${endX} ${endY}`}
              stroke="#6b7280"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        );
      })
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Journey Builder</h2>
          {!readonly && (
            <div className="flex items-center gap-2">
              {Object.entries(NODE_TYPES).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => addNode(type as NodeType, { x: 200, y: 200 })}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readonly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave?.(nodes)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm">
                <Play className="w-4 h-4 mr-1" />
                Activate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Connections */}
          {renderConnections()}
          
          {/* Nodes */}
          {nodes.map(renderNode)}
        </div>
      </div>

      {/* Node Properties Panel */}
      {selectedNode && !readonly && (
        <div className="w-80 border-l bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Node Properties</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="node-title">Title</Label>
              <Input
                id="node-title"
                value={selectedNode.title}
                onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="node-description">Description</Label>
              <Input
                id="node-description"
                value={selectedNode.description || ''}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                placeholder="Optional description..."
              />
            </div>

            {selectedNode.type === 'email' && (
              <div>
                <Label htmlFor="email-template">Email Template</Label>
                <Input
                  id="email-template"
                  value={selectedNode.data.template || ''}
                  onChange={(e) => updateNode(selectedNode.id, { 
                    data: { ...selectedNode.data, template: e.target.value }
                  })}
                  placeholder="Select email template..."
                />
              </div>
            )}

            {selectedNode.type === 'delay' && (
              <div>
                <Label htmlFor="delay-duration">Delay Duration</Label>
                <Input
                  id="delay-duration"
                  type="number"
                  value={selectedNode.data.duration || ''}
                  onChange={(e) => updateNode(selectedNode.id, { 
                    data: { ...selectedNode.data, duration: e.target.value }
                  })}
                  placeholder="Hours to wait..."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}