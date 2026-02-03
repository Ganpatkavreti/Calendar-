// report-card.js - नई रिपोर्ट कार्ड सिस्टम

class ReportCardManager {
    constructor() {
        this.dailyReports = JSON.parse(localStorage.getItem('dailyReports') || '{}');
        this.taskSnapshots = JSON.parse(localStorage.getItem('taskSnapshots') || '{}');
        this.initReportCardListeners();
        this.initializeDailyReports();
    }

    initReportCardListeners() {
        // रिपोर्ट कार्ड मोडल लिसनर्स
        document.getElementById('close-report-card-view')?.addEventListener('click', () => this.closeReportCardModal());
        document.getElementById('close-report-card-modal')?.addEventListener('click', () => this.closeReportCardModal());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        const reportCardModal = document.getElementById('report-card-modal');
        if (reportCardModal) {
            reportCardModal.addEventListener('click', (e) => {
                if (e.target === reportCardModal) {
                    this.closeReportCardModal();
                }
            });
        }
    }

    // डेली रिपोर्ट्स इनिशियलाइज़ करें
    initializeDailyReports() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // पिछले 7 दिनों के लिए रिपोर्ट्स चेक करें और बनाएं
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            this.checkAndCreateDailyReport(date);
        }
        
        // भविष्य के लिए दैनिक चेक सेट करें
        this.setupDailyReportCheck();
    }

    setupDailyReportCheck() {
        // हर 5 मिनट में चेक करें अगर नई रिपोर्ट बनानी है
        setInterval(() => {
            this.checkAndCreateDailyReport(new Date());
        }, 5 * 60 * 1000);
    }

    // डेली रिपोर्ट चेक करें और बनाएं
    checkAndCreateDailyReport(date) {
        const dateStr = date.toISOString().split('T')[0];
        
        // अगर पहले से नहीं है तो बनाएं
        if (!this.dailyReports[dateStr]) {
            this.createDailyReport(date);
        }
    }

    // डेली रिपोर्ट बनाएं
    createDailyReport(date) {
        const dateStr = date.toISOString().split('T')[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reportDate = new Date(date);
        reportDate.setHours(0, 0, 0, 0);
        
        // सिर्फ आज या पिछली तारीखों के लिए रिपोर्ट बनाएं
        if (reportDate > today) {
            return null;
        }
        
        // टास्क स्नैपशॉट सेव करें
        this.saveTaskSnapshot(dateStr);
        
        // टास्क कम्प्लीशन डेटा प्राप्त करें
        const taskStats = this.getTaskCompletionStats(dateStr);
        
        // रिपोर्ट डेटा बनाएं
        const report = {
            id: dateStr,
            date: dateStr,
            type: 'daily-report',
            title: `Daily Report - ${this.formatDate(date)}`,
            tasks: taskStats.tasks,
            completedTasks: taskStats.completedTasks,
            totalTasks: taskStats.totalTasks,
            percentage: taskStats.percentage,
            status: this.getStatusFromPercentage(taskStats.percentage),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // सेव करें
        this.dailyReports[dateStr] = report;
        this.saveToLocalStorage();
        
        // GitHub सिंक
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
        
        return report;
    }

    // टास्क स्नैपशॉट सेव करें (टास्क हिस्ट्री के लिए)
    saveTaskSnapshot(dateStr) {
        const routineTasks = calendar.getRoutineTasks();
        
        // टास्क लिस्ट की कॉपी बनाएं (रेफरेंस नहीं)
        const taskSnapshot = routineTasks.map(task => ({
            id: task.id,
            title: task.title,
            notes: task.notes || '',
            createdAt: task.createdAt,
            originalId: task.id
        }));
        
        this.taskSnapshots[dateStr] = taskSnapshot;
        this.saveToLocalStorage();
    }

    // टास्क कम्प्लीशन स्टेटस प्राप्त करें
    getTaskCompletionStats(dateStr) {
        const routineTasks = calendar.getRoutineTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reportDate = new Date(dateStr);
        reportDate.setHours(0, 0, 0, 0);
        
        let completedTasks = 0;
        let tasks = [];
        
        if (routineTasks.length === 0) {
            return {
                tasks: [],
                completedTasks: 0,
                totalTasks: 0,
                percentage: 0,
                status: 'empty'
            };
        }
        
        routineTasks.forEach(task => {
            let completed = false;
            
            // अगर तारीख आज या पहले की है
            if (reportDate <= today) {
                const completion = calendar.getTaskCompletion(task.id, dateStr);
                completed = completion.completed;
            }
            
            tasks.push({
                id: task.id,
                title: task.title,
                completed: completed,
                notes: task.notes || ''
            });
            
            if (completed) {
                completedTasks++;
            }
        });
        
        const percentage = routineTasks.length > 0 ? 
            Math.round((completedTasks / routineTasks.length) * 100) : 0;
        
        return {
            tasks: tasks,
            completedTasks: completedTasks,
            totalTasks: routineTasks.length,
            percentage: percentage,
            status: this.getStatusFromPercentage(percentage)
        };
    }

    // प्रतिशत से स्टेटस प्राप्त करें
    getStatusFromPercentage(percentage) {
        if (percentage === 0) return 'empty';
        if (percentage < 50) return 'poor';
        if (percentage < 80) return 'average';
        if (percentage < 100) return 'good';
        return 'excellent';
    }

    // स्टेटस के अनुसार कलर कोड प्राप्त करें
    getStatusColor(status) {
        switch(status) {
            case 'excellent': return '#34a853';
            case 'good': return '#fbbc04';
            case 'average': return '#ff9800';
            case 'poor': return '#ea4335';
            case 'empty': return '#9aa0a6';
            default: return '#9aa0a6';
        }
    }

    // स्टेटस के अनुसार आइकन प्राप्त करें
    getStatusIcon(status) {
        switch(status) {
            case 'excellent': return '✅';
            case 'good': return '⚠️';
            case 'poor': return '❌';
            case 'empty': return '⏸️';
            default: return '⏸️';
        }
    }

    // रिपोर्ट कार्ड व्यू अपडेट करें
    updateReportCardView() {
        const diaryCards = document.getElementById('diary-cards');
        const reportStats = document.getElementById('report-stats');
        
        if (!diaryCards) return;
        
        // सभी रिपोर्ट्स प्राप्त करें
        const allReports = Object.values(this.dailyReports);
        
        // तारीख के हिसाब से सॉर्ट करें (नई से पुरानी)
        const sortedReports = allReports.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        if (sortedReports.length === 0) {
            diaryCards.innerHTML = `
                <div class="empty-diary">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Daily Reports Yet</h3>
                    <p>Your daily reports will appear here automatically.</p>
                    <p>Set up routine tasks to start tracking your progress.</p>
                </div>
            `;
            return;
        }
        
        // स्टेट्स कैलकुलेट करें
        const stats = this.calculateReportStats(sortedReports);
        
        // स्टेट्स दिखाएं
        if (reportStats) {
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
        
        // कार्ड्स बनाएं
        let html = '';
        sortedReports.forEach(report => {
            const reportDate = new Date(report.date);
            const dateStr = this.formatDate(reportDate);
            const statusColor = this.getStatusColor(report.status);
            const statusIcon = this.getStatusIcon(report.status);
            
            html += `
                <div class="report-card ${report.status}" onclick="reportCardManager.openReportCardModal('${report.date}')">
                    <div class="report-card-marks ${report.status}"></div>
                    <div class="report-card-header">
                        <h3 class="report-card-title">
                            <i class="fas fa-chart-bar" style="color: ${statusColor}"></i> 
                            ${dateStr}
                        </h3>
                        <div class="report-card-date">${this.getDayName(reportDate)}</div>
                    </div>
                    <div class="report-card-content">
                        ${report.totalTasks > 0 ? 
                            `<p>Completed <strong>${report.completedTasks}/${report.totalTasks}</strong> routine tasks</p>
                             <p>Completion rate: <strong>${report.percentage}%</strong></p>` :
                            `<p>No routine tasks set for this day</p>`
                        }
                    </div>
                    <div class="report-card-footer">
                        <span class="task-status-badge ${report.status}">
                            ${report.status.toUpperCase()}
                        </span>
                        <span class="completion-rate">
                            ${report.totalTasks > 0 ? `${report.percentage}% completed` : 'No tasks'}
                        </span>
                    </div>
                </div>
            `;
        });
        
        diaryCards.innerHTML = html;
    }

    // रिपोर्ट स्टेट्स कैलकुलेट करें
    calculateReportStats(reports) {
        let totalDays = reports.length;
        let totalCompletion = 0;
        let excellentDays = 0;
        let goodDays = 0;
        let averageDays = 0;
        let poorDays = 0;
        let emptyDays = 0;
        
        reports.forEach(report => {
            totalCompletion += report.percentage;
            
            switch(report.status) {
                case 'excellent': excellentDays++; break;
                case 'good': goodDays++; break;
                case 'average': averageDays++; break;
                case 'poor': poorDays++; break;
                case 'empty': emptyDays++; break;
            }
        });
        
        const averageCompletion = totalDays > 0 ? Math.round(totalCompletion / totalDays) : 0;
        
        return {
            totalDays,
            averageCompletion,
            excellentDays,
            goodDays,
            averageDays,
            poorDays,
            emptyDays
        };
    }

    // रिपोर्ट कार्ड मोडल खोलें
    openReportCardModal(dateStr) {
        const modal = document.getElementById('report-card-modal');
        const reportDate = document.getElementById('report-card-date');
        const summaryDiv = document.getElementById('report-card-summary');
        const tasksDiv = document.getElementById('report-card-tasks');
        const notesDiv = document.getElementById('report-card-notes');
        
        if (!modal) return;
        
        // रिपोर्ट प्राप्त करें या बनाएं
        let report = this.dailyReports[dateStr];
        if (!report) {
            report = this.createDailyReport(new Date(dateStr));
        }
        
        if (!report) return;
        
        const date = new Date(dateStr);
        const dateFormatted = this.formatDate(date);
        const dayName = this.getDayName(date);
        
        // तारीख सेट करें
        reportDate.textContent = `${dateFormatted} (${dayName})`;
        
        // सारांश सेक्शन
        const statusColor = this.getStatusColor(report.status);
        summaryDiv.innerHTML = `
            <div class="report-summary" style="border-left: 4px solid ${statusColor}; padding-left: 12px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 8px; color: #202124;">
                    <i class="fas fa-chart-pie" style="color: ${statusColor}"></i> 
                    Daily Summary
                </h4>
                <p style="margin-bottom: 5px; color: #5f6368;">
                    <strong>Status:</strong> 
                    <span style="color: ${statusColor}; font-weight: 600;">${report.status.toUpperCase()}</span>
                </p>
                <p style="margin-bottom: 5px; color: #5f6368;">
                    <strong>Completion Rate:</strong> 
                    <span style="font-weight: 600;">${report.percentage}%</span>
                    (${report.completedTasks} of ${report.totalTasks} tasks)
                </p>
                <p style="color: #5f6368;">
                    <strong>Report Generated:</strong> 
                    ${new Date(report.createdAt).toLocaleDateString()}
                </p>
            </div>
        `;
        
        // टास्क्स सेक्शन
        if (report.tasks && report.tasks.length > 0) {
            tasksDiv.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #202124;">
                    <i class="fas fa-tasks"></i> Task Completion
                </h4>
                <ul style="list-style-type: none; padding-left: 0;">
                    ${report.tasks.map(task => `
                        <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: flex-start;">
                            <span style="margin-right: 10px; font-size: 16px;">
                                ${task.completed ? '✅' : '❌'}
                            </span>
                            <div>
                                <div style="font-weight: ${task.completed ? '500' : '600'}; 
                                           color: ${task.completed ? '#5f6368' : '#202124'};
                                           ${task.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                                    ${task.title}
                                </div>
                                ${task.notes ? `<div style="font-size: 12px; color: #9aa0a6; margin-top: 2px;">${task.notes}</div>` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            tasksDiv.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #202124;">
                    <i class="fas fa-tasks"></i> Task Completion
                </h4>
                <p style="color: #9aa0a6; font-style: italic;">
                    No routine tasks were set for this day.
                </p>
            `;
        }
        
        // नोट्स सेक्शन (डायरी एंट्री से)
        const diaryEntry = calendar.getDiaryEntryForDate(new Date(dateStr));
        if (diaryEntry) {
            notesDiv.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #202124;">
                    <i class="fas fa-sticky-note"></i> Additional Notes
                </h4>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #1a73e8;">
                    <h5 style="margin-top: 0; color: #1a73e8;">${diaryEntry.title}</h5>
                    <p style="color: #5f6368; white-space: pre-wrap; line-height: 1.5;">${diaryEntry.content}</p>
                    <div style="font-size: 12px; color: #9aa0a6; margin-top: 10px;">
                        Last updated: ${new Date(diaryEntry.updatedAt).toLocaleString()}
                    </div>
                </div>
            `;
        } else {
            notesDiv.innerHTML = `
                <h4 style="margin-bottom: 15px; color: #202124;">
                    <i class="fas fa-sticky-note"></i> Additional Notes
                </h4>
                <p style="color: #9aa0a6; font-style: italic;">
                    No additional notes for this day.
                </p>
            `;
        }
        
        // मोडल खोलें
        modal.classList.add('active');
    }

    closeReportCardModal() {
        const modal = document.getElementById('report-card-modal');
        if (modal) modal.classList.remove('active');
    }

    // टास्क लिस्ट बदलने पर सभी रिपोर्ट्स अपडेट करें
    updateAllReportsOnTaskChange() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // सभी मौजूदा रिपोर्ट डेट्स
        const reportDates = Object.keys(this.dailyReports);
        
        reportDates.forEach(dateStr => {
            const reportDate = new Date(dateStr);
            reportDate.setHours(0, 0, 0, 0);
            
            // सिर्फ पिछली तारीखों की रिपोर्ट्स अपडेट करें
            if (reportDate <= today) {
                this.updateReportForDate(dateStr);
            }
        });
        
        // GitHub सिंक
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
    }

    // किसी खास तारीख की रिपोर्ट अपडेट करें
    updateReportForDate(dateStr) {
        const taskStats = this.getTaskCompletionStats(dateStr);
        
        if (this.dailyReports[dateStr]) {
            // एक्सिस्टिंग रिपोर्ट अपडेट करें
            this.dailyReports[dateStr] = {
                ...this.dailyReports[dateStr],
                tasks: taskStats.tasks,
                completedTasks: taskStats.completedTasks,
                totalTasks: taskStats.totalTasks,
                percentage: taskStats.percentage,
                status: this.getStatusFromPercentage(taskStats.percentage),
                updatedAt: new Date().toISOString()
            };
        } else {
            // नई रिपोर्ट बनाएं
            this.createDailyReport(new Date(dateStr));
        }
        
        this.saveToLocalStorage();
        
        // व्यू अपडेट करें
        this.updateReportCardView();
    }

    // टास्क कम्प्लीशन बदलने पर रिपोर्ट अपडेट करें
    onTaskCompletionChanged(dateStr) {
        this.updateReportForDate(dateStr);
    }

    // डेटा फॉर्मेटिंग हेल्पर फंक्शन्स
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    // लोकल स्टोरेज में सेव करें
    saveToLocalStorage() {
        localStorage.setItem('dailyReports', JSON.stringify(this.dailyReports));
        localStorage.setItem('taskSnapshots', JSON.stringify(this.taskSnapshots));
    }

    // GitHub बैकअप के लिए डेटा प्राप्त करें
    getBackupData() {
        return {
            dailyReports: this.dailyReports,
            taskSnapshots: this.taskSnapshots
        };
    }

    // GitHub से डेटा रिस्टोर करें
    restoreFromBackup(data) {
        if (data.dailyReports) {
            this.dailyReports = data.dailyReports;
        }
        if (data.taskSnapshots) {
            this.taskSnapshots = data.taskSnapshots;
        }
        this.saveToLocalStorage();
        this.updateReportCardView();
    }
}

// ग्लोबल रिपोर्ट कार्ड मैनेजर
document.addEventListener('DOMContentLoaded', () => {
    window.reportCardManager = new ReportCardManager();
});
