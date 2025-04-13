/**
 * update-notification.js
 * Module for managing update notifications and interface
 */

class UpdateNotification {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.message = null;
        this.releaseNotes = null;
        this.actionButton = null;
        
        this.initialize();
    }
    
    /**
     * Initialize update notification interface
     */
    initialize() {
        // Create container for notification
        this.container = document.createElement('div');
        this.container.className = 'update-notification';
        this.container.style.display = 'none';
        
        // Create notification content
        this.message = document.createElement('div');
        this.message.className = 'update-message';
        this.container.appendChild(this.message);
        
        // Create release notes container
        this.releaseNotes = document.createElement('div');
        this.releaseNotes.className = 'release-notes';
        this.container.appendChild(this.releaseNotes);
        
        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        progressContainer.appendChild(this.progressBar);
        
        this.progressText = document.createElement('div');
        this.progressText.className = 'progress-text';
        progressContainer.appendChild(this.progressText);
        
        this.container.appendChild(progressContainer);
        
        // Create action button
        this.actionButton = document.createElement('button');
        this.actionButton.className = 'update-action-button';
        this.container.appendChild(this.actionButton);
        
        // Add to body when DOM is loaded
        if (document.body) {
            document.body.appendChild(this.container);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this.container);
            });
        }
        
        // Add styles
        this.addStyles();
        
        // Register events from main process
        this.registerEvents();
    }
    
    /**
     * Add CSS styles for update notification
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .update-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #1e293b;
                color: #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                width: 350px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s, transform 0.3s;
                font-family: 'Roboto', sans-serif;
            }
            
            .update-notification.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .update-message {
                margin-bottom: 12px;
                font-size: 14px;
                line-height: 1.5;
                font-weight: 500;
            }
            
            .release-notes {
                max-height: 100px;
                overflow-y: auto;
                margin-bottom: 12px;
                font-size: 12px;
                line-height: 1.4;
                padding: 8px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                white-space: pre-line;
                display: none;
            }
            
            .release-notes.visible {
                display: block;
            }
            
            .progress-container {
                height: 20px;
                background: #334155;
                border-radius: 10px;
                margin-bottom: 16px;
                position: relative;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background: #3b82f6;
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            
            .progress-text {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                text-align: center;
                line-height: 20px;
                font-size: 12px;
                color: white;
                font-weight: 500;
            }
            
            .update-action-button {
                width: 100%;
                padding: 8px 12px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: background 0.2s;
            }
            
            .update-action-button:hover {
                background: #2563eb;
            }
            
            .update-action-button:disabled {
                background: #64748b;
                cursor: not-allowed;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Register events from main process
     */
    registerEvents() {
        // Event when update is available
        window.api.onUpdateAvailable((info) => {
            this.showUpdateAvailable(info);
        });
        
        // Download progress event
        window.api.onDownloadProgress((progressObj) => {
            this.updateDownloadProgress(progressObj);
        });
        
        // Event when download is complete
        window.api.onUpdateDownloaded((info) => {
            this.showUpdateDownloaded(info);
        });
        
        // Event when error occurs
        window.api.onUpdateError((message) => {
            this.showUpdateError(message);
        });
    }
    
    /**
     * Show notification for new update
     * @param {Object} info - Update information
     */
    showUpdateAvailable(info) {
        this.message.textContent = `New version available: ${info.version}`;
        
        // Handle release notes if available
        if (info.releaseNotes) {
            this.releaseNotes.textContent = info.releaseNotes;
            this.releaseNotes.classList.add('visible');
        } else {
            this.releaseNotes.classList.remove('visible');
        }
        
        this.progressBar.style.width = '0%';
        this.progressText.textContent = 'Ready to download';
        
        this.actionButton.textContent = 'Download';
        this.actionButton.disabled = false;
        this.actionButton.onclick = () => {
            window.api.downloadUpdate();
            this.actionButton.disabled = true;
            this.actionButton.textContent = 'Downloading...';
        };
        
        this.showNotification();
    }
    
    /**
     * Update download progress
     * @param {Object} progressObj - Progress information
     */
    updateDownloadProgress(progressObj) {
        const percent = Math.round(progressObj.percent);
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
        
        this.message.textContent = 'Downloading update...';
        this.actionButton.textContent = 'Downloading...';
        this.actionButton.disabled = true;
        
        this.showNotification();
    }
    
    /**
     * Show notification when download is complete
     * @param {Object} info - Update information
     */
    showUpdateDownloaded(info) {
        this.progressBar.style.width = '100%';
        this.progressText.textContent = 'Complete';
        
        this.message.textContent = 'Update ready to install';
        this.actionButton.textContent = 'Install Now';
        this.actionButton.disabled = false;
        this.actionButton.onclick = () => {
            window.api.installUpdate();
        };
        
        this.showNotification();
    }
    
    /**
     * Show error notification
     * @param {string} message - Error message
     */
    showUpdateError(message) {
        this.message.textContent = `Update error: ${message}`;
        this.progressBar.style.width = '0%';
        this.progressText.textContent = '';
        
        this.actionButton.textContent = 'Try Again';
        this.actionButton.disabled = false;
        this.actionButton.onclick = () => {
            window.api.checkForUpdates();
        };
        
        this.showNotification();
    }
    
    /**
     * Show notification
     */
    showNotification() {
        this.container.style.display = 'block';
        setTimeout(() => {
            this.container.classList.add('visible');
        }, 10);
    }
    
    /**
     * Hide notification
     */
    hideNotification() {
        this.container.classList.remove('visible');
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300);
    }
}

// Initialize when page is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.updateNotification = new UpdateNotification();
}); 