// diary.js - अपडेटेड (रिपोर्ट कार्ड सिस्टम के लिए)

class DiaryManager {
    constructor() {
        // डायरी एंट्रीज को रिपोर्ट कार्ड में बदल दिया गया है
        // अब यह सिर्फ रिपोर्ट कार्ड फुल व्यू मोडल हैंडल करेगा
        this.initDiaryListeners();
    }

    initDiaryListeners() {
        // डायरी फुल व्यू मोडल लिसनर्स (रिपोर्ट कार्ड के लिए भी काम करेगा)
        document.getElementById('close-diary-full-view')?.addEventListener('click', () => this.closeDiaryFullView());
        document.getElementById('close-diary-full-modal')?.addEventListener('click', () => this.closeDiaryFullView());
        document.getElementById('delete-diary-entry')?.addEventListener('click', () => this.deleteDiaryEntry());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        const diaryModal = document.getElementById('diary-full-view-modal');
        if (diaryModal) {
            diaryModal.addEventListener('click', (e) => {
                if (e.target === diaryModal) {
                    this.closeDiaryFullView();
                }
            });
        }
    }

    // डायरी व्यू अपडेट करें (अब रिपोर्ट कार्ड का हिस्सा है)
    updateDiaryView() {
        // डायरी व्यू अब रिपोर्ट कार्ड मैनेजर द्वारा हैंडल किया जाएगा
        // यह फंक्शन सिर्फ कम्पेटिबिलिटी के लिए रखा गया है
        console.log('Diary view is now handled by Report Card Manager');
        
        // अगर रिपोर्ट कार्ड मैनेजर है तो उससे अपडेट करवाएं
        if (window.reportCardManager) {
            window.reportCardManager.updateReportCardView();
        } else {
            this.showEmptyDiaryView();
        }
    }

    // खाली डायरी व्यू दिखाएं
    showEmptyDiaryView() {
        const diaryCards = document.getElementById('diary-cards');
        if (!diaryCards) return;
        
        diaryCards.innerHTML = `
            <div class="empty-diary">
                <i class="fas fa-chart-line"></i>
                <h3>Report Cards Loading...</h3>
                <p>Your daily report cards will appear here automatically.</p>
                <p>Please wait or refresh the page.</p>
            </div>
        `;
    }

    // डायरी एंट्री फुल व्यू खोलें (अब रिपोर्ट कार्ड के लिए)
    openDiaryFullView(dateStr) {
        // अगर रिपोर्ट कार्ड मैनेजर है तो उसका मोडल खोलें
        if (window.reportCardManager) {
            window.reportCardManager.openReportCardModal(dateStr);
        } else {
            // पुराना डायरी व्यू (बैकअप के लिए)
            this.openLegacyDiaryView(dateStr);
        }
    }

    // पुराना डायरी व्यू (बैकअप)
    openLegacyDiaryView(dateStr) {
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
        const modal = document.getElementById('diary-full-view-modal');
        if (modal) modal.classList.remove('active');
    }

    deleteDiaryEntry() {
        const modal = document.getElementById('diary-full-view-modal');
        const dateStr = modal.dataset.entryDate;
        
        if (!dateStr || !confirm('Are you sure you want to delete these notes?')) {
            return;
        }
        
        // डायरी एंट्री डिलीट करें
        calendar.diaryEntries = calendar.diaryEntries.filter(entry => entry.date !== dateStr);
        localStorage.setItem('diaryEntries', JSON.stringify(calendar.diaryEntries));
        
        // व्यू अपडेट करें (रिपोर्ट कार्ड)
        if (window.reportCardManager) {
            window.reportCardManager.updateReportCardView();
        }
        
        this.closeDiaryFullView();
        
        // GitHub बैकअप करें
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
        
        calendar.showNotification('Notes deleted successfully!', 'success');
    }

    // HTML escaping फंक्शन
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // रिपोर्ट कार्ड स्टैट्स अपडेट करें
    updateReportStats() {
        const reportStats = document.getElementById('report-stats');
        if (!reportStats) return;
        
        // अगर रिपोर्ट कार्ड मैनेजर है तो उससे स्टैट्स लें
        if (window.reportCardManager) {
            const allReports = Object.values(window.reportCardManager.dailyReports);
            const stats = this.calculateStats(allReports);
            
            reportStats.innerHTML = `
                <div class="stat-item">
                    <i class="fas fa-calendar-day"></i>
                    <span>${stats.totalDays} days</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-check-circle"></i>
                    <span class="stat-value">${stats.averageCompletion}% avg</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-trophy"></i>
                    <span class="stat-value">${stats.excellentDays} excellent</span>
                </div>
            `;
        }
    }

    // स्टैट्स कैलकुलेट करें
    calculateStats(reports) {
        let totalDays = reports.length;
        let totalCompletion = 0;
        let excellentDays = 0;
        
        reports.forEach(report => {
            totalCompletion += report.percentage || 0;
            if (report.status === 'excellent') excellentDays++;
        });
        
        const averageCompletion = totalDays > 0 ? Math.round(totalCompletion / totalDays) : 0;
        
        return {
            totalDays,
            averageCompletion,
            excellentDays
        };
    }

    // टास्क कम्प्लीशन बदलने पर अपडेट करें
    onTaskCompletionChanged(dateStr) {
        // रिपोर्ट कार्ड अपडेट करें
        if (window.reportCardManager) {
            window.reportCardManager.updateReportForDate(dateStr);
        }
        
        // स्टैट्स अपडेट करें
        this.updateReportStats();
    }

    // रूटीन टास्क्स बदलने पर अपडेट करें
    onRoutineTasksChanged() {
        // रिपोर्ट कार्ड अपडेट करें
        if (window.reportCardManager) {
            window.reportCardManager.updateAllReportsOnTaskChange();
        }
        
        // स्टैट्स अपडेट करें
        this.updateReportStats();
    }
}

// ग्लोबल डायरी मैनेजर (अब रिपोर्ट कार्ड सपोर्ट के साथ)
window.diaryManager = new DiaryManager();
