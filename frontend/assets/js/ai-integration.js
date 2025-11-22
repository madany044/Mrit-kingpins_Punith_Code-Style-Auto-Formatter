// static/js/ai-integration.js

class AISuggestionService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
    }

    async getAISuggestions(code, language, lintIssues) {
        try {
            const response = await fetch(`${this.baseURL}/ai-suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    issues: lintIssues
                })
            });

            const data = await response.json();
            
            if (data.success) {
                return this.processAISuggestions(data.suggestions);
            } else {
                throw new Error(data.error || 'Failed to get AI suggestions');
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            throw error;
        }
    }

    processAISuggestions(suggestions) {
        // Process and format AI suggestions for display
        if (suggestions.corrected_code) {
            return {
                type: 'code_correction',
                correctedCode: suggestions.corrected_code,
                explanations: suggestions.explanations || [],
                additionalSuggestions: suggestions.additional_suggestions || []
            };
        } else if (suggestions.raw_response) {
            return {
                type: 'text_suggestions',
                content: suggestions.raw_response
            };
        }
        
        return suggestions;
    }

    // Method to apply AI suggestions to the editor
    applyAICorrection(editor, correctedCode) {
        if (editor && correctedCode) {
            editor.setValue(correctedCode);
        }
    }
}

// Integrate with existing Linter class
class EnhancedLinter extends Linter {
    constructor() {
        super();
        this.aiService = new AISuggestionService();
        this.aiSuggestions = [];
    }

    async analyzeWithAI() {
        const code = this.editor.getValue();
        const language = this.getCurrentLanguage();
        const lintResults = this.runLinter(code);
        
        try {
            this.showLoadingState();
            
            const aiSuggestions = await this.aiService.getAISuggestions(
                code, 
                language, 
                lintResults.issues
            );
            
            this.aiSuggestions = aiSuggestions;
            this.displayAISuggestions(aiSuggestions);
            
        } catch (error) {
            this.showError('Failed to get AI suggestions: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    displayAISuggestions(suggestions) {
        const aiPanel = document.getElementById('ai-suggestions-panel');
        if (!aiPanel) return;

        let html = '<h3>🤖 AI Suggestions</h3>';

        if (suggestions.type === 'code_correction') {
            html += `
                <div class="suggestion-section">
                    <h4>Corrected Code:</h4>
                    <pre><code>${escapeHtml(suggestions.correctedCode)}</code></pre>
                    <button class="btn btn-primary" onclick="applyAICorrection()">Apply Correction</button>
                </div>
            `;
            
            if (suggestions.explanations) {
                html += `<div class="suggestion-section">
                    <h4>Explanations:</h4>
                    <ul>${suggestions.explanations.map(exp => `<li>${escapeHtml(exp)}</li>`).join('')}</ul>
                </div>`;
            }
        } else {
            html += `<div class="suggestion-section">${escapeHtml(suggestions.content)}</div>`;
        }

        aiPanel.innerHTML = html;
        aiPanel.style.display = 'block';
    }

    showLoadingState() {
        // Show loading indicator
        const aiPanel = document.getElementById('ai-suggestions-panel');
        if (aiPanel) {
            aiPanel.innerHTML = '<div class="loading">🔄 Getting AI suggestions...</div>';
            aiPanel.style.display = 'block';
        }
    }

    hideLoadingState() {
        // Hide loading indicator if needed
    }

    showError(message) {
        const aiPanel = document.getElementById('ai-suggestions-panel');
        if (aiPanel) {
            aiPanel.innerHTML = `<div class="error">❌ ${escapeHtml(message)}</div>`;
            aiPanel.style.display = 'block';
        }
    }
}

// Utility function
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global function to apply AI correction
function applyAICorrection() {
    if (window.enhancedLinter && window.enhancedLinter.aiSuggestions) {
        const correctedCode = window.enhancedLinter.aiSuggestions.correctedCode;
        window.enhancedLinter.aiService.applyAICorrection(window.monacoEditor, correctedCode);
    }
}