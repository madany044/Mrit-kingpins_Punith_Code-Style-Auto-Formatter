// assets/js/dashboard.js

import { auth, setStatus, checkAuthState } from './auth.js';

const API_BASE_URL = window.__API_BASE_URL ?? "http://localhost:5000";
const PREVIEW_SERVER_URL = "http://localhost:50000";

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.currentFile = null;
        this.fileSystem = new FileSystemManager();
        this.previewManager = new PreviewManager();
        this.suggestionManager = new SuggestionManager();
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.displayUserInfo();
        this.setupLogout();
        this.setupEventListeners();
        this.fileSystem.init();
        this.previewManager.init();
        this.suggestionManager.init();
        this.setupCodeEditorScroll();
    }

    async checkAuthentication() {
        try {
            const user = await checkAuthState();
            if (!user) {
                console.log('No user found, redirecting to login...');
                this.redirectToLogin();
                return;
            }
            this.currentUser = user;
            console.log('User authenticated:', user);
            
            const jwtToken = localStorage.getItem('kingpins.jwt');
            if (!jwtToken) {
                console.warn('JWT token missing, user might need to re-authenticate');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
        }
    }

    displayUserInfo() {
        const storedUser = localStorage.getItem('kingpins.user');
        let userData = null;
        if (storedUser) {
            try {
                userData = JSON.parse(storedUser);
            } catch (e) {
                console.error('Error parsing stored user data:', e);
            }
        }

        const profileMenu = document.querySelector('.profile-menu');
        if (!profileMenu) return;

        const avatar = profileMenu.querySelector('img');
        const userName = profileMenu.querySelector('.user-name');
        
        if (!userName) {
            const userNameElement = document.createElement('span');
            userNameElement.className = 'user-name';
            profileMenu.insertBefore(userNameElement, profileMenu.querySelector('.logout-btn'));
        }

        const userNameElement = profileMenu.querySelector('.user-name');
        
        if (userData) {
            if (userNameElement) {
                userNameElement.textContent = userData.displayName || userData.email || 'User';
            }
            if (avatar) {
                avatar.alt = `Profile picture of ${userData.displayName || userData.email}`;
            }
        } else if (this.currentUser) {
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.displayName || this.currentUser.email || 'User';
            }
            if (avatar) {
                avatar.alt = `Profile picture of ${this.currentUser.displayName || this.currentUser.email}`;
            }
        }
    }

    setupLogout() {
        const logoutBtn = document.querySelector('.logout-btn');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleLogout();
        });
    }

    async handleLogout() {
        try {
            setStatus('Logging out...', 'info');
            
            if (auth.currentUser) {
                await auth.signOut();
            }

            localStorage.removeItem('kingpins.jwt');
            localStorage.removeItem('kingpins.user');
            sessionStorage.clear();
            this.clearCookies();

            setStatus('Logged out successfully', 'success');
            
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            setStatus('Error during logout', 'error');
            setTimeout(() => {
                this.redirectToLogin();
            }, 2000);
        }
    }

    clearCookies() {
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }

    redirectToLogin() {
        window.location.href = './login.html';
    }

    setupEventListeners() {
        this.setupKeyboardShortcuts();
        this.setupConsoleTabs();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    setupConsoleTabs() {
        const consoleTabs = document.querySelectorAll('[data-console-tab]');
        const consolePanels = document.querySelectorAll('[data-console-panel]');

        consoleTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.consoleTab;
                
                // Update active tab
                consoleTabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding panel
                consolePanels.forEach((panel) => {
                    panel.hidden = panel.dataset.consolePanel !== target;
                });

                // Handle specific tab actions
                if (target === 'preview') {
                    this.previewManager.updatePreview();
                } else if (target === 'suggestion') {
                    this.suggestionManager.loadSuggestions();
                }
            });
        });
    }

    setupCodeEditorScroll() {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (userCodeBlock) {
            // Ensure the code editor container is properly constrained
            const editorContainer = userCodeBlock.closest('.editor');
            const monacoPlaceholder = userCodeBlock.closest('.monaco-placeholder');
            
            if (editorContainer) {
                editorContainer.style.overflow = 'hidden';
                editorContainer.style.display = 'flex';
                editorContainer.style.flexDirection = 'column';
                editorContainer.style.minHeight = '0';
            }
            
            if (monacoPlaceholder) {
                monacoPlaceholder.style.overflowY = 'auto';
                monacoPlaceholder.style.overflowX = 'auto';
                monacoPlaceholder.style.flex = '1';
                monacoPlaceholder.style.minHeight = '0';
            }
            
            // Ensure pre element doesn't overflow
            if (userCodeBlock) {
                userCodeBlock.style.maxWidth = '100%';
                userCodeBlock.style.boxSizing = 'border-box';
            }
        }
    }
}

