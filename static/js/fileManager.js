// File Manager - Handle import/export of mindmap files
class FileManager {
    constructor() {
        this.supportedFormats = ['xml', 'json', 'mindmap'];
    }

    downloadFile(data, filename, format) {
        try {
            let content, mimeType, extension;
            
            switch (format) {
                case 'xml':
                    content = this.toXML(data);
                    mimeType = 'application/xml';
                    extension = 'xml';
                    break;
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                case 'mindmap':
                    content = this.toCustomFormat(data);
                    mimeType = 'application/octet-stream';
                    extension = 'mindmap';
                    break;
                default:
                    throw new Error('Unsupported format');
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }

    uploadFile(file, onSuccess, onError) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const format = this.getFileFormat(file.name);
                const data = this.parseDocument(content, format);
                
                if (onSuccess) {
                    onSuccess(data);
                }
            } catch (error) {
                console.error('Upload failed:', error);
                if (onError) {
                    onError(error);
                }
            }
        };
        
        reader.onerror = () => {
            const error = new Error('Failed to read file');
            if (onError) {
                onError(error);
            }
        };
        
        reader.readAsText(file);
    }

    toXML(data) {
        const escapeXml = (str) => {
            return str.replace(/[<>&'"]/g, (char) => {
                switch (char) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case "'": return '&apos;';
                    case '"': return '&quot;';
                    default: return char;
                }
            });
        };

        const name = data.name || 'Untitled Mindmap';
        const canvas = data.canvas || { zoom: 1, panX: 0, panY: 0, background: '#ffffff' };
        const nodes = data.nodes || [];
        const connections = data.connections || [];

        return `<?xml version="1.0" encoding="UTF-8"?>
<mindmap name="${escapeXml(name)}">
  <canvas zoom="${canvas.zoom}" panX="${canvas.panX}" panY="${canvas.panY}" background="${canvas.background}" />
  <nodes>
${nodes.map(node => 
    `    <node id="${node.id}" x="${node.x}" y="${node.y}" text="${escapeXml(node.text)}" color="${node.color}" shape="${node.shape}" />`
).join('\n')}
  </nodes>
  <connections>
${connections.map(conn => 
    `    <connection from="${conn.from}" to="${conn.to}" style="${conn.style || 'curved'}" />`
).join('\n')}
  </connections>
</mindmap>`;
    }

    fromXML(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');
        
        if (doc.documentElement.nodeName === 'parsererror') {
            throw new Error('Invalid XML format');
        }

        const mindmapElement = doc.documentElement;
        const canvasElement = mindmapElement.querySelector('canvas');
        
        return {
            name: mindmapElement.getAttribute('name') || 'Untitled',
            canvas: {
                zoom: parseFloat(canvasElement?.getAttribute('zoom') || '1'),
                panX: parseFloat(canvasElement?.getAttribute('panX') || '0'),
                panY: parseFloat(canvasElement?.getAttribute('panY') || '0'),
                background: canvasElement?.getAttribute('background') || '#ffffff'
            },
            nodes: Array.from(mindmapElement.querySelectorAll('node')).map(node => ({
                id: node.getAttribute('id') || '',
                x: parseFloat(node.getAttribute('x') || '0'),
                y: parseFloat(node.getAttribute('y') || '0'),
                text: node.getAttribute('text') || '',
                color: node.getAttribute('color') || '#2563EB',
                shape: node.getAttribute('shape') || 'rounded-rectangle'
            })),
            connections: Array.from(mindmapElement.querySelectorAll('connection')).map(conn => ({
                id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                from: conn.getAttribute('from') || '',
                to: conn.getAttribute('to') || '',
                style: conn.getAttribute('style') || 'curved'
            }))
        };
    }

    toCustomFormat(data) {
        // Custom compressed format
        const compressed = {
            v: '1.0', // version
            n: data.name || 'Untitled Mindmap',
            c: data.canvas || { zoom: 1, panX: 0, panY: 0, background: '#ffffff' },
            nodes: (data.nodes || []).map(n => [n.id, n.x, n.y, n.text, n.color, n.shape]),
            conns: (data.connections || []).map(c => [c.from, c.to, c.style || 'curved'])
        };
        return JSON.stringify(compressed);
    }

    fromCustomFormat(content) {
        const compressed = JSON.parse(content);
        
        return {
            name: compressed.n,
            canvas: compressed.c,
            nodes: compressed.nodes.map((n, index) => ({
                id: n[0] || `node_${Date.now()}_${index}`,
                x: n[1] || 0,
                y: n[2] || 0,
                text: n[3] || 'Node',
                color: n[4] || '#2563EB',
                shape: n[5] || 'rounded-rectangle'
            })),
            connections: compressed.conns.map((c, index) => ({
                id: `conn_${Date.now()}_${index}`,
                from: c[0],
                to: c[1],
                style: c[2] || 'curved'
            }))
        };
    }

    parseDocument(content, format) {
        switch (format) {
            case 'xml':
                return this.fromXML(content);
            case 'json':
                const jsonData = JSON.parse(content);
                // Ensure the data has the correct structure
                return {
                    name: jsonData.name || 'Untitled Mindmap',
                    canvas: jsonData.canvas || { zoom: 1, panX: 0, panY: 0, background: '#ffffff' },
                    nodes: jsonData.nodes || [],
                    connections: jsonData.connections || []
                };
            case 'mindmap':
                return this.fromCustomFormat(content);
            default:
                throw new Error('Unsupported file format');
        }
    }

    getFileFormat(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        return this.supportedFormats.includes(extension) ? extension : 'json';
    }

    validateMindmapData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid mindmap data structure');
        }

        // Ensure required properties exist
        if (!data.nodes) data.nodes = [];
        if (!data.connections) data.connections = [];
        if (!data.canvas) {
            data.canvas = { zoom: 1, panX: 0, panY: 0, background: '#ffffff' };
        }

        // Validate nodes
        data.nodes.forEach((node, index) => {
            if (!node.id) node.id = `node_${Date.now()}_${index}`;
            if (typeof node.x !== 'number') node.x = 0;
            if (typeof node.y !== 'number') node.y = 0;
            if (!node.text) node.text = 'Node';
            if (!node.color) node.color = '#2563EB';
            if (!node.shape) node.shape = 'rounded-rectangle';
        });

        // Validate connections
        data.connections.forEach((conn, index) => {
            if (!conn.id) conn.id = `conn_${Date.now()}_${index}`;
            if (!conn.style) conn.style = 'curved';
        });

        return data;
    }
}

