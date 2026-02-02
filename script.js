// script.js - मुख्य एप्लिकेशन लॉजिक

document.addEventListener('DOMContentLoaded', function() {
    // DOM एलिमेंट्स
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('overlay');
    const todayBtn = document.getElementById('today-btn');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const viewOptions = document.querySelectorAll('.view-option');
    const timeDisplay = document.getElementById('time-display');
    
    // इनिशियलाइज़ेशन
    function init() {
        // कैलेंडर सेटअप
        calendar.updateCalendar();
        
        // टाइम अपडेट
        updateTime();
        setInterval(updateTime, 60000);
        
        // इवेंट लिसनर्स
        setupEventListeners();
        
        // डिफॉल्ट व्यू सेट करें
        switchView('month');
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
        
        // सर्च फंक्शन
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', handleSearchFocus);
        
        // मोबाइल स्वाइप जेस्चर
        setupSwipeGestures();
        
        // डॉक्यूमेंट पर क्लिक करने पर सर्च रिजल्ट्स हाइड करें
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar')) {
                hideSearchResults();
            }
        });
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
            calendarView.style.display = 'block';
            calendar.updateCalendar();
        } else if (viewType === 'reminders') {
            remindersView.style.display = 'block';
            eventsManager.updateRemindersList();
        } else if (viewType === 'diary') {
            diaryView.style.display = 'block';
            diaryManager.updateDiaryView();
        }
    }
    
    // सर्च हैंडलर
    function handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        const results = calendar.search(query);
        showSearchResults(results);
    }
    
    function handleSearchFocus() {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            const results = calendar.search(query);
            showSearchResults(results);
        }
    }
    
    // सर्च रिजल्ट्स दिखाएं
    function showSearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.style.display = 'none';
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
                
                // सर्च रिजल्ट्स छिपाएं
                hideSearchResults();
                searchInput.value = '';
                
                // मासिक व्यू पर स्विच करें
                switchView('month');
                
                // तारीख हाइलाइट करें
                highlightDate(result.date);
                
                // टास्क मोडल खोलें (अगर त्योहार नहीं है)
                if (result.type !== 'holiday') {
                    calendar.openTaskModal(date);
                }
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
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', function(e) {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            const swipeThreshold = 50;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // दाएं से बाएं स्वाइप - अगला महीना
                    calendar.nextMonth();
                } else {
                    // बाएं से दाएं स्वाइप - पिछला महीना
                    calendar.prevMonth();
                }
            }
        });
    }
    
    // टाइम अपडेट
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;
    }
    
    // एप्लिकेशन शुरू करें
    init();
});