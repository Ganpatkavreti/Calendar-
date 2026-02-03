// github.js - अपडेटेड GitHub Gist सिंक (रिपोर्ट कार्ड सपोर्ट के साथ)

class GitHubSync {
    constructor() {
        this.githubToken = localStorage.getItem('githubToken') || '';
        this.gistId = localStorage.getItem('gistId') || '';
        this.autoSync = localStorage.getItem('autoSync') === 'true';
        this.backupFrequency = localStorage.getItem('backupFrequency') || 'daily';
        this.lastBackupTime = localStorage.getItem('lastBackupTime') || null;
        
        this.initGitHubListeners();
        
        // ऑटो सिंक सेटअप करें
        if (this.autoSync) {
            this.setupAutoSync();
        }
        
        // पिछले बैकअप से डेटा रिस्टोर करें (अगर उपलब्ध हो)
        this.restoreFromLastBackup();
    }

    initGitHubListeners() {
        // सेटिंग्स मोडल के बटन्स
        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('test-sync')?.addEventListener('click', () => this.testSync());
        document.getElementById('cancel-settings')?.addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('close-settings-modal')?.addEventListener('click', () => this.closeSettingsModal());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }
        
        // सेटिंग्स बटन क्लिक
        document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettingsModal());
        
        // बैकअप एक्शन बटन्स
        document.getElementById('export-backup-btn')?.addEventListener('click', () => this.exportBackupData());
        
        const importBtn = document.getElementById('import-backup-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = (e) => {
                    if (e.target.files[0]) {
                        this.importBackupData(e.target.files[0]);
                    }
                };
                fileInput.click();
            });
        }
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
        
        // टेस्ट सिंक करें (अगर टोकन बदला है)
        if (token && this.gistId) {
            setTimeout(() => {
                this.testSync();
            }, 1000);
        }
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        
        // वर्तमान सेटिंग्स लोड करें
        document.getElementById('github-token-input').value = this.githubToken;
        document.getElementById('gist-id-input').value = this.gistId;
        document.getElementById('auto-sync-input').checked = this.autoSync;
        document.getElementById('backup-frequency-input').value = this.backupFrequency;
        
        // लास्ट बैकअप टाइम दिखाएं
        this.updateLastBackupDisplay();
        
        // बैकअप स्टेटस चेक करें
        this.checkAndDisplayBackupStatus();
        
        // मोडल खोलें
        modal.classList.add('active');
        
        // साइडबार बंद करें
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    updateLastBackupDisplay() {
        const lastBackupElement = document.getElementById('last-backup-time');
        if (!lastBackupElement) return;
        
        if (this.lastBackupTime) {
            const lastBackupDate = new Date(this.lastBackupTime);
            const formattedTime = lastBackupDate.toLocaleString();
            lastBackupElement.textContent = `Last backup: ${formattedTime}`;
            lastBackupElement.style.display = 'block';
        } else {
            lastBackupElement.textContent = 'No backup yet';
            lastBackupElement.style.display = 'block';
        }
    }

    async checkAndDisplayBackupStatus() {
        const statusElement = document.getElementById('backup-status');
        if (!statusElement) return;
        
        const status = await this.checkBackupStatus();
        
        if (status.exists) {
            const lastUpdated = new Date(status.lastUpdated);
            statusElement.innerHTML = `
                <div class="backup-status-success">
                    <i class="fas fa-check-circle"></i>
                    <span>Backup exists (${lastUpdated.toLocaleDateString()})</span>
                </div>
            `;
        } else {
            statusElement.innerHTML = `
                <div class="backup-status-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No backup found</span>
                </div>
            `;
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.remove('active');
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
                
                // लास्ट बैकअप टाइम अपडेट करें
                this.lastBackupTime = new Date().toISOString();
                localStorage.setItem('lastBackupTime', this.lastBackupTime);
                this.updateLastBackupDisplay();
                
                // स्टेटस अपडेट करें
                this.checkAndDisplayBackupStatus();
            } else {
                calendar.showNotification(`Sync failed: ${result.error}`, 'error');
            }
        } catch (error) {
            calendar.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // बैकअप डेटा तैयार करें (रिपोर्ट कार्ड्स के साथ)
    getBackupData() {
        const backupData = {
            // मुख्य डेटा
            events: calendar.events || [],
            routineTasks: calendar.routineTasks || [],
            taskCompletions: calendar.taskCompletions || [],
            diaryEntries: calendar.diaryEntries || [],
            
            // रिपोर्ट कार्ड डेटा
            dailyReports: {},
            taskSnapshots: {},
            
            // हिस्ट्री डेटा
            taskHistory: JSON.parse(localStorage.getItem('taskHistory') || '{}'),
            completionHistory: JSON.parse(localStorage.getItem('completionHistory') || '{}'),
            
            // मेटाडेटा
            backupDate: new Date().toISOString(),
            appVersion: '2.0.0',
            dataVersion: '1.0',
            totalReports: 0,
            totalTasks: calendar.routineTasks.length
        };
        
        // रिपोर्ट कार्ड डेटा जोड़ें
        if (window.reportCardManager) {
            backupData.dailyReports = window.reportCardManager.dailyReports;
            backupData.taskSnapshots = window.reportCardManager.taskSnapshots;
            backupData.totalReports = Object.keys(window.reportCardManager.dailyReports).length;
        }
        
        return backupData;
    }

    async syncToGist(data) {
        if (!this.githubToken) {
            return { success: false, error: 'GitHub token not configured' };
        }
        
        const gistData = {
            description: `Calendar App Backup - ${new Date().toLocaleDateString()} (${data.totalReports} reports, ${data.totalTasks} tasks)`,
            files: {
                'calendar-backup.json': {
                    content: JSON.stringify(data, null, 2)
                }
            },
            public: false
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
            
            // लास्ट बैकअप टाइम सेव करें
            this.lastBackupTime = new Date().toISOString();
            localStorage.setItem('lastBackupTime', this.lastBackupTime);
            
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
            calendar.showNotification('Restoring from backup...', 'info');
            
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
            
            // डेटा रिस्टोर करें
            this.restoreData(backupData);
            
            calendar.showNotification('Backup restored successfully!', 'success');
            return { success: true };
        } catch (error) {
            calendar.showNotification(`Restore failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // डेटा रिस्टोर करें
    restoreData(backupData) {
        // मुख्य डेटा रिस्टोर करें
        calendar.events = backupData.events || [];
        calendar.routineTasks = backupData.routineTasks || [];
        calendar.taskCompletions = backupData.taskCompletions || [];
        calendar.diaryEntries = backupData.diaryEntries || [];
        
        // लोकल स्टोरेज में सेव करें
        localStorage.setItem('calendarEvents', JSON.stringify(calendar.events));
        localStorage.setItem('routineTasks', JSON.stringify(calendar.routineTasks));
        localStorage.setItem('taskCompletions', JSON.stringify(calendar.taskCompletions));
        localStorage.setItem('diaryEntries', JSON.stringify(calendar.diaryEntries));
        
        // हिस्ट्री डेटा रिस्टोर करें
        if (backupData.taskHistory) {
            localStorage.setItem('taskHistory', JSON.stringify(backupData.taskHistory));
        }
        
        if (backupData.completionHistory) {
            localStorage.setItem('completionHistory', JSON.stringify(backupData.completionHistory));
        }
        
        // रिपोर्ट कार्ड डेटा रिस्टोर करें
        if (backupData.dailyReports && window.reportCardManager) {
            window.reportCardManager.dailyReports = backupData.dailyReports;
        }
        
        if (backupData.taskSnapshots && window.reportCardManager) {
            window.reportCardManager.taskSnapshots = backupData.taskSnapshots;
        }
        
        // रिपोर्ट कार्ड मैनेजर को सेव करने दें
        if (window.reportCardManager) {
            window.reportCardManager.saveToLocalStorage();
            window.reportCardManager.updateReportCardView();
        }
        
        // UI अपडेट करें
        calendar.updateCalendar();
        if (eventsManager) eventsManager.updateRemindersList();
        
        // लास्ट बैकअप टाइम अपडेट करें
        this.lastBackupTime = backupData.backupDate || new Date().toISOString();
        localStorage.setItem('lastBackupTime', this.lastBackupTime);
        this.updateLastBackupDisplay();
    }

    // पिछले बैकअप से डेटा रिस्टोर करें
    async restoreFromLastBackup() {
        // अगर डेटा पहले से है तो रिस्टोर न करें
        if (calendar.events.length > 0 || calendar.routineTasks.length > 0) {
            return;
        }
        
        // अगर GitHub सेटअप नहीं है तो छोड़ें
        if (!this.githubToken || !this.gistId) {
            return;
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                const backupData = JSON.parse(result.files['calendar-backup.json'].content);
                
                // सिर्फ डेटा रिस्टोर करें अगर खाली है
                if (calendar.events.length === 0 && calendar.routineTasks.length === 0) {
                    this.restoreData(backupData);
                    console.log('Data restored from backup');
                }
            }
        } catch (error) {
            console.log('No backup found or error restoring:', error.message);
        }
    }

    async autoBackup() {
        if (!this.autoSync || !this.githubToken) {
            return;
        }
        
        // फ्रीक्वेंसी चेक करें
        if (!this.shouldBackupNow()) {
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

    // बैकअप करना चाहिए या नहीं
    shouldBackupNow() {
        if (!this.lastBackupTime) return true;
        
        const lastBackup = new Date(this.lastBackupTime);
        const now = new Date();
        const hoursSinceLastBackup = (now - lastBackup) / (1000 * 60 * 60);
        
        switch(this.backupFrequency) {
            case 'daily':
                return hoursSinceLastBackup >= 24;
            case 'weekly':
                return hoursSinceLastBackup >= 168; // 7 days
            case 'manual':
                return false;
            default:
                return hoursSinceLastBackup >= 24;
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
        
        // पहला बैकअप तुरंत करें (अगर चाहिए)
        if (this.shouldBackupNow()) {
            setTimeout(() => {
                this.autoBackup();
            }, 5000); // 5 सेकंड बाद
        }
        
        // टाइमर सेट करें (हर घंटे चेक करे)
        this.syncTimer = setInterval(() => {
            this.autoBackup();
        }, 60 * 60 * 1000); // हर घंटे
    }

    // मैनुअल बैकअप ट्रिगर
    async manualBackup() {
        try {
            calendar.showNotification('Starting manual backup...', 'info');
            
            const data = this.getBackupData();
            const result = await this.syncToGist(data);
            
            if (result.success) {
                calendar.showNotification('Manual backup completed successfully!', 'success');
            } else {
                calendar.showNotification(`Backup failed: ${result.error}`, 'error');
            }
        } catch (error) {
            calendar.showNotification(`Backup error: ${error.message}`, 'error');
        }
    }

    // बैकअप स्टेटस चेक करें
    async checkBackupStatus() {
        if (!this.githubToken || !this.gistId) {
            return { exists: false, lastUpdated: null };
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return {
                    exists: true,
                    lastUpdated: result.updated_at,
                    size: JSON.stringify(result.files['calendar-backup.json']).length
                };
            }
            
            return { exists: false, lastUpdated: null };
        } catch (error) {
            return { exists: false, lastUpdated: null, error: error.message };
        }
    }

    // बैकअप डेटा को एक्सपोर्ट करें (फाइल डाउनलोड)
    exportBackupData() {
        const data = this.getBackupData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        calendar.showNotification('Backup exported successfully!', 'success');
    }

    // बैकअप डेटा को इंपोर्ट करें (फाइल अपलोड)
    importBackupData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // डेटा वैलिडेट करें
                if (!backupData.events || !backupData.routineTasks) {
                    throw new Error('Invalid backup file format');
                }
                
                if (confirm('This will replace all your current data. Are you sure?')) {
                    this.restoreData(backupData);
                    calendar.showNotification('Backup imported successfully!', 'success');
                }
            } catch (error) {
                calendar.showNotification(`Import failed: ${error.message}`, 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// ग्लोबल GitHub सिंक इंस्टेंस
window.githubSync = new GitHubSync();
