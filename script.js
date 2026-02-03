// script.js - अपडेटेड मुख्य एप्लिकेशन लॉजिक (नए UI के साथ)

document.addEventListener('DOMContentLoaded', function() {
    // DOM एलिमेंट्स
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('overlay');
    const todayBtn = document.getElementById('today-btn');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const searchBarContainer = document.getElementById('search-bar-container');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const closeSearch = document.getElementById('close-search');
    const viewOptions = document.querySelectorAll('.view-option');
    
    // इनिशियलाइज़ेशन
    function init() {
        // कैलेंडर सेटअप
        calendar.updateCalendar();
        
        // इवेंट लिसनर्स
        setupEventListeners();
        
        // डिफॉल्ट व्यू सेट करें
        switchView('month');
        
        // सर्च बार को शुरू में छुपाएं
        hideSearchBar();
    }
    
    // इवेंट लिसनर्स सेटअप
    function setupEventListeners() {
        // साइडबार टॉगल
        menuToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // महीने नेविगेशन
        prevMonthBtn.addEventListener('click', () => {
            calendar.prevMonth();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            calendar.nextMonth();
        });
        
        // आज की तारीख
        todayBtn.addEventListener('click', () => {
            calendar.goToToday();
        });
        
        // व्यू स्विच
        viewOptions.forEach(option => {
            option.addEventListener('click', function() {
                // एक्टिव क्लास रिमूव करें
                viewOptions.forEach(opt => opt.classList.remove('active'));
                // क्लिक किए गए ऑप्शन को एक्टिव करें
                this.classList.add('active');
                
                // व्यू बदलें
                const viewType = this.getAttribute('data-view');
                switchView(viewType);
                
                // मोबाइल पर मेनू ऑटो क्लोज
                if (window.innerWidth < 768) {
                    closeSidebar();
                }
            });
        });
        
        // सर्च आइकन क्लिक
        searchIconBtn.addEventListener('click', toggleSearchBar);
        
        // सर्च बार क्लोज बटन
        closeSearch.addEventListener('click', hideSearchBar);
        
        // सर्च इनपुट हैंडलर
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', handleSearchFocus);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // डॉक्यूमेंट पर क्लिक करने पर सर्च रिजल्ट्स हाइड करें
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar-container') && 
                !e.target.closest('.search-icon-btn')) {
                hideSearchResults();
            }
        });
        
        // मोबाइल स्वाइप जेस्चर (महीने बदलने के लिए)
        setupSwipeGestures();
        
        // कीबोर्ड शॉर्टकट
        setupKeyboardShortcuts();
    }
    
    // साइडबार टॉगल
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    // सर्च बार टॉगल
    function toggleSearchBar() {
        if (searchBarContainer.style.display === 'flex') {
            hideSearchBar();
        } else {
            showSearchBar();
        }
    }
    
    function showSearchBar() {
        searchBarContainer.style.display = 'flex';
        searchInput.focus();
        
        // अगर सर्च में कुछ है तो रिजल्ट्स दिखाएं
        if (searchInput.value.trim().length >= 2) {
            handleSearchFocus();
        }
    }
    
    function hideSearchBar() {
        searchBarContainer.style.display = 'none';
        searchInput.value = '';
        hideSearchResults();
    }
    
    // व्यू बदलना
    function switchView(viewType) {
        const calendarView = document.getElementById('calendar-view');
        const remindersView = document.getElementById('reminders-view');
        const diaryView = document.getElementById('diary-view');
        
        // सभी व्यू छिपाएं
        calendarView.style.display = 'none';
        remindersView.style.display = 'none';
        diaryView.style.display = 'none';
        
        // चयनित व्यू दिखाएं
        if (viewType === 'month') {
            calendarView.style.display = 'flex';
            calendar.updateCalendar();
        } else if (viewType === 'reminders') {
            remindersView.style.display = 'block';
            eventsManager.updateRemindersList();
        } else if (viewType === 'diary') {
            diaryView.style.display = 'block';
            // रिपोर्ट कार्ड व्यू अपडेट करें
            if (reportCardManager) {
                reportCardManager.updateReportCardView();
            } else {
                diaryManager.updateDiaryView();
            }
        }
    }
    
    // सर्च हैंडलर
    function handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        performSearch();
    }
    
    function handleSearchFocus() {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            performSearch();
        }
    }
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query.length < 2) return;
        
        const results = calendar.search(query);
        showSearchResults(results);
    }
    
    // सर्च रिजल्ट्स दिखाएं
    function showSearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item">
                    <div class="search-result-title">No results found</div>
                    <div class="search-result-date">Try different keywords</div>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            const date = new Date(result.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            let icon, typeText;
            if (result.type === 'event') {
                icon = 'fas fa-calendar';
                typeText = 'Event';
            } else if (result.type === 'diary') {
                icon = 'fas fa-book';
                typeText = 'Diary Entry';
            } else if (result.type === 'holiday') {
                icon = 'fas fa-flag';
                typeText = 'Holiday';
            } else {
                icon = 'fas fa-calendar';
                typeText = 'Event';
            }
            
            resultItem.innerHTML = `
                <div class="search-result-title">
                    <i class="${icon}"></i> ${result.title}
                </div>
                <div class="search-result-date">${dateStr} • ${typeText}</div>
            `;
            
            resultItem.addEventListener('click', () => {
                // उस तारीख पर जाएं
                const date = new Date(result.date);
                calendar.currentDate = date;
                calendar.updateCalendar();
                
                // सर्च बार छुपाएं
                hideSearchBar();
                
                // मासिक व्यू पर स्विच करें
                switchView('month');
                
                // तारीख हाइलाइट करें
                highlightDate(result.date);
                
                // त्योहार/इवेंट डिटेल मोडल खोलें
                setTimeout(() => {
                    calendar.openHolidayEventModal(date);
                }, 100);
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.style.display = 'block';
    }
    
    // तारीख हाइलाइट करें
    function highlightDate(dateStr) {
        // पहले की हाइलाइट हटाएं
        document.querySelectorAll('.calendar-day.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // नई तारीख हाइलाइट करें
        const dayElement = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
        if (dayElement) {
            dayElement.classList.add('highlighted');
            
            // 3 सेकंड बाद हाइलाइट हटाएं
            setTimeout(() => {
                dayElement.classList.remove('highlighted');
            }, 3000);
        }
    }
    
    // सर्च रिजल्ट्स छिपाएं
    function hideSearchResults() {
        searchResults.style.display = 'none';
    }
    
    // मोबाइल स्वाइप जेस्चर
    function setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        
        document.addEventListener('touchend', function(e) {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            const swipeThreshold = 50;
            
            // सिर्फ होरिजॉन्टल स्वाइप (vertical swipe नहीं)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
                if (diffX > 0) {
                    // दाएं से बाएं स्वाइप - अगला महीना
                    calendar.nextMonth();
                } else {
                    // बाएं से दाएं स्वाइप - पिछला महीना
                    calendar.prevMonth();
                }
            }
        });
    }
    
    // कीबोर्ड शॉर्टकट
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // सर्च शॉर्टकट (Ctrl/Cmd + F)
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                showSearchBar();
            }
            
            // सर्च कैंसल (Escape)
            if (e.key === 'Escape' && searchBarContainer.style.display === 'flex') {
                hideSearchBar();
            }
            
            // साइडबार टॉगल (Ctrl/Cmd + B)
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
            
            // महीने नेविगेशन (Arrow Keys)
            if (!e.ctrlKey && !e.metaKey) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    calendar.prevMonth();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    calendar.nextMonth();
                } else if (e.key === 't') {
                    e.preventDefault();
                    calendar.goToToday();
                }
            }
        });
    }
    
    // विंडो रिसाइज हैंडलर
    window.addEventListener('resize', function() {
        // मोबाइल पर साइडबार ऑटो क्लोज
        if (window.innerWidth >= 768 && sidebar.classList.contains('active')) {
            closeSidebar();
        }
        
        // सर्च बार को रिस्पॉन्सिव बनाएं
        if (window.innerWidth < 480) {
            // मोबाइल पर टोडे बटन में सिर्फ आइकन
            document.querySelector('.today-text').style.display = 'none';
        } else {
            document.querySelector('.today-text').style.display = 'inline';
        }
    });
    
    // स्क्रॉल व्यवहार
    function setupScrollBehavior() {
        const calendarGrid = document.getElementById('calendar-grid');
        
        // कैलेंडर में होरिजॉन्टल स्क्रॉल रोकें
        calendarGrid.addEventListener('wheel', (e) => {
            // सिर्फ vertical scroll allow करें
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // कैलेंडर को टच डिवाइस पर बेहतर बनाएं
        calendarGrid.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                // सिंगल टच - vertical scroll allow करें
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // एप्लिकेशन शुरू करें
    init();
    setupScrollBehavior();
    
    // ग्लोबल फंक्शन्स (रिपोर्ट कार्ड व्यू के लिए)
    window.openReportCardView = function(dateStr) {
        if (reportCardManager) {
            reportCardManager.openReportCardModal(dateStr);
        }
    };
    
    window.switchToMonthView = function() {
        switchView('month');
    };
});


// ================================
// नए कीबोर्ड शॉर्टकट और ग्लोबल फंक्शन्स
// ================================

// GitHub सिंक के लिए कीबोर्ड शॉर्टकट
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S = मैनुअल बैकअप
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (githubSync) {
            githubSync.manualBackup();
            calendar.showNotification('Manual backup started...', 'info');
        }
    }
    
    // Ctrl/Cmd + Shift + R = बैकअप से रिस्टोर
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (githubSync && confirm('Restore data from backup? This will replace current data.')) {
            githubSync.syncFromGist();
        }
    }
});

