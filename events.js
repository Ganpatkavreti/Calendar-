// events.js - इवेंट्स फंक्शनलिटी

class EventsManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // इवेंट मोडल के बटन्स
        document.getElementById('save-event').addEventListener('click', () => this.saveEvent());
        document.getElementById('cancel-event').addEventListener('click', () => this.closeEventModal());
        document.getElementById('close-event-modal').addEventListener('click', () => this.closeEventModal());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('event-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('event-modal')) {
                this.closeEventModal();
            }
        });
        
        // एंटर की दबाने पर सेव करें
        document.getElementById('event-title-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEvent();
            }
        });
    }

    saveEvent() {
        const title = document.getElementById('event-title-input').value.trim();
        const date = document.getElementById('event-date-input').value;
        const time = document.getElementById('event-time-input').value;
        const notes = document.getElementById('event-notes-input').value.trim();

        if (!title) {
            calendar.showNotification('Please enter event title', 'error');
            return;
        }

        if (!date) {
            calendar.showNotification('Please select a date', 'error');
            return;
        }

        const eventData = {
            id: Date.now(),
            title: title,
            date: date,
            time: time || null,
            notes: notes || null,
            createdAt: new Date().toISOString()
        };

        // कैलेंडर में सेव करें
        calendar.saveEvent(eventData);
        
        // मोडल क्लोज करें और फॉर्म रीसेट करें
        this.closeEventModal();
        this.resetEventForm();
    }

    closeEventModal() {
        document.getElementById('event-modal').classList.remove('active');
    }

    resetEventForm() {
        document.getElementById('event-title-input').value = '';
        document.getElementById('event-date-input').value = '';
        document.getElementById('event-time-input').value = '';
        document.getElementById('event-notes-input').value = '';
    }

    // रिमाइंडर लिस्ट अपडेट करें
    updateRemindersList() {
        const remindersList = document.getElementById('reminders-list');
        const events = calendar.events;
        const today = new Date().toISOString().split('T')[0];
        
        // आने वाले इवेंट्स फिल्टर करें
        const upcomingEvents = events
            .filter(event => event.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (upcomingEvents.length === 0) {
            remindersList.innerHTML = `
                <div class="empty-reminders">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No Reminders</h3>
                    <p>You don't have any upcoming events.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        upcomingEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = eventDate.toLocaleDateString('en-US', options);
            
            html += `
                <div class="reminder-item">
                    <div class="reminder-content">
                        <div class="reminder-title">${event.title}</div>
                        <div class="reminder-date">${dateStr}${event.time ? ` at ${event.time}` : ''}</div>
                        ${event.notes ? `<div class="reminder-notes">${event.notes}</div>` : ''}
                    </div>
                    <div class="reminder-actions" onclick="eventsManager.deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `;
        });
        
        remindersList.innerHTML = html;
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            calendar.events = calendar.events.filter(event => event.id !== eventId);
            localStorage.setItem('calendarEvents', JSON.stringify(calendar.events));
            calendar.updateCalendar();
            this.updateRemindersList();
            calendar.showNotification('Event deleted successfully!', 'success');
        }
    }
}

// ग्लोबल इवेंट्स मैनेजर
window.eventsManager = new EventsManager();