// Data Manager - Handle backend communication
class DataManager {
    constructor() {
        this.currentMindmap = null;
        this.mindmaps = [];
        this.autoSaveInterval = null;
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async loadMindmaps() {
        try {
            const response = await fetch('/api/mindmaps');
            if (response.ok) {
                this.mindmaps = await response.json();
                return this.mindmaps;
            } else if (response.status === 401) {
                // User not authenticated
                window.location.href = '/api/login';
                return [];
            }
        } catch (error) {
            console.error('Failed to load mindmaps:', error);
            this.showToast('Failed to load mindmaps', 'error');
        }
        return [];
    }

    async createMindmap(name, data) {
        try {
            const response = await fetch('/api/mindmaps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, data })
            });

            if (response.ok) {
                const mindmap = await response.json();
                this.mindmaps.push(mindmap);
                this.currentMindmap = mindmap;
                this.showToast('Mindmap created successfully', 'success');
                return mindmap;
            } else if (response.status === 401) {
                window.location.href = '/api/login';
            } else {
                throw new Error('Failed to create mindmap');
            }
        } catch (error) {
            console.error('Failed to create mindmap:', error);
            this.showToast('Failed to create mindmap', 'error');
        }
        return null;
    }

    async updateMindmap(id, updates) {
        try {
            const response = await fetch(`/api/mindmaps/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedMindmap = await response.json();
                const index = this.mindmaps.findIndex(m => m.id === id);
                if (index !== -1) {
                    this.mindmaps[index] = updatedMindmap;
                }
                if (this.currentMindmap && this.currentMindmap.id === id) {
                    this.currentMindmap = updatedMindmap;
                }
                return updatedMindmap;
            } else if (response.status === 401) {
                window.location.href = '/api/login';
            } else {
                throw new Error('Failed to update mindmap');
            }
        } catch (error) {
            console.error('Failed to update mindmap:', error);
            this.showToast('Failed to save changes', 'error');
        }
        return null;
    }

    async deleteMindmap(id) {
        try {
            const response = await fetch(`/api/mindmaps/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.mindmaps = this.mindmaps.filter(m => m.id !== id);
                if (this.currentMindmap && this.currentMindmap.id === id) {
                    this.currentMindmap = null;
                }
                this.showToast('Mindmap deleted successfully', 'success');
                return true;
            } else if (response.status === 401) {
                window.location.href = '/api/login';
            } else {
                throw new Error('Failed to delete mindmap');
            }
        } catch (error) {
            console.error('Failed to delete mindmap:', error);
            this.showToast('Failed to delete mindmap', 'error');
        }
        return false;
    }

    saveCurrentMindmap(data) {
        if (this.currentMindmap && this.isOnline) {
            // Debounced auto-save
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                this.updateMindmap(this.currentMindmap.id, { data });
            }, 1000);
        }
    }

    syncData() {
        // Sync any offline changes when coming back online
        if (this.isOnline && this.currentMindmap) {
            // Force save current state
            if (window.mindmap) {
                this.updateMindmap(this.currentMindmap.id, { 
                    data: window.mindmap.getData() 
                });
            }
        }
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// Global instances
window.fileManager = new FileManager();
window.dataManager = new DataManager();