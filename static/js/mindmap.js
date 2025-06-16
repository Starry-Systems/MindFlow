// Mindmap Engine - Core functionality for canvas-based mindmapping
class MindmapEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.selectedTool = 'select';
        this.selectedNode = null;
        this.isDragging = false;
        this.isPanning = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragNode = null;
        this.connectionStart = null;
        
        // Mindmap data
        this.data = {
            nodes: [],
            connections: [],
            canvas: {
                zoom: 1.0,
                panX: 0,
                panY: 0,
                background: '#ffffff'
            }
        };
        
        this.setupCanvas();
        this.bindEvents();
        this.render();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Handle canvas resize
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render();
        });
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setTool(tool) {
        this.selectedTool = tool;
        this.canvas.style.cursor = this.getCursor();
    }

    getCursor() {
        switch (this.selectedTool) {
            case 'addNode': return 'crosshair';
            case 'addConnection': return 'crosshair';
            default: return this.isDragging || this.isPanning ? 'grabbing' : 'grab';
        }
    }

    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left - this.data.canvas.panX) / this.data.canvas.zoom;
        const y = (clientY - rect.top - this.data.canvas.panY) / this.data.canvas.zoom;
        return { x, y };
    }

    getNodeAt(x, y) {
        for (let i = this.data.nodes.length - 1; i >= 0; i--) {
            const node = this.data.nodes[i];
            const nodeWidth = this.getNodeWidth(node);
            const nodeHeight = this.getNodeHeight(node);
            
            if (x >= node.x && x <= node.x + nodeWidth &&
                y >= node.y && y <= node.y + nodeHeight) {
                return node;
            }
        }
        return null;
    }

    getNodeWidth(node) {
        this.ctx.font = '14px Inter, sans-serif';
        return Math.max(this.ctx.measureText(node.text).width + 24, 80);
    }

    getNodeHeight(node) {
        return 36;
    }

    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const clickedNode = this.getNodeAt(coords.x, coords.y);

        switch (this.selectedTool) {
            case 'select':
                if (clickedNode) {
                    this.selectNode(clickedNode);
                    this.dragNode = clickedNode;
                    this.dragStart = { x: e.clientX, y: e.clientY };
                } else {
                    this.selectNode(null);
                    this.isPanning = true;
                    this.dragStart = { x: e.clientX, y: e.clientY };
                }
                break;

            case 'addNode':
                if (!clickedNode) {
                    this.addNode(coords.x, coords.y);
                }
                break;

            case 'addConnection':
                if (clickedNode) {
                    if (!this.connectionStart) {
                        this.connectionStart = clickedNode;
                        this.showToast('Select the target node to connect to');
                    } else if (this.connectionStart !== clickedNode) {
                        this.addConnection(this.connectionStart.id, clickedNode.id);
                        this.connectionStart = null;
                        this.showToast('Connection created successfully');
                    }
                } else {
                    this.connectionStart = null;
                }
                break;
        }

        this.canvas.style.cursor = this.getCursor();
    }

    handleMouseMove(e) {
        if (this.dragNode && this.selectedTool === 'select') {
            const deltaX = (e.clientX - this.dragStart.x) / this.data.canvas.zoom;
            const deltaY = (e.clientY - this.dragStart.y) / this.data.canvas.zoom;
            
            this.dragNode.x += deltaX;
            this.dragNode.y += deltaY;
            
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.render();
            this.saveData();
        } else if (this.isPanning) {
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;
            
            this.data.canvas.panX += deltaX;
            this.data.canvas.panY += deltaY;
            
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.render();
        }
    }

    handleMouseUp(e) {
        this.dragNode = null;
        this.isPanning = false;
        this.canvas.style.cursor = this.getCursor();
    }

    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.data.canvas.zoom * zoomFactor));
        
        // Zoom towards mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleFactor = newZoom / this.data.canvas.zoom;
        this.data.canvas.panX = mouseX - (mouseX - this.data.canvas.panX) * scaleFactor;
        this.data.canvas.panY = mouseY - (mouseY - this.data.canvas.panY) * scaleFactor;
        this.data.canvas.zoom = newZoom;
        
        this.render();
        this.updateZoomIndicator();
    }

    handleDoubleClick(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const clickedNode = this.getNodeAt(coords.x, coords.y);
        
        if (clickedNode) {
            this.editNodeText(clickedNode);
        }
    }

    addNode(x, y, text = 'New Node') {
        const node = {
            id: 'node_' + Date.now(),
            x: x,
            y: y,
            text: text,
            color: '#2563EB',
            shape: 'rounded-rectangle'
        };
        
        this.data.nodes.push(node);
        this.selectNode(node);
        this.render();
        this.saveData();
        return node;
    }

    addConnection(fromId, toId) {
        // Check if connection already exists
        const exists = this.data.connections.some(conn => 
            (conn.from === fromId && conn.to === toId) ||
            (conn.from === toId && conn.to === fromId)
        );
        
        if (!exists) {
            const connection = {
                id: 'conn_' + Date.now(),
                from: fromId,
                to: toId,
                style: 'curved'
            };
            
            this.data.connections.push(connection);
            this.render();
            this.saveData();
            return connection;
        }
    }

    selectNode(node) {
        this.selectedNode = node;
        this.render();
        
        // Update properties sidebar
        if (window.propertiesManager) {
            window.propertiesManager.updateNodeProperties(node);
        }
    }

    updateNode(nodeId, updates) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (node) {
            Object.assign(node, updates);
            this.render();
            this.saveData();
        }
    }

    deleteNode(nodeId) {
        this.data.nodes = this.data.nodes.filter(n => n.id !== nodeId);
        this.data.connections = this.data.connections.filter(c => 
            c.from !== nodeId && c.to !== nodeId
        );
        this.selectedNode = null;
        this.render();
        this.saveData();
    }

    editNodeText(node) {
        const newText = prompt('Enter node text:', node.text);
        if (newText !== null && newText.trim() !== '') {
            this.updateNode(node.id, { text: newText.trim() });
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background
        this.ctx.fillStyle = this.data.canvas.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        
        // Apply zoom and pan
        this.ctx.translate(this.data.canvas.panX, this.data.canvas.panY);
        this.ctx.scale(this.data.canvas.zoom, this.data.canvas.zoom);
        
        // Draw connections first
        this.renderConnections();
        
        // Draw nodes
        this.renderNodes();
        
        this.ctx.restore();
    }

    renderNodes() {
        this.data.nodes.forEach(node => {
            this.renderNode(node, node === this.selectedNode);
        });
    }

    renderNode(node, isSelected) {
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

    drawNodeShape(node, width, height, x, y) {
        const cornerRadius = 8;
        
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
                // Manual rounded rectangle implementation for better browser compatibility
                this.ctx.moveTo(x + cornerRadius, y);
                this.ctx.lineTo(x + width - cornerRadius, y);
                this.ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
                this.ctx.lineTo(x + width, y + height - cornerRadius);
                this.ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
                this.ctx.lineTo(x + cornerRadius, y + height);
                this.ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
                this.ctx.lineTo(x, y + cornerRadius);
                this.ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
                this.ctx.closePath();
                break;
        }
    }

    renderConnections() {
        this.data.connections.forEach(connection => {
            this.renderConnection(connection);
        });
    }

    renderConnection(connection) {
        const fromNode = this.data.nodes.find(n => n.id === connection.from);
        const toNode = this.data.nodes.find(n => n.id === connection.to);
        
        if (!fromNode || !toNode) return;
        
        const fromX = fromNode.x + this.getNodeWidth(fromNode) / 2;
        const fromY = fromNode.y + this.getNodeHeight(fromNode) / 2;
        const toX = toNode.x + this.getNodeWidth(toNode) / 2;
        const toY = toNode.y + this.getNodeHeight(toNode) / 2;
        
        this.ctx.strokeStyle = '#64748B';
        this.ctx.lineWidth = 2;
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

    drawArrowhead(fromX, fromY, toX, toY) {
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

    setZoom(zoom) {
        this.data.canvas.zoom = Math.max(0.1, Math.min(3, zoom));
        this.render();
        this.updateZoomIndicator();
    }

    zoomIn() {
        this.setZoom(this.data.canvas.zoom * 1.2);
    }

    zoomOut() {
        this.setZoom(this.data.canvas.zoom * 0.8);
    }

    resetZoom() {
        this.data.canvas.zoom = 1.0;
        this.data.canvas.panX = 0;
        this.data.canvas.panY = 0;
        this.render();
        this.updateZoomIndicator();
    }

    fitToScreen() {
        if (this.data.nodes.length === 0) return;
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.data.nodes.forEach(node => {
            const width = this.getNodeWidth(node);
            const height = this.getNodeHeight(node);
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + width);
            maxY = Math.max(maxY, node.y + height);
        });
        
        const contentWidth = maxX - minX + 100;
        const contentHeight = maxY - minY + 100;
        const scaleX = this.canvas.width / contentWidth;
        const scaleY = this.canvas.height / contentHeight;
        
        this.data.canvas.zoom = Math.min(scaleX, scaleY, 1);
        this.data.canvas.panX = (this.canvas.width - contentWidth * this.data.canvas.zoom) / 2 - minX * this.data.canvas.zoom + 50 * this.data.canvas.zoom;
        this.data.canvas.panY = (this.canvas.height - contentHeight * this.data.canvas.zoom) / 2 - minY * this.data.canvas.zoom + 50 * this.data.canvas.zoom;
        
        this.render();
        this.updateZoomIndicator();
    }

    updateZoomIndicator() {
        const indicator = document.querySelector('.zoom-indicator');
        if (indicator) {
            indicator.textContent = Math.round(this.data.canvas.zoom * 100) + '%';
        }
    }

    setData(data) {
        this.data = data;
        this.selectedNode = null;
        this.render();
        this.updateZoomIndicator();
    }

    getData() {
        return this.data;
    }

    saveData() {
        // Auto-save functionality - will be connected to backend
        if (window.dataManager) {
            window.dataManager.saveCurrentMindmap(this.data);
        }
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// Global mindmap instance
window.mindmap = null;