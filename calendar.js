// calendar.js - अपडेटेड (नए तारीख क्लिक व्यवहार के साथ)

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        this.tasks = JSON.parse(localStorage.getItem('calendarTasks') || '[]');
        this.diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
        this.routineTasks = JSON.parse(localStorage.getItem('routineTasks') || '[]');
        this.taskCompletions = JSON.parse(localStorage.getItem('taskCompletions') || '[]');
        
        // त्योहार फिल्टर
        this.showFestivals = true;
        this.showCISF = true;
        
        // डायरी सेव बटन के लिए लिसनर यहाँ सेट करें
        this.initTaskModalListeners();
        this.initHolidayFilters();
        this.initHolidayEventModalListeners();
    }

    // त्योहार/इवेंट मोडल लिसनर्स
    initHolidayEventModalListeners() {
        // मोडल क्लोज बटन
        document.getElementById('close-holiday-event-modal').addEventListener('click', () => {
            this.closeHolidayEventModal();
        });
        
        document.getElementById('close-holiday-event-view').addEventListener('click', () => {
            this.closeHolidayEventModal();
        });
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('holiday-event-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('holiday-event-modal')) {
                this.closeHolidayEventModal();
            }
        });
        
        // मोडल से इवेंट एड बटन
        document.getElementById('add-event-from-modal').addEventListener('click', () => {
            this.closeHolidayEventModal();
            this.openEventModal(this.selectedDate);
        });
        
        document.getElementById('add-event-from-detail').addEventListener('click', () => {
            this.closeHolidayEventModal();
            this.openEventModal(this.selectedDate);
        });
    }

    // त्योहार फिल्टर लिसनर्स
    initHolidayFilters() {
        // त्योहार फिल्टर बटन
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('toggle-festivals').addEventListener('click', () => {
                this.showFestivals = !this.showFestivals;
                document.getElementById('toggle-festivals').classList.toggle('active');
                this.updateCalendar();
            });
            
            document.getElementById('toggle-cisf').addEventListener('click', () => {
                this.showCISF = !this.showCISF;
                document.getElementById('toggle-cisf').classList.toggle('active');
                this.updateCalendar();
            });
        });
    }

    // टास्क मोडल लिसनर्स इनिशियलाइज़ करें
    initTaskModalListeners() {
        // डायरी एंट्री सेव बटन
        document.getElementById('save-diary-entry').addEventListener('click', () => {
            this.saveDiaryEntryFromModal();
        });
        
        // टास्क मोडल क्लोज बटन
        document.getElementById('cancel-task').addEventListener('click', () => {
            this.closeTaskModal();
        });
        
        document.getElementById('close-task-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('task-modal')) {
                this.closeTaskModal();
            }
        });
    }

    // महीने का कैलेंडर जेनरेट करें
    generateCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // महीने का पहला दिन
        const firstDay = new Date(year, month, 1);
        // महीने का आखिरी दिन
        const lastDay = new Date(year, month + 1, 0);
        // महीने में दिनों की संख्या
        const daysInMonth = lastDay.getDate();
        // पहले दिन का सप्ताह दिवस (0 = रविवार, 1 = सोमवार, ...)
        const firstDayOfWeek = firstDay.getDay();

        // पिछले महीने के दिन
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // पिछले महीने के दिन जोड़ें
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            calendarGrid.appendChild(this.createDayElement(date, 'other-month'));
        }

        // इस महीने के दिन जोड़ें
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = 
                day === today.getDate() && 
                month === today.getMonth() && 
                year === today.getFullYear();
            
            const className = isToday ? 'today' : '';
            calendarGrid.appendChild(this.createDayElement(date, className));
        }

        // अगले महीने के दिन जोड़ें
        const totalCells = 42; // 6 सप्ताह * 7 दिन
        const cellsFilled = firstDayOfWeek + daysInMonth;
        const nextMonthDays = totalCells - cellsFilled;

        for (let day = 1; day <= nextMonthDays; day++) {
            const date = new Date(year, month + 1, day);
            calendarGrid.appendChild(this.createDayElement(date, 'other-month'));
        }
    }

    // दिन का एलिमेंट बनाएं (त्योहारों के नाम के साथ)
    createDayElement(date, className) {
        const dayElement = document.createElement('div');
        
        // तारीख पर क्लिक व्यवहार तय करें
        const hasHoliday = this.hasHolidayOnDate(date);
        const hasEvent = this.hasEventOnDate(date);
        
        if (hasHoliday || hasEvent || date <= new Date()) {
            // त्योहार/इवेंट है या पिछली/आज की तारीख - क्लिक करने योग्य
            dayElement.className = `calendar-day ${className} clickable`;
            dayElement.addEventListener('click', () => {
                this.handleDateClick(date);
            });
        } else {
            // भविष्य की तारीख और कोई त्योहार/इवेंट नहीं - नॉन-क्लिकेबल
            dayElement.className = `calendar-day ${className} non-clickable`;
        }
        
        dayElement.dataset.date = date.toISOString().split('T')[0];

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        // त्योहार काउंट बैज जोड़ें
        if (hasHoliday || hasEvent) {
            const holidayCount = this.getHolidayEventCount(date);
            if (holidayCount > 0) {
                const countBadge = document.createElement('span');
                countBadge.className = 'holiday-count-badge';
                countBadge.textContent = holidayCount;
                dayNumber.appendChild(countBadge);
            }
        }

        dayElement.appendChild(dayNumber);

        // इस दिन के त्योहार दिखाएं (नाम के साथ)
        this.addHolidaysToDay(dayElement, date);

        // इस दिन के इवेंट्स दिखाएं
        const events = this.getEventsForDate(date);
        if (events.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            // अधिकतम 2 इवेंट्स दिखाएं (त्योहारों के लिए जगह बचाने के लिए)
            const maxEvents = Math.min(events.length, 2);
            for (let i = 0; i < maxEvents; i++) {
                const event = events[i];
                const eventElement = document.createElement('div');
                eventElement.className = 'day-event';
                eventElement.textContent = event.title;
                eventElement.title = `${event.title}${event.time ? ` at ${event.time}` : ''}`;
                eventsContainer.appendChild(eventElement);
            }
            
            // अगर 2 से अधिक इवेंट्स हैं तो "+ more" दिखाएं
            if (events.length > 2) {
                const moreElement = document.createElement('div');
                moreElement.className = 'day-event-more';
                moreElement.textContent = `+${events.length - 2} more`;
                moreElement.title = `${events.length - 2} more events`;
                eventsContainer.appendChild(moreElement);
            }
            
            dayElement.appendChild(eventsContainer);
            dayElement.classList.add('has-event');
        }

        return dayElement;
    }

    // तारीख पर त्योहार/इवेंट की संख्या प्राप्त करें
    getHolidayEventCount(date) {
        let count = 0;
        
        // त्योहार गिनें
        if (window.holidaysManager) {
            const holidays = holidaysManager.getHolidaysForDate(date);
            if (this.showFestivals) count += holidays.festivals.length;
            if (this.showCISF) count += holidays.cisfHolidays.length;
        }
        
        // इवेंट्स गिनें
        count += this.getEventsForDate(date).length;
        
        return count;
    }

    // तारीख पर त्योहार है या नहीं
    hasHolidayOnDate(date) {
        if (!window.holidaysManager) return false;
        
        const holidays = holidaysManager.getHolidaysForDate(date);
        const hasFestival = this.showFestivals && holidays.festivals.length > 0;
        const hasCISF = this.showCISF && holidays.cisfHolidays.length > 0;
        
        return hasFestival || hasCISF;
    }

    // तारीख पर इवेंट है या नहीं
    hasEventOnDate(date) {
        return this.getEventsForDate(date).length > 0;
    }

    // दिन में त्योहार जोड़ें (नाम के साथ)
    addHolidaysToDay(dayElement, date) {
        if (!window.holidaysManager || !this.showFestivals && !this.showCISF) return;
        
        const holidays = holidaysManager.getHolidaysForDate(date);
        const hasFestival = holidays.festivals.length > 0;
        const hasCISF = holidays.cisfHolidays.length > 0;
        
        if ((hasFestival && this.showFestivals) || (hasCISF && this.showCISF)) {
            const holidayContainer = document.createElement('div');
            holidayContainer.className = 'day-holidays';
            
            // सभी त्योहारों को एक साथ दिखाएं
            let allHolidays = [];
            
            // सामान्य त्योहार जोड़ें
            if (hasFestival && this.showFestivals) {
                allHolidays = allHolidays.concat(holidays.festivals.map(h => ({...h, isCisf: false})));
                dayElement.classList.add('has-holiday');
            }
            
            // CISF के GH/RH जोड़ें
            if (hasCISF && this.showCISF) {
                allHolidays = allHolidays.concat(holidays.cisfHolidays.map(h => ({...h, isCisf: true})));
                dayElement.classList.add('has-cisf-holiday');
            }
            
            // अधिकतम 3 त्योहार दिखाएं (नाम के साथ)
            const maxHolidays = Math.min(allHolidays.length, 3);
            
            for (let i = 0; i < maxHolidays; i++) {
                const holiday = allHolidays[i];
                const holidayItem = this.createHolidayDisplay(holiday);
                holidayContainer.appendChild(holidayItem);
            }
            
            // अगर 3 से अधिक त्योहार हैं तो "+ more" दिखाएं
            if (allHolidays.length > 3) {
                const moreItem = document.createElement('div');
                moreItem.className = 'holiday-more';
                moreItem.innerHTML = `<span class="holiday-more-text">+${allHolidays.length - 3} more</span>`;
                holidayContainer.appendChild(moreItem);
            }
            
            // त्योहार टूलटिप जोड़ें (सभी त्योहारों की पूरी जानकारी के लिए)
            const tooltip = document.createElement('div');
            tooltip.innerHTML = holidaysManager.createHolidayTooltip(holidays);
            dayElement.appendChild(tooltip.firstChild);
            
            if (holidayContainer.children.length > 0) {
                dayElement.appendChild(holidayContainer);
            }
        }
    }

    // त्योहार दिखाने के लिए नया फंक्शन (नाम के साथ)
    createHolidayDisplay(holidayData) {
        const holiday = holidayData;
        const typeInfo = holidaysManager.getHolidayTypeColor(holiday);
        
        // त्योहार का संक्षिप्त नाम (पहले 2 शब्द)
        const nameWords = holiday.name.split(' ');
        let shortName = holiday.name;
        if (nameWords.length > 2) {
            shortName = nameWords.slice(0, 2).join(' ') + '...';
        }
        
        const holidayItem = document.createElement('div');
        holidayItem.className = holidayData.isCisf ? 'holiday-item-cisf' : 'holiday-item-normal';
        
        // त्योहार के प्रकार के आधार पर बैकग्राउंड कलर
        const bgColor = holidayData.isCisf ? 
            (holiday.type === 'GH' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(80, 227, 194, 0.1)') :
            (holiday.type === 'GH' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(6, 214, 160, 0.1)');
        
        holidayItem.style.backgroundColor = bgColor;
        holidayItem.style.borderLeft = holidayData.isCisf ? 'none' : `3px solid ${typeInfo.color}`;
        holidayItem.style.borderRight = holidayData.isCisf ? `3px solid ${typeInfo.color}` : 'none';
        
        holidayItem.innerHTML = `
            <span class="holiday-dot" style="background-color: ${typeInfo.color}"></span>
            <span class="holiday-name-short" title="${holiday.name} (${typeInfo.label})">${shortName}</span>
        `;
        
        return holidayItem;
    }

    // तारीख क्लिक करने पर (नया व्यवहार)
    handleDateClick(date) {
        this.selectedDate = date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        // त्योहार या इवेंट है या नहीं चेक करें
        const hasHoliday = this.hasHolidayOnDate(date);
        const hasEvent = this.hasEventOnDate(date);

        if (hasHoliday || hasEvent) {
            // त्योहार या इवेंट है - डिटेल व्यू दिखाएं
            this.openHolidayEventModal(date);
        } else if (selectedDate <= today) {
            // पिछली या आज की तारीख - टास्क मोडल दिखाएं
            this.openTaskModal(date);
        }
        // भविष्य की तारीख और कोई त्योहार/इवेंट नहीं - कोई एक्शन नहीं
    }

    // त्योहार/इवेंट डिटेल मोडल खोलें
    openHolidayEventModal(date) {
        const modal = document.getElementById('holiday-event-modal');
        const modalDate = document.getElementById('holiday-event-modal-date');
        const holidayList = document.getElementById('holiday-list');
        const eventList = document.getElementById('event-list');
        const noHolidayEvent = document.getElementById('no-holiday-event');
        
        // तारीख दिखाएं
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        modalDate.textContent = date.toLocaleDateString('hi-IN', options);
        
        // त्योहार लोड करें
        const holidays = holidaysManager ? holidaysManager.getHolidaysForDate(date) : { festivals: [], cisfHolidays: [] };
        holidayList.innerHTML = '';
        
        let holidayCount = 0;
        
        // सामान्य त्योहार दिखाएं
        if (this.showFestivals && holidays.festivals.length > 0) {
            holidays.festivals.forEach(holiday => {
                const holidayItem = this.createHolidayEventItem(holiday, false);
                holidayList.appendChild(holidayItem);
                holidayCount++;
            });
        }
        
        // CISF त्योहार दिखाएं
        if (this.showCISF && holidays.cisfHolidays.length > 0) {
            holidays.cisfHolidays.forEach(holiday => {
                const holidayItem = this.createHolidayEventItem(holiday, true);
                holidayList.appendChild(holidayItem);
                holidayCount++;
            });
        }
        
        // इवेंट्स लोड करें
        const events = this.getEventsForDate(date);
        eventList.innerHTML = '';
        
        let eventCount = 0;
        if (events.length > 0) {
            events.forEach(event => {
                const eventItem = this.createEventItem(event);
                eventList.appendChild(eventItem);
                eventCount++;
            });
        }
        
        // अगर कोई त्योहार या इवेंट नहीं है
        if (holidayCount === 0 && eventCount === 0) {
            noHolidayEvent.style.display = 'block';
            document.getElementById('holiday-section').style.display = 'none';
            document.getElementById('event-section').style.display = 'none';
        } else {
            noHolidayEvent.style.display = 'none';
            document.getElementById('holiday-section').style.display = holidayCount > 0 ? 'block' : 'none';
            document.getElementById('event-section').style.display = eventCount > 0 ? 'block' : 'none';
        }
        
        // मोडल खोलें
        modal.classList.add('active');
    }

    // त्योहार आइटम बनाएं (डिटेल व्यू के लिए)
    createHolidayEventItem(holiday, isCisf = false) {
        const typeInfo = holidaysManager.getHolidayTypeColor(holiday);
        
        const item = document.createElement('div');
        item.className = `holiday-event-item ${isCisf ? 'cisf-' : ''}${holiday.type.toLowerCase()}`;
        
        const icon = isCisf ? 'fa-shield-alt' : 'fa-flag';
        
        item.innerHTML = `
            <div class="holiday-event-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="holiday-event-content">
                <div class="holiday-event-title">
                    <span>${holiday.name}</span>
                    <span class="holiday-event-type ${isCisf ? 'cisf' : holiday.type.toLowerCase()}">
                        ${isCisf ? 'CISF ' : ''}${holiday.type}
                    </span>
                </div>
                <div class="holiday-event-details">
                    ${typeInfo.title}${isCisf ? ' (CISF)' : ''}
                </div>
            </div>
        `;
        
        return item;
    }

    // इवेंट आइटम बनाएं (डिटेल व्यू के लिए)
    createEventItem(event) {
        const item = document.createElement('div');
        item.className = 'holiday-event-item event';
        
        // डिलीट बटन
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'event-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete Event';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this event?')) {
                this.deleteEvent(event.id);
                this.openHolidayEventModal(this.selectedDate);
            }
        });
        
        item.innerHTML = `
            <div class="holiday-event-icon">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="holiday-event-content">
                <div class="holiday-event-title">
                    <span>${event.title}</span>
                    <span class="holiday-event-type event">EVENT</span>
                </div>
                <div class="holiday-event-details">
                    ${event.notes || 'No additional details'}
                </div>
                ${event.time ? `<div class="holiday-event-time">Time: ${event.time}</div>` : ''}
            </div>
        `;
        
        // डिलीट बटन जोड़ें
        item.querySelector('.holiday-event-content').appendChild(deleteBtn);
        
        return item;
    }

    // त्योहार/इवेंट मोडल बंद करें
    closeHolidayEventModal() {
        document.getElementById('holiday-event-modal').classList.remove('active');
    }

    // टास्क मोडल खोलें (सिर्फ वर्तमान/पिछली तारीख के लिए)
    openTaskModal(date) {
        const modal = document.getElementById('task-modal');
        const modalDate = document.getElementById('task-modal-date');
        const tasksList = document.getElementById('tasks-list');
        
        // तारीख दिखाएं
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        modalDate.textContent = date.toLocaleDateString('hi-IN', options);
        
        // रूटीन टास्क्स लोड करें
        const tasks = this.routineTasks;
        tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-tasks';
            emptyMsg.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <p>No routine tasks found</p>
                <small>Add routine tasks from the menu → "Add Routine Tasks"</small>
            `;
            tasksList.appendChild(emptyMsg);
        } else {
            tasks.forEach((task, index) => {
                const taskItem = this.createTaskItem(task, date);
                tasksList.appendChild(taskItem);
            });
        }
        
        // इस तारीख के लिए डायरी एंट्री लोड करें
        const diaryEntry = this.getDiaryEntryForDate(date);
        if (diaryEntry) {
            document.getElementById('diary-title-input').value = diaryEntry.title;
            document.getElementById('diary-content-input').value = diaryEntry.content;
        } else {
            document.getElementById('diary-title-input').value = '';
            document.getElementById('diary-content-input').value = '';
        }
        
        // मोडल खोलें
        modal.classList.add('active');
    }

    // टास्क आइटम बनाएं (रूटीन टास्क्स के लिए)
    createTaskItem(task, date) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        const taskCheck = document.createElement('div');
        taskCheck.className = 'task-check';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-${task.id}-${date.toISOString().split('T')[0]}`;
        
        // इस तारीख के लिए टास्क कम्प्लीशन स्टेटस चेक करें
        const dateStr = date.toISOString().split('T')[0];
        const completion = this.getTaskCompletion(task.id, dateStr);
        checkbox.checked = completion.completed;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);
        
        // पिछली तारीखों के टास्क्स को डिसेबल करें (सिर्फ देखने के लिए)
        if (currentDate < today) {
            checkbox.disabled = true;
            checkbox.title = "Cannot modify past date tasks";
        }
        
        // सिर्फ वर्तमान तारीख के टास्क्स चेक/अनचेक किए जा सकते हैं
        if (currentDate.getTime() === today.getTime()) {
            checkbox.addEventListener('change', () => {
                this.saveTaskCompletion(task.id, dateStr, checkbox.checked);
                
                // GitHub बैकअप करें
                if (githubSync && githubSync.autoSync) {
                    githubSync.autoBackup();
                }
            });
        } else if (currentDate > today) {
            // भविष्य की तारीखों के टास्क्स को डिसेबल करें
            checkbox.disabled = true;
            checkbox.title = "Cannot modify future date tasks";
        }
        
        taskCheck.appendChild(checkbox);
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('div');
        taskTitle.className = `task-title ${checkbox.checked ? 'task-completed' : ''}`;
        taskTitle.textContent = task.title;
        
        taskContent.appendChild(taskTitle);
        
        // टास्क नोट्स (अगर है तो)
        if (task.notes) {
            const taskNotes = document.createElement('div');
            taskNotes.className = 'task-notes';
            taskNotes.textContent = task.notes;
            taskContent.appendChild(taskNotes);
        }
        
        taskItem.appendChild(taskCheck);
        taskItem.appendChild(taskContent);
        
        return taskItem;
    }

    // टास्क मोडल बंद करें
    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    // डायरी एंट्री सेव करें (मोडल से)
    saveDiaryEntryFromModal() {
        const title = document.getElementById('diary-title-input').value.trim();
        const content = document.getElementById('diary-content-input').value.trim();
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        
        if (!title) {
            this.showNotification('Please enter diary entry title', 'error');
            return;
        }
        
        if (!content) {
            this.showNotification('Please write your experience', 'error');
            return;
        }
        
        const diaryEntry = {
            title: title,
            content: content,
            date: dateStr,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.saveDiaryEntry(diaryEntry);
        this.closeTaskModal();
    }

    // इवेंट मोडल खोलें (हैमबर्गर मेनू से)
    openEventModal(date = null) {
        const modal = document.getElementById('event-modal');
        const dateInput = document.getElementById('event-date-input');
        
        // तारीख सेट करें (अगर दी गई है)
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            dateInput.value = dateStr;
        } else {
            // डिफॉल्ट आज की तारीख
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // फॉर्म रीसेट करें
        document.getElementById('event-title-input').value = '';
        document.getElementById('event-time-input').value = '';
        document.getElementById('event-notes-input').value = '';
        
        // मोडल खोलें
        modal.classList.add('active');
        
        // साइडबार बंद करें
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        
        // टाइटल फोकस करें
        setTimeout(() => {
            document.getElementById('event-title-input').focus();
        }, 100);
    }

    // इवेंट डिलीट करें
    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.updateCalendar();
        this.showNotification('Event deleted successfully!', 'success');
        
        // GitHub बैकअप करें
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
    }

    // महीने बदलें
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateCalendar();
    }

    // आज की तारीख पर जाएं
    goToToday() {
        this.currentDate = new Date();
        this.updateCalendar();
    }

    // कैलेंडर अपडेट करें
    updateCalendar() {
        this.generateCalendar();
        this.updateMonthDisplay();
    }

    // महीने का नाम अपडेट करें
    updateMonthDisplay() {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        document.getElementById('current-month').textContent = `${monthName} ${year}`;
    }

    // तारीख के लिए इवेंट्स लोड करें
    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => event.date === dateStr);
    }

    // तारीख के लिए डायरी एंट्री लोड करें
    getDiaryEntryForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.diaryEntries.find(entry => entry.date === dateStr);
    }

    // रूटीन टास्क्स लोड करें (सभी दिनों के लिए)
    getRoutineTasks() {
        return this.routineTasks;
    }

    // टास्क कम्प्लीशन स्टेटस लोड करें
    getTaskCompletion(taskId, dateStr) {
        const completion = this.taskCompletions.find(
            comp => comp.taskId === taskId && comp.date === dateStr
        );
        return completion || { taskId, date: dateStr, completed: false };
    }

    // टास्क कम्प्लीशन सेव करें
    saveTaskCompletion(taskId, dateStr, completed) {
        const index = this.taskCompletions.findIndex(
            comp => comp.taskId === taskId && comp.date === dateStr
        );
        
        if (index > -1) {
            this.taskCompletions[index].completed = completed;
            this.taskCompletions[index].updatedAt = new Date().toISOString();
        } else {
            this.taskCompletions.push({
                taskId,
                date: dateStr,
                completed,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('taskCompletions', JSON.stringify(this.taskCompletions));
    }

    // इवेंट सेव करें
    saveEvent(eventData) {
        this.events.push(eventData);
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.updateCalendar();
        this.showNotification('Event saved successfully!', 'success');
        
        // GitHub बैकअप करें
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
    }
    // रूटीन टास्क्स सेव करें (मल्टीपल)
    saveRoutineTasks(taskList) {
        // पुराने टास्क्स के आईडी सेव करें
        const existingIds = this.routineTasks.map(task => task.id);
        
        // नए टास्क्स फिल्टर करें (जिनके आईडी नहीं हैं या नए हैं)
        const newTasks = taskList.filter(task => {
            return !existingIds.includes(task.id);
        });
        
        // एक्सिस्टिंग टास्क्स अपडेट करें
        const updatedTasks = taskList.filter(task => {
            return existingIds.includes(task.id);
        });
        
        // सभी टास्क्स अपडेट करें
        this.routineTasks = taskList;
        
        localStorage.setItem('routineTasks', JSON.stringify(this.routineTasks));
        
        const totalTasks = taskList.length;
        if (totalTasks > 0) {
            this.showNotification(`${totalTasks} routine tasks saved successfully!`, 'success');
            
            // GitHub बैकअप करें
            if (githubSync && githubSync.autoSync) {
                githubSync.autoBackup();
            }
        }
        
        return totalTasks;
    }

    // रूटीन टास्क डिलीट करें
    deleteRoutineTask(taskId) {
        const initialLength = this.routineTasks.length;
        this.routineTasks = this.routineTasks.filter(task => task.id !== taskId);
        
        // इस टास्क की सभी कम्प्लीशन हिस्ट्री भी डिलीट करें
        this.taskCompletions = this.taskCompletions.filter(comp => comp.taskId !== taskId);
        
        localStorage.setItem('routineTasks', JSON.stringify(this.routineTasks));
        localStorage.setItem('taskCompletions', JSON.stringify(this.taskCompletions));
        
        if (this.routineTasks.length < initialLength) {
            this.showNotification('Routine task deleted successfully!', 'success');
            
            // GitHub बैकअप करें
            if (githubSync && githubSync.autoSync) {
                githubSync.autoBackup();
            }
        }
    }

    // डायरी एंट्री सेव करें
    saveDiaryEntry(entryData) {
        const existingIndex = this.diaryEntries.findIndex(entry => entry.date === entryData.date);
        if (existingIndex > -1) {
            // एक्सिस्टिंग एंट्री को अपडेट करें (उसी कार्ड में)
            this.diaryEntries[existingIndex] = {
                ...this.diaryEntries[existingIndex],
                ...entryData,
                updatedAt: new Date().toISOString()
            };
        } else {
            // नई एंट्री बनाएं
            entryData.id = Date.now();
            entryData.createdAt = new Date().toISOString();
            entryData.updatedAt = new Date().toISOString();
            this.diaryEntries.push(entryData);
        }
        
        localStorage.setItem('diaryEntries', JSON.stringify(this.diaryEntries));
        this.showNotification('Diary entry saved successfully!', 'success');
        
        // GitHub बैकअप करें
        if (githubSync && githubSync.autoSync) {
            githubSync.autoBackup();
        }
        
        // डायरी व्यू अपडेट करें (अगर डायरी व्यू खुला है)
        if (diaryManager) {
            diaryManager.updateDiaryView();
        }
    }

    // सर्च करें
    search(query) {
        if (!query) return [];
        
        const results = [];
        const searchLower = query.toLowerCase();
        
        // इवेंट्स में सर्च
        this.events.forEach(event => {
            if (event.title.toLowerCase().includes(searchLower) || 
                (event.notes && event.notes.toLowerCase().includes(searchLower))) {
                results.push({
                    type: 'event',
                    title: event.title,
                    date: event.date,
                    data: event
                });
            }
        });
        
        // डायरी एंट्रीज में सर्च
        this.diaryEntries.forEach(entry => {
            if (entry.title.toLowerCase().includes(searchLower) || 
                entry.content.toLowerCase().includes(searchLower)) {
                results.push({
                    type: 'diary',
                    title: entry.title,
                    date: entry.date,
                    data: entry
                });
            }
        });
        
        // त्योहारों में सर्च
        if (holidaysManager && holidaysManager.holidays) {
            const currentYear = this.currentDate.getFullYear().toString();
            if (holidaysManager.holidays[currentYear]) {
                holidaysManager.holidays[currentYear].forEach(holiday => {
                    if (holiday.name.toLowerCase().includes(searchLower)) {
                        results.push({
                            type: 'holiday',
                            title: holiday.name,
                            date: holiday.date,
                            data: holiday
                        });
                    }
                });
            }
            
            // CISF त्योहारों में सर्च
            if (holidaysManager.cisfHolidays[currentYear]) {
                holidaysManager.cisfHolidays[currentYear].forEach(holiday => {
                    if (holiday.name.toLowerCase().includes(searchLower)) {
                        results.push({
                            type: 'holiday',
                            title: holiday.name + ' (CISF)',
                            date: holiday.date,
                            data: holiday
                        });
                    }
                });
            }
        }
        
        return results;
    }

    // नोटिफिकेशन दिखाएं
    showNotification(message, type = 'info') {
        // पहले की नोटिफिकेशन हटाएं
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3 सेकंड बाद हटाएं
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// ग्लोबल कैलेंडर इंस्टेंस
window.calendar = new Calendar();
