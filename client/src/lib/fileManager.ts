// File import/export functionality for mindmaps

export interface MindmapFileData {
  name: string;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    shape: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    style: string;
  }>;
  canvas: {
    zoom: number;
    panX: number;
    panY: number;
    background: string;
  };
}

export class FileManager {
  static downloadFile(data: MindmapFileData, filename: string, format: string) {
    let content: string;
    let mimeType: string;
    let extension: string;

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
  }

  static uploadFile(file: File, onSuccess: (data: MindmapFileData) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const format = this.getFileFormat(file.name);
        const data = this.parseDocument(content, format);
        onSuccess(data);
      } catch (error) {
        throw new Error(`Error parsing file: ${error}`);
      }
    };
    reader.readAsText(file);
  }

  private static toXML(data: MindmapFileData): string {
    const escapeXml = (str: string) => {
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

    return `<?xml version="1.0" encoding="UTF-8"?>
<mindmap name="${escapeXml(data.name)}">
  <canvas zoom="${data.canvas.zoom}" panX="${data.canvas.panX}" panY="${data.canvas.panY}" background="${data.canvas.background}" />
  <nodes>
${data.nodes.map(node => 
    `    <node id="${node.id}" x="${node.x}" y="${node.y}" text="${escapeXml(node.text)}" color="${node.color}" shape="${node.shape}" />`
  ).join('\n')}
  </nodes>
  <connections>
${data.connections.map(conn => 
    `    <connection from="${conn.from}" to="${conn.to}" style="${conn.style}" />`
  ).join('\n')}
  </connections>
</mindmap>`;
  }

  private static fromXML(xmlString: string): MindmapFileData {
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
        from: conn.getAttribute('from') || '',
        to: conn.getAttribute('to') || '',
        style: conn.getAttribute('style') || 'curved'
      }))
    };
  }

  private static toCustomFormat(data: MindmapFileData): string {
    // Custom binary-like format (actually JSON with compression simulation)
    const compressed = {
      v: '1.0', // version
      n: data.name,
      c: data.canvas,
      nodes: data.nodes.map(n => [n.id, n.x, n.y, n.text, n.color, n.shape]),
      conns: data.connections.map(c => [c.from, c.to, c.style])
    };
    return JSON.stringify(compressed);
  }

  private static fromCustomFormat(content: string): MindmapFileData {
    const compressed = JSON.parse(content);
    
    return {
      name: compressed.n,
      canvas: compressed.c,
      nodes: compressed.nodes.map((n: any[]) => ({
        id: n[0],
        x: n[1],
        y: n[2],
        text: n[3],
        color: n[4],
        shape: n[5]
      })),
      connections: compressed.conns.map((c: any[]) => ({
        from: c[0],
        to: c[1],
        style: c[2]
      }))
    };
  }

  private static parseDocument(content: string, format: string): MindmapFileData {
    switch (format) {
      case 'xml':
        return this.fromXML(content);
      case 'json':
        return JSON.parse(content);
      case 'mindmap':
        return this.fromCustomFormat(content);
      default:
        throw new Error('Unsupported file format');
    }
  }

  private static getFileFormat(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}
