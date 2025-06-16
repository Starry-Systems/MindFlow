import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  shape: string;
}

interface Connection {
  from: string;
  to: string;
  style: string;
}

interface MindmapCanvasProps {
  mindmapData: any;
  selectedTool: string;
  selectedNode: Node | null;
  onNodeSelect: (node: Node | null) => void;
  onDataChange: (data: any) => void;
}

export default function MindmapCanvas({
  mindmapData,
  selectedTool,
  selectedNode,
  onNodeSelect,
  onDataChange
}: MindmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState<Node | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    renderCanvas();
  }, [mindmapData, zoom, pan, selectedNode]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mindmapData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw connections first
    if (mindmapData.connections) {
      drawConnections(ctx, mindmapData.nodes, mindmapData.connections);
    }

    // Draw nodes
    if (mindmapData.nodes) {
      mindmapData.nodes.forEach((node: Node) => {
        drawNode(ctx, node, selectedNode?.id === node.id);
      });
    }

    ctx.restore();
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node, isSelected: boolean) => {
    const padding = 12;
    const minWidth = 80;
    
    // Measure text
    ctx.font = '14px Inter, sans-serif';
    const textWidth = Math.max(ctx.measureText(node.text).width + padding * 2, minWidth);
    const nodeHeight = 36;

    // Draw selection outline
    if (isSelected) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      drawShape(ctx, node, textWidth + 4, nodeHeight + 4, node.x - 2, node.y - 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw node background
    ctx.fillStyle = node.color;
    ctx.lineWidth = 1;
    drawShape(ctx, node, textWidth, nodeHeight, node.x, node.y);
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.text, node.x + textWidth / 2, node.y + nodeHeight / 2);
  };

  const drawShape = (
    ctx: CanvasRenderingContext2D, 
    node: Node, 
    width: number, 
    height: number, 
    x: number, 
    y: number
  ) => {
    const radius = 8;
    
    ctx.beginPath();
    switch (node.shape) {
      case 'circle':
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      case 'diamond':
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height / 2);
        ctx.lineTo(x + width / 2, y + height);
        ctx.lineTo(x, y + height / 2);
        ctx.closePath();
        break;
      case 'rectangle':
        ctx.rect(x, y, width, height);
        break;
      default: // rounded-rectangle
        ctx.roundRect(x, y, width, height, radius);
        break;
    }
  };

  const drawConnections = (ctx: CanvasRenderingContext2D, nodes: Node[], connections: Connection[]) => {
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;

    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + 40; // Center of node
      const fromY = fromNode.y + 18;
      const toX = toNode.x + 40;
      const toY = toNode.y + 18;

      ctx.beginPath();
      if (connection.style === 'curved') {
        const cpX = (fromX + toX) / 2;
        const cpY = Math.min(fromY, toY) - 50;
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(cpX, cpY, toX, toY);
      } else {
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
      }
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLength = 10;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowLength * Math.cos(angle - Math.PI / 6),
        toY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowLength * Math.cos(angle + Math.PI / 6),
        toY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  const getNodeAt = (x: number, y: number): Node | null => {
    if (!mindmapData?.nodes) return null;

    for (const node of mindmapData.nodes) {
      const nodeWidth = Math.max(80, node.text.length * 8 + 24);
      const nodeHeight = 36;
      
      if (x >= node.x && x <= node.x + nodeWidth &&
          y >= node.y && y <= node.y + nodeHeight) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedNode = getNodeAt(coords.x, coords.y);

    if (selectedTool === 'select') {
      if (clickedNode) {
        onNodeSelect(clickedNode);
        setDragNode(clickedNode);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        onNodeSelect(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    } else if (selectedTool === 'addNode' && !clickedNode) {
      const newNode: Node = {
        id: Date.now().toString(),
        x: coords.x,
        y: coords.y,
        text: 'New Node',
        color: '#2563EB',
        shape: 'rounded-rectangle'
      };

      const updatedData = {
        ...mindmapData,
        nodes: [...(mindmapData.nodes || []), newNode]
      };
      onDataChange(updatedData);
      onNodeSelect(newNode);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragNode) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const updatedNodes = mindmapData.nodes.map((node: Node) => 
        node.id === dragNode.id 
          ? { ...node, x: node.x + deltaX / zoom, y: node.y + deltaY / zoom }
          : node
      );

      onDataChange({
        ...mindmapData,
        nodes: updatedNodes
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNode(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  };

  const resetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 relative bg-white">
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden cursor-grab"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetZoom}
          className="bg-white shadow-lg border border-gray-200"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