class FileSystemManager {
    constructor() {
        this.files = new Map();
        this.currentProject = null;
    }

    init() {
        this.setupFileUpload();
        this.setupFolderUpload();
        this.setupFileCreation();
        this.setupRecentFiles();
        this.initializeEmptyWorkspace();
    }

    initializeEmptyWorkspace() {
        // Clear the default explorer content and show empty state
        const explorer = document.querySelector('.explorer .tree');
        if (explorer) {
            explorer.innerHTML = `
                <li role="treeitem" aria-expanded="true">workspace/</li>
                <li role="treeitem"> ┗ <span class="empty-folder">No files yet</span></li>
            `;
        }

        // Set empty code editor
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (userCodeBlock) {
            userCodeBlock.textContent = `// Welcome to FixBudz! 🚀\n// Upload a file or create a new one to get started.\n\n// Supported file types:\n// • HTML (.html)\n// • CSS (.css) \n// • JavaScript (.js)\n// • TypeScript (.ts)\n// • Python (.py)\n\n// Click on "File" in the sidebar to begin.`;
            userCodeBlock.dataset.filename = '';
        }

        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb-bar span');
        if (breadcrumb) {
            breadcrumb.textContent = `kingpins/workspaces/`;
        }
    }

    setupFileUpload() {
        const fileModal = document.getElementById('fileModal');
        const fileInput = fileModal?.querySelector('input[type="file"]');
        const openButton = fileModal?.querySelector('.primary-btn-dark');

        openButton?.addEventListener('click', () => {
            if (fileInput?.files.length > 0) {
                this.handleFileUpload(fileInput.files[0]);
                this.closeModal('fileModal');
            }
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
                this.closeModal('fileModal');
            }
        });
    }

    setupFolderUpload() {
        const folderModal = document.getElementById('folderModal');
        const loadButton = folderModal?.querySelector('.primary-btn-dark');

        loadButton?.addEventListener('click', () => {
            const folderInput = document.createElement('input');
            folderInput.type = 'file';
            folderInput.webkitdirectory = true;
            folderInput.multiple = true;
            
            folderInput.addEventListener('change', (e) => {
                this.handleFolderUpload(Array.from(e.target.files));
                this.closeModal('folderModal');
            });
            
            folderInput.click();
        });
    }

    setupFileCreation() {
        const createModal = document.getElementById('createModal');
        const createButton = createModal?.querySelector('.primary-btn-dark');
        const filenameInput = createModal?.querySelector('input[type="text"]');
        const languageSelect = createModal?.querySelector('select');

        createButton?.addEventListener('click', () => {
            const filename = filenameInput?.value.trim();
            const language = languageSelect?.value;
            
            if (filename) {
                this.createNewFile(filename, language);
                this.closeModal('createModal');
                if (filenameInput) filenameInput.value = '';
            } else {
                setStatus('Please enter a filename', 'error');
            }
        });
    }

    setupRecentFiles() {
        this.updateRecentFilesUI();
    }

    async handleFileUpload(file) {
        try {
            const content = await this.readFileContent(file);
            const fileInfo = {
                name: file.name,
                content: content,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            };
            
            this.files.set(file.name, fileInfo);
            this.addFileToExplorer(file.name);
            this.updateRecentFiles(file.name);
            this.loadFileContent(file.name, content);
            
            setStatus(`File "${file.name}" uploaded successfully`, 'success');
        } catch (error) {
            console.error('Error reading file:', error);
            setStatus('Error uploading file', 'error');
        }
    }

    async handleFolderUpload(files) {
        if (files.length === 0) return;
        
        for (let file of files) {
            await this.handleFileUpload(file);
        }

        setStatus(`Folder with ${files.length} files uploaded`, 'success');
    }

    createNewFile(filename, language = 'javascript') {
        const extension = this.getFileExtension(language);
        const fullFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;
        const template = this.getFileTemplate(language);
        
        const fileInfo = {
            name: fullFilename,
            content: template,
            type: this.getMimeType(language),
            size: template.length,
            lastModified: Date.now()
        };
        
        this.files.set(fullFilename, fileInfo);
        this.addFileToExplorer(fullFilename);
        this.updateRecentFiles(fullFilename);
        this.loadFileContent(fullFilename, template);
        
        setStatus(`File "${fullFilename}" created successfully`, 'success');
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    addFileToExplorer(filename) {
        const explorer = document.querySelector('.explorer .tree');
        if (!explorer) return;

        // Remove existing file if it exists
        this.removeFileFromExplorer(filename);

        const fileElement = document.createElement('li');
        fileElement.textContent = ` ┣ ${filename}`;
        fileElement.className = 'file-item';
        fileElement.setAttribute('data-filename', filename);
        fileElement.style.cursor = 'pointer';
        fileElement.style.padding = '0.35rem 0.5rem';
        fileElement.style.borderRadius = '6px';
        
        fileElement.addEventListener('click', () => {
            const fileInfo = this.files.get(filename);
            if (fileInfo) {
                this.loadFileContent(filename, fileInfo.content);
            }
        });

        fileElement.addEventListener('mouseenter', () => {
            fileElement.style.background = 'rgba(255, 255, 255, 0.05)';
        });

        fileElement.addEventListener('mouseleave', () => {
            fileElement.style.background = 'transparent';
        });

        // Find or create workspace directory
        let workspaceDir = Array.from(explorer.querySelectorAll('li')).find(li => 
            li.textContent.includes('workspace/')
        );
        
        if (!workspaceDir) {
            workspaceDir = document.createElement('li');
            workspaceDir.textContent = 'workspace/';
            workspaceDir.setAttribute('role', 'treeitem');
            workspaceDir.setAttribute('aria-expanded', 'true');
            
            const subList = document.createElement('ul');
            subList.className = 'tree';
            workspaceDir.appendChild(subList);
            
            // Clear existing content and add workspace
            explorer.innerHTML = '';
            explorer.appendChild(workspaceDir);
        }

        // Remove empty state if it exists
        const emptyFolder = explorer.querySelector('.empty-folder');
        if (emptyFolder) {
            emptyFolder.closest('li')?.remove();
        }

        const workspaceSubList = workspaceDir.querySelector('ul');
        if (workspaceSubList) {
            workspaceSubList.appendChild(fileElement);
        } else {
            // If no sublist, create one
            const subList = document.createElement('ul');
            subList.className = 'tree';
            subList.appendChild(fileElement);
            workspaceDir.appendChild(subList);
        }
    }

    removeFileFromExplorer(filename) {
        const existingFile = document.querySelector(`.file-item[data-filename="${filename}"]`);
        if (existingFile) {
            existingFile.remove();
        }
    }

    loadFileContent(filename, content) {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (userCodeBlock) {
            userCodeBlock.textContent = content;
            userCodeBlock.dataset.filename = filename;
            
            // Ensure proper scrolling and alignment
            const monacoPlaceholder = userCodeBlock.closest('.monaco-placeholder');
            if (monacoPlaceholder) {
                monacoPlaceholder.style.overflowY = 'auto';
                monacoPlaceholder.style.overflowX = 'auto';
            }
            
            // Ensure pre element doesn't overflow
            userCodeBlock.style.maxWidth = '100%';
            userCodeBlock.style.boxSizing = 'border-box';
            userCodeBlock.style.wordWrap = 'break-word';
            userCodeBlock.style.overflowWrap = 'break-word';
            
            // Update breadcrumb
            const breadcrumb = document.querySelector('.breadcrumb-bar span');
            if (breadcrumb) {
                breadcrumb.textContent = `kingpins/workspaces/${filename}`;
            }
            
            setStatus(`Loaded file: ${filename}`, 'info');
        }
    }

    updateRecentFiles(filename) {
        let recentFiles = JSON.parse(localStorage.getItem('kingpins.recentFiles') || '[]');
        recentFiles = recentFiles.filter(f => f !== filename);
        recentFiles.unshift(filename);
        recentFiles = recentFiles.slice(0, 10);
        localStorage.setItem('kingpins.recentFiles', JSON.stringify(recentFiles));
        this.updateRecentFilesUI();
    }

    updateRecentFilesUI() {
        const recentList = document.querySelector('#recentModal ul');
        if (!recentList) return;

        const recentFiles = JSON.parse(localStorage.getItem('kingpins.recentFiles') || '[]');
        
        if (recentFiles.length === 0) {
            recentList.innerHTML = '<li class="recent-file empty">No recent files</li>';
            return;
        }

        recentList.innerHTML = recentFiles.map(file => 
            `<li class="recent-file" data-filename="${file}">${file}</li>`
        ).join('');

        // Add click handlers to recent files
        recentList.querySelectorAll('.recent-file:not(.empty)').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.getAttribute('data-filename');
                const fileInfo = this.files.get(filename);
                if (fileInfo) {
                    this.loadFileContent(filename, fileInfo.content);
                    this.closeModal('recentModal');
                }
            });
        });
    }

    getFileExtension(language) {
        const extensions = {
            'JavaScript': '.js',
            'TypeScript': '.ts', 
            'Python': '.py',
            'HTML': '.html',
            'CSS': '.css'
        };
        return extensions[language] || '.txt';
    }

    getLanguageFromExtension(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languages = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'py': 'Python',
            'html': 'HTML',
            'css': 'CSS'
        };
        return languages[ext] || 'JavaScript';
    }

    getMimeType(language) {
        const mimeTypes = {
            'JavaScript': 'application/javascript',
            'TypeScript': 'application/typescript',
            'Python': 'text/x-python',
            'HTML': 'text/html',
            'CSS': 'text/css'
        };
        return mimeTypes[language] || 'text/plain';
    }

    getFileTemplate(language) {
        const templates = {
            'JavaScript': `// New JavaScript File
function welcome() {
    console.log('Welcome to FixBudz! 🚀');
    return 'Hello, World!';
}
welcome();`,
            'TypeScript': `// New TypeScript File
interface User {
    id: number;
    name: string;
}
export { User };`,
            'Python': `# New Python File
def main():
    print("Hello, World! 🐍")
if __name__ == "__main__":
    main()`,
            'HTML': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My FixBudz Project</title>
</head>
<body>
    <h1>🚀 Welcome to FixBudz</h1>
    <p>Start building your amazing web project!</p>
</body>
</html>`,
            'CSS': `/* New CSS File */
:root {
    --primary-color: #3498db;
}
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}`
        };
        return templates[language] || '// New File';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

class PreviewManager {
    constructor() {
        this.previewFrame = null;
        this.currentPreviewId = null;
    }

    init() {
        this.createPreviewFrame();
    }

    createPreviewFrame() {
        const consolePanel = document.querySelector('[data-console-panel="preview"]');
        if (!consolePanel) {
            console.error('Preview panel not found in DOM');
            return;
        }

        // Clear existing content
        consolePanel.innerHTML = '';
        
        this.previewFrame = document.createElement('iframe');
        this.previewFrame.style.width = '100%';
        this.previewFrame.style.height = '100%';
        this.previewFrame.style.border = 'none';
        this.previewFrame.style.background = 'white';
        this.previewFrame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        
        consolePanel.appendChild(this.previewFrame);
        console.log('Preview frame created successfully');
    }

    async updatePreview() {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (!userCodeBlock || !this.previewFrame) {
            console.warn('Preview: userCodeBlock or previewFrame not found');
            return;
        }

        const content = userCodeBlock.textContent;
        const filename = userCodeBlock.dataset.filename;
        
        console.log('Preview update requested:', { filename, contentLength: content.length });
        
        if (!filename || !content.trim()) {
            console.log('Preview: No filename or empty content, showing welcome');
            this.renderWelcomePreview();
            return;
        }

        try {
            // First check if preview server is available
            const healthCheck = await fetch(`${PREVIEW_SERVER_URL}/health`);
            if (!healthCheck.ok) {
                throw new Error('Preview server health check failed');
            }
            
            console.log('Preview server is available, sending code...');
            
            // Send code to preview server
            const response = await fetch(`${PREVIEW_SERVER_URL}/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: content,
                    filename: filename,
                    type: this.getFileType(filename),
                    preview_id: 'current'
                })
            });

            console.log('Preview server response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Preview data received:', data);
                this.currentPreviewId = data.preview_id;
                // Load preview in iframe
                const previewUrl = `${PREVIEW_SERVER_URL}/view?preview_id=${data.preview_id}`;
                console.log('Loading preview URL:', previewUrl);
                this.previewFrame.src = previewUrl;
                
                // Add error handler for iframe
                this.previewFrame.onerror = (error) => {
                    console.error('Preview iframe error:', error);
                    this.renderFallbackPreview(content, filename);
                };
                
                this.previewFrame.onload = () => {
                    console.log('Preview iframe loaded successfully');
                };
            } else {
                const errorText = await response.text();
                console.error('Preview server error:', response.status, errorText);
                // Fallback to blob URL if preview server is not available
                this.renderFallbackPreview(content, filename);
            }
        } catch (error) {
            console.error('Preview server error:', error);
            console.warn('Using fallback preview');
            this.renderFallbackPreview(content, filename);
        }
    }

    getFileType(filename) {
        if (filename.endsWith('.html')) return 'html';
        if (filename.endsWith('.css')) return 'css';
        return 'html';
    }

    renderWelcomePreview() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FixBudz Preview</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .welcome-container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            max-width: 500px;
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <h1>🚀 FixBudz</h1>
        <p>Upload a file or create a new one to see the preview here!</p>
    </div>
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;
        this.previewFrame.onload = () => URL.revokeObjectURL(url);
    }

    renderFallbackPreview(content, filename) {
        if (filename.endsWith('.html')) {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            this.previewFrame.src = url;
            this.previewFrame.onload = () => URL.revokeObjectURL(url);
        } else if (filename.endsWith('.css')) {
            const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CSS Preview</title>
    <style>${content}</style>
</head>
<body>
    <div class="preview-container">
        <h1>🎨 CSS Preview</h1>
        <button class="demo-button">Styled Button</button>
    </div>
</body>
</html>`;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            this.previewFrame.src = url;
            this.previewFrame.onload = () => URL.revokeObjectURL(url);
        }
    }
}

class SuggestionManager {
    constructor() {
        this.suggestions = [];
    }

    init() {
        this.setupSuggestionActions();
    }

    async loadSuggestions() {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (!userCodeBlock) return;

        const code = userCodeBlock.textContent;
        const filename = userCodeBlock.dataset.filename;
        
        if (!filename) {
            this.showWelcomeSuggestions();
            return;
        }
        
        if (!code.trim()) {
            this.showEmptyFileSuggestions();
            return;
        }

        try {
            setStatus('Analyzing code for suggestions...', 'info');
            
            const jwtToken = localStorage.getItem('kingpins.jwt');
            if (!jwtToken) {
                throw new Error('Not authenticated');
            }

            // Get language from filename
            const language = this.getLanguageFromFilename(filename);

            // Call backend API
            const response = await fetch(`${API_BASE_URL}/api/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({
                    code: code,
                    filename: filename,
                    language: language,
                    lintReport: []
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const suggestions = data.suggestions?.suggestions || [];
            
            if (suggestions.length === 0) {
                this.showNoSuggestions();
                setStatus('No suggestions found', 'info');
                return;
            }

            this.showSuggestions(suggestions);
            setStatus('Suggestions loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading suggestions:', error);
            setStatus('Error loading suggestions: ' + error.message, 'error');
            this.showErrorSuggestions(error.message);
        }
    }

    getLanguageFromFilename(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python'
        };
        return languageMap[ext] || 'javascript';
    }

    showWelcomeSuggestions() {
        const suggestionPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
        if (!suggestionPanel) return;
        suggestionPanel.innerHTML = `
            <div class="suggestion-item">
                <strong>👋 Welcome to FixBudz!</strong>
                <p>Upload a file or create a new one to get code suggestions.</p>
            </div>
        `;
    }

    showEmptyFileSuggestions() {
        const suggestionPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
        if (!suggestionPanel) return;
        suggestionPanel.innerHTML = `
            <div class="suggestion-item">
                <strong>📝 Start Coding</strong>
                <p>Add some code to this file to get intelligent suggestions.</p>
            </div>
        `;
    }

    showNoSuggestions() {
        const suggestionPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
        if (!suggestionPanel) return;
        suggestionPanel.innerHTML = `
            <div class="suggestion-item">
                <strong>✅ Great Code!</strong>
                <p>No suggestions found. Your code looks good!</p>
            </div>
        `;
    }

    showErrorSuggestions(errorMessage) {
        const suggestionPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
        if (!suggestionPanel) return;
        suggestionPanel.innerHTML = `
            <div class="suggestion-item">
                <strong>❌ Error</strong>
                <p>${errorMessage}</p>
            </div>
        `;
    }

    showSuggestions(suggestions) {
        const suggestionPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
        if (!suggestionPanel) return;

        suggestionPanel.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-rule="${suggestion.ruleId || 'rule'}">
                <strong>${suggestion.ruleId || 'suggestion'}</strong>
                <p>${suggestion.explanation || 'See details'}</p>
                <small>Confidence: ${(suggestion.confidence || 0).toFixed(2)}${suggestion.line ? ` • Line ${suggestion.line}` : ''}</small>
                ${suggestion.fix ? `<button class="apply-fix-btn" data-fix="${this.escapeHtml(suggestion.fix)}">Apply Fix</button>` : ''}
            </div>
        `).join('');

        // Add event listeners to apply fix buttons
        suggestionPanel.querySelectorAll('.apply-fix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fix = btn.getAttribute('data-fix');
                this.applyFix(fix);
            });
        });
    }

    applyFix(fix) {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (userCodeBlock && fix) {
            userCodeBlock.textContent = fix;
            setStatus('Fix applied successfully!', 'success');
        }
    }

    setupSuggestionActions() {
        document.querySelectorAll('[data-apply]').forEach(button => {
            button.addEventListener('click', () => {
                this.handleSuggestionAction(button.dataset.apply);
            });
        });
    }

    handleSuggestionAction(action) {
        switch (action) {
            case 'copy':
                this.copySuggestedCode();
                break;
            case 'apply':
                this.applySuggestion();
                break;
            case 'accept-all':
                this.acceptAllSuggestions();
                break;
            case 'reject-all':
                this.rejectAllSuggestions();
                break;
        }
    }

    copySuggestedCode() {
        const userCodeBlock = document.querySelector('[data-user-code]');
        if (userCodeBlock && userCodeBlock.textContent.trim()) {
            navigator.clipboard.writeText(userCodeBlock.textContent)
                .then(() => {
                    setStatus('Code copied to clipboard! 📋', 'success');
                })
                .catch(err => {
                    setStatus('Failed to copy code', 'error');
                });
        } else {
            setStatus('No code to copy', 'warning');
        }
    }

    applySuggestion() {
        setStatus('Suggestion applied successfully! ✅', 'success');
    }

    acceptAllSuggestions() {
        setStatus('All suggestions accepted! 🎉', 'success');
    }

    rejectAllSuggestions() {
        setStatus('Suggestions rejected', 'info');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.workspace')) {
        new DashboardManager();
        console.log('🚀 FixBudz Dashboard initialized');
    }
});

export default DashboardManager;

