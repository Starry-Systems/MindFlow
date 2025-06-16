// Core mindmap engine for handling canvas operations, node management, and interactions

export interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  shape: 'rectangle' | 'rounded-rectangle' | 'circle' | 'diamond';
  width?: number;
  height?: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  style: 'curved' | 'straight' | 'stepped';
  thickness: number;
}

export interface MindmapData {
  nodes: Node[];
  connections: Connection[];
  canvas: {
    zoom: number;
    panX: number;
    panY: number;
    background: string;
  };
}

export class MindmapEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: MindmapData;
  private selectedNode: Node | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.data = {
      nodes: [],
      connections: [],
      canvas: { zoom: 1, panX: 0, panY: 0, background: '#ffffff' }
    };
    this.setupCanvas();
  }

  private setupCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  setData(data: MindmapData) {
    this.data = data;
    this.render();
  }

  getData(): MindmapData {
    return this.data;
  }

  addNode(x: number, y: number, text = 'New Node'): Node {
    const node: Node = {
      id: `node_${Date.now()}`,
      x,
      y,
      text,
      color: '#2563EB',
      shape: 'rounded-rectangle'
    };

    this.data.nodes.push(node);
    this.render();
    return node;
  }

  updateNode(nodeId: string, updates: Partial<Node>) {
    const nodeIndex = this.data.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      this.data.nodes[nodeIndex] = { ...this.data.nodes[nodeIndex], ...updates };
      this.render();
    }
  }

  deleteNode(nodeId: string) {
    this.data.nodes = this.data.nodes.filter(n => n.id !== nodeId);
    this.data.connections = this.data.connections.filter(
      c => c.from !== nodeId && c.to !== nodeId
    );
    this.render();
  }

  addConnection(fromId: string, toId: string): Connection {
    const connection: Connection = {
      id: `conn_${Date.now()}`,
      from: fromId,
      to: toId,
      style: 'curved',
      thickness: 2
    };

    this.data.connections.push(connection);
    this.render();
    return connection;
  }

  getNodeAt(x: number, y: number): Node | null {
    // Transform coordinates based on zoom and pan
    const transformedX = (x - this.data.canvas.panX) / this.data.canvas.zoom;
    const transformedY = (y - this.data.canvas.panY) / this.data.canvas.zoom;

    for (const node of this.data.nodes) {
      const nodeWidth = this.getNodeWidth(node);
      const nodeHeight = this.getNodeHeight(node);

      if (transformedX >= node.x && transformedX <= node.x + nodeWidth &&
          transformedY >= node.y && transformedY <= node.y + nodeHeight) {
        return node;
      }
    }
    return null;
  }

  private getNodeWidth(node: Node): number {
    this.ctx.font = '14px Inter, sans-serif';
    return Math.max(this.ctx.measureText(node.text).width + 24, 80);
  }

  private getNodeHeight(node: Node): number {
    return 36;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set background
    this.ctx.fillStyle = this.data.canvas.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Apply zoom and pan
    this.ctx.translate(this.data.canvas.panX, this.data.canvas.panY);
    this.ctx.scale(this.data.canvas.zoom, this.data.canvas.zoom);

    // Draw connections first (behind nodes)
    this.renderConnections();

    // Draw nodes
    this.renderNodes();

    this.ctx.restore();
  }

  private renderNodes() {
    this.data.nodes.forEach(node => {
      this.renderNode(node, node === this.selectedNode);
    });
  }

  private renderNode(node: Node, isSelected: boolean) {
    const width = this.getNodeWidth(node);
    const height = this.getNodeHeight(node);

    // Draw selection outline
    if (isSelected) {
      this.ctx.strokeStyle = '#3B82F6';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.drawNodeShape(node, width + 4, height + 4, node.x - 2, node.y - 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw node background
    this.ctx.fillStyle = node.color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#ffffff';
    this.drawNodeShape(node, width, height, node.x, node.y);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.text, node.x + width / 2, node.y + height / 2);
  }

  private drawNodeShape(node: Node, width: number, height: number, x: number, y: number) {
    this.ctx.beginPath();

    switch (node.shape) {
      case 'circle':
        const radius = Math.min(width, height) / 2;
        this.ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
        break;
      case 'diamond':
        this.ctx.moveTo(x + width / 2, y);
        this.ctx.lineTo(x + width, y + height / 2);
        this.ctx.lineTo(x + width / 2, y + height);
        this.ctx.lineTo(x, y + height / 2);
        this.ctx.closePath();
        break;
      case 'rectangle':
        this.ctx.rect(x, y, width, height);
        break;
      default: // rounded-rectangle
        this.ctx.roundRect(x, y, width, height, 8);
        break;
    }
  }

  private renderConnections() {
    this.data.connections.forEach(connection => {
      this.renderConnection(connection);
    });
  }

  private renderConnection(connection: Connection) {
    const fromNode = this.data.nodes.find(n => n.id === connection.from);
    const toNode = this.data.nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return;

    const fromX = fromNode.x + this.getNodeWidth(fromNode) / 2;
    const fromY = fromNode.y + this.getNodeHeight(fromNode) / 2;
    const toX = toNode.x + this.getNodeWidth(toNode) / 2;
    const toY = toNode.y + this.getNodeHeight(toNode) / 2;

    this.ctx.strokeStyle = '#64748B';
    this.ctx.lineWidth = connection.thickness;
    this.ctx.setLineDash([]);

    this.ctx.beginPath();

    if (connection.style === 'curved') {
      const controlX = (fromX + toX) / 2;
      const controlY = Math.min(fromY, toY) - 50;
      this.ctx.moveTo(fromX, fromY);
      this.ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    } else if (connection.style === 'stepped') {
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(fromX, (fromY + toY) / 2);
      this.ctx.lineTo(toX, (fromY + toY) / 2);
      this.ctx.lineTo(toX, toY);
    } else {
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
    }

    this.ctx.stroke();

    // Draw arrowhead
    this.drawArrowhead(fromX, fromY, toX, toY);
  }

  private drawArrowhead(fromX: number, fromY: number, toX: number, toY: number) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  setZoom(zoom: number) {
    this.data.canvas.zoom = Math.max(0.1, Math.min(3, zoom));
    this.render();
  }

  setPan(x: number, y: number) {
    this.data.canvas.panX = x;
    this.data.canvas.panY = y;
    this.render();
  }

  selectNode(node: Node | null) {
    this.selectedNode = node;
    this.render();
  }

  getSelectedNode(): Node | null {
    return this.selectedNode;
  }
}