// ग्लोबल फंक्शन्स (डेवलपर उपयोग के लिए)
window.triggerManualBackup = function() {
    if (githubSync) {
        githubSync.manualBackup();
    } else {
        console.error('GitHub Sync not available');
    }
};

window.restoreFromBackup = function() {
    if (githubSync) {
        if (confirm('Restore data from backup? This will replace current data.')) {
            githubSync.syncFromGist();
        }
    } else {
        console.error('GitHub Sync not available');
    }
};

window.exportBackupData = function() {
    if (githubSync) {
        githubSync.exportBackupData();
    } else {
        console.error('GitHub Sync not available');
    }
};

window.checkBackupStatus = async function() {
    if (githubSync) {
        const status = await githubSync.checkBackupStatus();
        console.log('Backup Status:', status);
        
        if (status.exists) {
            calendar.showNotification(`Backup exists (Last updated: ${new Date(status.lastUpdated).toLocaleDateString()})`, 'info');
        } else {
            calendar.showNotification('No backup found', 'warning');
        }
        
        return status;
    } else {
        console.error('GitHub Sync not available');
        return { exists: false };
    }
};

// ऐप स्टार्टअप पर ऑटो चेक
setTimeout(() => {
    if (githubSync && githubSync.githubToken && githubSync.gistId) {
        // पहली बार ऐप खोलने पर साइलेंट चेक
        githubSync.checkBackupStatus().then(status => {
            if (status.exists) {
                console.log('Backup available:', status.lastUpdated);
            }
        });
    }
}, 3000);

