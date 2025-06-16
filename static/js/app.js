// Main Application Controller
class App {
    constructor() {
        this.isInitialized = false;
        this.currentView = 'loading';
        this.propertiesManager = null;
        
        this.init();
    }

    async init() {
        // Check authentication status
        await window.auth.checkAuthStatus();
        
        // Initialize UI based on auth status
        if (window.auth.isAuthenticated) {
            await this.initApp();
        } else {
            this.showLanding();
        }
        
        this.hideLoading();
        this.isInitialized = true;
    }

    async initApp() {
        this.showApp();
        this.initUserInterface();
        this.initMindmap();
        this.initPropertiesManager();
        this.bindEvents();
        
        // Load user's mindmaps
        await this.loadMindmaps();
    }

    showLanding() {
        this.currentView = 'landing';
        document.getElementById('landing').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        
        // Bind landing page events
        const bindAuthButton = (id, authMethod) => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = authMethod;
        };

        // Google authentication buttons
        bindAuthButton('googleLoginBtn', () => window.auth.loginWithGoogle());
        bindAuthButton('getStartedGoogleBtn', () => window.auth.loginWithGoogle());
        bindAuthButton('startCreatingGoogleBtn', () => window.auth.loginWithGoogle());

        // Replit authentication buttons
        bindAuthButton('replitLoginBtn', () => window.auth.loginWithReplit());
        bindAuthButton('getStartedReplitBtn', () => window.auth.loginWithReplit());
        bindAuthButton('startCreatingReplitBtn', () => window.auth.loginWithReplit());
    }

    showApp() {
        this.currentView = 'app';
        document.getElementById('landing').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    initUserInterface() {
        // Update user info in header
        document.getElementById('userInitials').textContent = window.auth.getUserInitials();
        document.getElementById('userName').textContent = window.auth.getUserName();
        document.getElementById('userEmail').textContent = window.auth.getUserEmail();
        
        // User menu toggle
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        userMenuBtn.onclick = (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        };
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
        
        // Logout button
        document.getElementById('logoutBtn').onclick = () => window.auth.logout();
    }

    initMindmap() {
        // Initialize mindmap engine
        window.mindmap = new MindmapEngine('mindmapCanvas');
        
        // Create default mindmap if none exist
        const defaultData = {
            name: 'My First Mindmap',
            nodes: [
                {
                    id: 'node_' + Date.now(),
                    x: 400,
                    y: 300,
                    text: 'Main Idea',
                    color: '#2563EB',
                    shape: 'rounded-rectangle'
                }
            ],
            connections: [],
            canvas: {
                zoom: 1.0,
                panX: 0,
                panY: 0,
                background: '#ffffff'
            }
        };
        
        window.mindmap.setData(defaultData);
    }

    initPropertiesManager() {
        this.propertiesManager = new PropertiesManager();
        window.propertiesManager = this.propertiesManager;
    }

    bindEvents() {
        // Toolbar events
        this.bindToolbarEvents();
        
        // File operations
        this.bindFileEvents();
        
        // Canvas controls
        this.bindCanvasControls();
        
        // Properties sidebar
        this.bindPropertiesEvents();
        
        // Keyboard shortcuts
        this.bindKeyboardShortcuts();
    }

    bindToolbarEvents() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        
        toolButtons.forEach(btn => {
            btn.onclick = () => {
                const tool = btn.getAttribute('data-tool');
                this.selectTool(tool, btn);
            };
        });
    }

    selectTool(tool, button) {
        // Remove active class from all buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        if (button) {
            button.classList.add('active');
        }
        
        // Handle special tools
        switch (tool) {
            case 'zoomIn':
                window.mindmap.zoomIn();
                break;
            case 'zoomOut':
                window.mindmap.zoomOut();
                break;
            case 'fitToScreen':
                window.mindmap.fitToScreen();
                break;
            case 'colors':
            case 'shapes':
                // These are handled by the properties sidebar
                break;
            default:
                window.mindmap.setTool(tool);
                break;
        }
    }

    bindFileEvents() {
        // Save button
        document.getElementById('saveBtn').onclick = () => {
            this.saveCurrentMindmap();
        };
        
        // Download button
        document.getElementById('downloadBtn').onclick = () => {
            this.showDownloadModal();
        };
        
        // Upload button
        document.getElementById('uploadBtn').onclick = () => {
            document.getElementById('fileInput').click();
        };
        
        // File input change
        document.getElementById('fileInput').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadFile(file);
            }
        };
        
        // Download modal events
        this.bindDownloadModalEvents();
    }

    bindDownloadModalEvents() {
        const modal = document.getElementById('downloadModal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelDownload');
        const confirmBtn = document.getElementById('confirmDownload');
        
        closeBtn.onclick = () => this.hideDownloadModal();
        cancelBtn.onclick = () => this.hideDownloadModal();
        confirmBtn.onclick = () => this.downloadFile();
        
        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideDownloadModal();
            }
        };
    }

    bindCanvasControls() {
        document.getElementById('resetZoomBtn').onclick = () => {
            window.mindmap.resetZoom();
        };
    }

    bindPropertiesEvents() {
        // Close sidebar button
        document.getElementById('closeSidebarBtn').onclick = () => {
            document.getElementById('propertiesSidebar').classList.add('hidden');
        };
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentMindmap();
            }
            
            // Ctrl/Cmd + O: Open
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                document.getElementById('fileInput').click();
            }
            
            // Delete: Delete selected node
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (window.mindmap.selectedNode) {
                    e.preventDefault();
                    window.mindmap.deleteNode(window.mindmap.selectedNode.id);
                }
            }
            
            // Escape: Deselect
            if (e.key === 'Escape') {
                window.mindmap.selectNode(null);
                window.mindmap.connectionStart = null;
            }
            
            // Tool shortcuts
            if (e.key === 'v') window.mindmap.setTool('select');
            if (e.key === 'n') window.mindmap.setTool('addNode');
            if (e.key === 'c') window.mindmap.setTool('addConnection');
        });
    }

    async loadMindmaps() {
        const mindmaps = await window.dataManager.loadMindmaps();
        
        if (mindmaps.length === 0) {
            // Create default mindmap
            const defaultData = window.mindmap.getData();
            await window.dataManager.createMindmap('My First Mindmap', defaultData);
        } else {
            // Load first mindmap
            const firstMindmap = mindmaps[0];
            window.dataManager.currentMindmap = firstMindmap;
            window.mindmap.setData(firstMindmap.data);
            document.getElementById('documentTitle').value = firstMindmap.name;
        }
    }

    async saveCurrentMindmap() {
        if (window.dataManager.currentMindmap) {
            const data = window.mindmap.getData();
            const name = document.getElementById('documentTitle').value;
            
            await window.dataManager.updateMindmap(window.dataManager.currentMindmap.id, {
                name: name,
                data: data
            });
            
            this.showToast('Mindmap saved successfully', 'success');
        }
    }

    showDownloadModal() {
        document.getElementById('downloadModal').classList.remove('hidden');
        document.getElementById('fileName').focus();
    }

    hideDownloadModal() {
        document.getElementById('downloadModal').classList.add('hidden');
    }

    downloadFile() {
        const fileName = document.getElementById('fileName').value.trim();
        const format = document.getElementById('fileFormat').value;
        
        if (!fileName) {
            this.showToast('Please enter a file name', 'error');
            return;
        }
        
        const data = {
            name: document.getElementById('documentTitle').value,
            ...window.mindmap.getData()
        };
        
        const success = window.fileManager.downloadFile(data, fileName, format);
        
        if (success) {
            this.hideDownloadModal();
            this.showToast('File downloaded successfully', 'success');
        } else {
            this.showToast('Failed to download file', 'error');
        }
    }

    uploadFile(file) {
        window.fileManager.uploadFile(file, 
            (data) => {
                // Success callback
                window.mindmap.setData(data);
                document.getElementById('documentTitle').value = data.name || 'Untitled Mindmap';
                this.showToast('File uploaded successfully', 'success');
            },
            (error) => {
                // Error callback
                console.error('Upload error:', error);
                this.showToast('Failed to upload file: ' + error.message, 'error');
            }
        );
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Properties Manager - Handle the properties sidebar
class PropertiesManager {
    constructor() {
        this.currentNode = null;
        this.bindEvents();
    }

    bindEvents() {
        // Node text input
        document.getElementById('nodeText').oninput = (e) => {
            if (this.currentNode) {
                window.mindmap.updateNode(this.currentNode.id, { text: e.target.value });
            }
        };
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.onclick = () => {
                if (this.currentNode) {
                    const color = btn.getAttribute('data-color');
                    window.mindmap.updateNode(this.currentNode.id, { color });
                    this.updateColorSelection(btn);
                }
            };
        });
        
        // Shape selector
        document.getElementById('nodeShape').onchange = (e) => {
            if (this.currentNode) {
                window.mindmap.updateNode(this.currentNode.id, { shape: e.target.value });
            }
        };
        
        // Background buttons
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.onclick = () => {
                const bg = btn.getAttribute('data-bg');
                window.mindmap.data.canvas.background = bg;
                window.mindmap.render();
                this.updateBackgroundSelection(btn);
            };
        });
    }

    updateNodeProperties(node) {
        this.currentNode = node;
        const nodeProperties = document.getElementById('nodeProperties');
        
        if (node) {
            nodeProperties.classList.remove('hidden');
            document.getElementById('propertiesSidebar').classList.remove('hidden');
            
            // Update form values
            document.getElementById('nodeText').value = node.text;
            document.getElementById('nodeShape').value = node.shape;
            
            // Update color selection
            const colorBtn = document.querySelector(`[data-color="${node.color}"]`);
            if (colorBtn) {
                this.updateColorSelection(colorBtn);
            }
        } else {
            nodeProperties.classList.add('hidden');
        }
    }

    updateColorSelection(selectedBtn) {
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedBtn.classList.add('active');
    }

    updateBackgroundSelection(selectedBtn) {
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedBtn.classList.add('active');
    }
}

// Global toast function
window.showToast = function(message, type = 'info') {
    if (window.app) {
        window.app.showToast(message, type);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});