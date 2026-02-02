// diary.js - अपडेटेड डायरी फीचर

class DiaryManager {
    constructor() {
        this.initDiaryListeners();
    }

    initDiaryListeners() {
        // डायरी फुल व्यू मोडल लिसनर्स
        document.getElementById('close-diary-full-view').addEventListener('click', () => this.closeDiaryFullView());
        document.getElementById('close-diary-full-modal').addEventListener('click', () => this.closeDiaryFullView());
        document.getElementById('delete-diary-entry').addEventListener('click', () => this.deleteDiaryEntry());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('diary-full-view-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('diary-full-view-modal')) {
                this.closeDiaryFullView();
            }
        });
    }

    // डायरी व्यू अपडेट करें (एक दिन एक कार्ड)
    updateDiaryView() {
        const diaryCards = document.getElementById('diary-cards');
        const diaryEntries = calendar.diaryEntries;
        
        // तारीख के हिसाब से सॉर्ट करें (नई से पुरानी)
        const sortedEntries = [...diaryEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedEntries.length === 0) {
            diaryCards.innerHTML = `
                <div class="empty-diary">
                    <i class="fas fa-book-open"></i>
                    <h3>No Diary Entries</h3>
                    <p>You haven't written any diary entries yet.</p>
                    <p>Click on any past date to write about your experience.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        sortedEntries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateStr = entryDate.toLocaleDateString('en-US', options);
            
            // इस तारीख के लिए कम्प्लीटेड टास्क्स काउंट करें
            const dateStrForTasks = entryDate.toISOString().split('T')[0];
            const routineTasks = calendar.getRoutineTasks();
            let completedTasks = 0;
            let totalTasks = routineTasks.length;
            
            routineTasks.forEach(task => {
                const completion = calendar.getTaskCompletion(task.id, dateStrForTasks);
                if (completion.completed) completedTasks++;
            });
            
            // कंटेंट प्रिव्यू (150 characters)
            const contentPreview = entry.content.length > 150 
                ? entry.content.substring(0, 150) + '...' 
                : entry.content;
            
            html += `
                <div class="diary-card" onclick="diaryManager.openDiaryFullView('${entry.date}')">
                    <div class="diary-card-header">
                        <h3 class="diary-card-title">
                            <i class="fas fa-book"></i> ${this.escapeHtml(entry.title)}
                        </h3>
                        <div class="diary-card-date">${dateStr}</div>
                    </div>
                    <div class="diary-card-content">
                        ${this.escapeHtml(contentPreview)}
                    </div>
                    <div class="diary-card-footer">
                        <span class="entry-type">Daily Entry</span>
                        ${totalTasks > 0 ? `<span class="task-status">${completedTasks}/${totalTasks} tasks completed</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        diaryCards.innerHTML = html;
    }

    // डायरी एंट्री फुल व्यू खोलें
    openDiaryFullView(dateStr) {
        const entry = calendar.getDiaryEntryForDate(new Date(dateStr));
        if (!entry) return;
        
        const modal = document.getElementById('diary-full-view-modal');
        const entryDate = new Date(entry.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStrFormatted = entryDate.toLocaleDateString('en-US', options);
        const timeStr = new Date(entry.updatedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // इस तारीख के लिए रूटीन टास्क्स और उनकी कम्प्लीशन स्टेटस लोड करें
        const routineTasks = calendar.getRoutineTasks();
        const dateStrForTasks = entryDate.toISOString().split('T')[0];
        
        // कंटेंट तैयार करें
        let contentHtml = `<div class="diary-content">`;
        contentHtml += `<p>${this.escapeHtml(entry.content)}</p>`;
        
        if (routineTasks.length > 0) {
            contentHtml += `<h4>Routine Tasks for this day:</h4>`;
            contentHtml += `<ul>`;
            routineTasks.forEach(task => {
                const completion = calendar.getTaskCompletion(task.id, dateStrForTasks);
                contentHtml += `<li>${completion.completed ? '✅' : '❌'} ${this.escapeHtml(task.title)}`;
                if (task.notes) {
                    contentHtml += `<br><small>${this.escapeHtml(task.notes)}</small>`;
                }
                contentHtml += `</li>`;
            });
            contentHtml += `</ul>`;
        }
        
        contentHtml += `</div>`;
        
        document.getElementById('diary-full-title').textContent = this.escapeHtml(entry.title);
        document.getElementById('diary-full-date').textContent = dateStrFormatted;
        document.getElementById('diary-full-time').textContent = `Last updated: ${timeStr}`;
        document.getElementById('diary-full-content').innerHTML = contentHtml;
        
        // डिलीट बटन के लिए एंट्री आईडी सेव करें
        modal.dataset.entryDate = dateStr;
        
        modal.classList.add('active');
    }

    closeDiaryFullView() {
        document.getElementById('diary-full-view-modal').classList.remove('active');
    }

    deleteDiaryEntry() {
        const modal = document.getElementById('diary-full-view-modal');
        const dateStr = modal.dataset.entryDate;
        
        if (!dateStr || !confirm('Are you sure you want to delete this diary entry?')) {
            return;
        }
        
        // डायरी एंट्री डिलीट करें
        calendar.diaryEntries = calendar.diaryEntries.filter(entry => entry.date !== dateStr);
        localStorage.setItem('diaryEntries', JSON.stringify(calendar.diaryEntries));
        
        // व्यू अपडेट करें
        this.updateDiaryView();
        this.closeDiaryFullView();
        
        // GitHub बैकअप करें
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
        
        calendar.showNotification('Diary entry deleted successfully!', 'success');
    }

    // HTML escaping फंक्शन
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ग्लोबल डायरी मैनेजर
window.diaryManager = new DiaryManager();