// रिपोर्ट कार्ड व्यू अपडेट के लिए ग्लोबल फंक्शन
window.updateReportCardView = function() {
    if (window.reportCardManager) {
        window.reportCardManager.updateReportCardView();
    }
};

window.openReportCardForDate = function(dateStr) {
    if (window.reportCardManager) {
        window.reportCardManager.openReportCardModal(dateStr);
    }
};

// डेबग फंक्शन्स (डेवलपमेंट के लिए)
window.showAppDataInfo = function() {
    const info = {
        events: calendar.events.length,
        tasks: calendar.routineTasks.length,
        diaryEntries: calendar.diaryEntries.length,
        taskCompletions: calendar.taskCompletions.length,
        reports: window.reportCardManager ? Object.keys(window.reportCardManager.dailyReports).length : 0,
        localStorage: {
            calendarEvents: localStorage.getItem('calendarEvents')?.length || 0,
            routineTasks: localStorage.getItem('routineTasks')?.length || 0,
            diaryEntries: localStorage.getItem('diaryEntries')?.length || 0,
            taskCompletions: localStorage.getItem('taskCompletions')?.length || 0,
            dailyReports: localStorage.getItem('dailyReports')?.length || 0
        }
    };
    
    console.log('App Data Info:', info);
    alert(`App Data Info:
Events: ${info.events}
Tasks: ${info.tasks}
Diary Entries: ${info.diaryEntries}
Task Completions: ${info.taskCompletions}
Daily Reports: ${info.reports}
GitHub Sync: ${githubSync ? 'Available' : 'Not available'}`);
};

// ऐप परफॉर्मेंस मॉनिटरिंग
let appStartTime = new Date();
window.addEventListener('load', () => {
    const loadTime = new Date() - appStartTime;
    console.log(`App loaded in ${loadTime}ms`);
    
    // परफॉर्मेंस डेटा लोकल स्टोरेज में सेव करें
    const perfData = JSON.parse(localStorage.getItem('appPerformance') || '[]');
    perfData.push({
        timestamp: new Date().toISOString(),
        loadTime: loadTime,
        userAgent: navigator.userAgent
    });
    
    // सिर्फ आखिरी 10 रिकॉर्ड्स रखें
    if (perfData.length > 10) {
        perfData.splice(0, perfData.length - 10);
    }
    
    localStorage.setItem('appPerformance', JSON.stringify(perfData));
});
