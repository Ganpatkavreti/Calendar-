// github.js - GitHub Gist सिंक फंक्शनलिटी

class GitHubSync {
    constructor() {
        this.githubToken = localStorage.getItem('githubToken') || '';
        this.gistId = localStorage.getItem('gistId') || '';
        this.autoSync = localStorage.getItem('autoSync') === 'true';
        this.backupFrequency = localStorage.getItem('backupFrequency') || 'daily';
        
        this.initGitHubListeners();
        
        // ऑटो सिंक सेटअप करें
        if (this.autoSync) {
            this.setupAutoSync();
        }
    }

    initGitHubListeners() {
        // सेटिंग्स मोडल के बटन्स
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('test-sync').addEventListener('click', () => this.testSync());
        document.getElementById('cancel-settings').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('close-settings-modal').addEventListener('click', () => this.closeSettingsModal());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settings-modal')) {
                this.closeSettingsModal();
            }
        });
        
        // सेटिंग्स बटन क्लिक
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettingsModal());
    }

    saveSettings() {
        const token = document.getElementById('github-token-input').value.trim();
        const gistId = document.getElementById('gist-id-input').value.trim();
        const autoSync = document.getElementById('auto-sync-input').checked;
        const frequency = document.getElementById('backup-frequency-input').value;
        
        if (!token) {
            calendar.showNotification('Please enter GitHub token', 'error');
            return;
        }
        
        // सेव करें
        this.githubToken = token;
        this.gistId = gistId;
        this.autoSync = autoSync;
        this.backupFrequency = frequency;
        
        localStorage.setItem('githubToken', token);
        localStorage.setItem('gistId', gistId);
        localStorage.setItem('autoSync', autoSync);
        localStorage.setItem('backupFrequency', frequency);
        
        calendar.showNotification('Settings saved successfully!', 'success');
        this.closeSettingsModal();
        
        // ऑटो सिंक रीसेटअप करें
        if (autoSync) {
            this.setupAutoSync();
        }
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        
        // वर्तमान सेटिंग्स लोड करें
        document.getElementById('github-token-input').value = this.githubToken;
        document.getElementById('gist-id-input').value = this.gistId;
        document.getElementById('auto-sync-input').checked = this.autoSync;
        document.getElementById('backup-frequency-input').value = this.backupFrequency;
        
        // मोडल खोलें
        modal.classList.add('active');
        
        // साइडबार बंद करें
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    closeSettingsModal() {
        document.getElementById('settings-modal').classList.remove('active');
    }

    async testSync() {
        try {
            calendar.showNotification('Testing sync with GitHub...', 'info');
            
            const data = this.getBackupData();
            const result = await this.syncToGist(data);
            
            if (result.success) {
                calendar.showNotification('Sync test successful!', 'success');
                
                // Gist ID सेव करें
                if (result.gistId && !this.gistId) {
                    this.gistId = result.gistId;
                    localStorage.setItem('gistId', result.gistId);
                }
            } else {
                calendar.showNotification(`Sync failed: ${result.error}`, 'error');
            }
        } catch (error) {
            calendar.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // बैकअप डेटा तैयार करें
    getBackupData() {
        return {
            events: calendar.events || [],
            routineTasks: calendar.routineTasks || [],
            taskCompletions: calendar.taskCompletions || [],
            diaryEntries: calendar.diaryEntries || [],
            backupDate: new Date().toISOString(),
            appVersion: '1.0.0'
        };
    }

    async syncToGist(data) {
        if (!this.githubToken) {
            return { success: false, error: 'GitHub token not configured' };
        }
        
        const gistData = {
            description: 'Calendar App Backup - ' + new Date().toLocaleDateString(),
            files: {
                'calendar-backup.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };
        
        try {
            let url = 'https://api.github.com/gists';
            let method = 'POST';
            
            // अगर Gist ID है तो update करें
            if (this.gistId) {
                url = `https://api.github.com/gists/${this.gistId}`;
                method = 'PATCH';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(gistData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
            
            const result = await response.json();
            
            // नया Gist ID सेव करें
            if (!this.gistId) {
                this.gistId = result.id;
                localStorage.setItem('gistId', result.id);
            }
            
            return { success: true, gistId: result.id };
        } catch (error) {
            console.error('GitHub sync error:', error);
            return { success: false, error: error.message };
        }
    }

    async syncFromGist() {
        if (!this.githubToken || !this.gistId) {
            return { success: false, error: 'GitHub token or Gist ID not configured' };
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const result = await response.json();
            const backupData = JSON.parse(result.files['calendar-backup.json'].content);
            
            // डेटा मर्ज करें (पुराने डेटा को नए से रिप्लेस करें)
            calendar.events = backupData.events || [];
            calendar.routineTasks = backupData.routineTasks || [];
            calendar.taskCompletions = backupData.taskCompletions || [];
            calendar.diaryEntries = backupData.diaryEntries || [];
            
            // लोकल स्टोरेज में सेव करें
            localStorage.setItem('calendarEvents', JSON.stringify(calendar.events));
            localStorage.setItem('routineTasks', JSON.stringify(calendar.routineTasks));
            localStorage.setItem('taskCompletions', JSON.stringify(calendar.taskCompletions));
            localStorage.setItem('diaryEntries', JSON.stringify(calendar.diaryEntries));
            
            // UI अपडेट करें
            calendar.updateCalendar();
            if (eventsManager) eventsManager.updateRemindersList();
            if (diaryManager) diaryManager.updateDiaryView();
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async autoBackup() {
        if (!this.autoSync || !this.githubToken) {
            return;
        }
        
        try {
            const data = this.getBackupData();
            const result = await this.syncToGist(data);
            
            if (result.success) {
                console.log('Auto backup completed successfully');
            } else {
                console.error('Auto backup failed:', result.error);
            }
        } catch (error) {
            console.error('Auto backup error:', error);
        }
    }

    setupAutoSync() {
        // पिछला टाइमर क्लियर करें
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        // फ्रीक्वेंसी के हिसाब से इंटरवल सेट करें
        let interval = 24 * 60 * 60 * 1000; // डिफॉल्ट: दैनिक
        
        if (this.backupFrequency === 'weekly') {
            interval = 7 * 24 * 60 * 60 * 1000;
        } else if (this.backupFrequency === 'manual') {
            return; // मैनुअल के लिए टाइमर न सेट करें
        }
        
        // पहला बैकअप तुरंत करें
        setTimeout(() => {
            this.autoBackup();
        }, 2000);
        
        // टाइमर सेट करें
        this.syncTimer = setInterval(() => {
            this.autoBackup();
        }, interval);
    }
}

// ग्लोबल GitHub सिंक इंस्टेंस
window.githubSync = new GitHubSync();