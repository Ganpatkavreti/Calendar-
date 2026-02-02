// holidays.js - भारतीय त्योहार और CISF के GH/RH मैनेजमेंट

class HolidaysManager {
    constructor() {
        this.holidays = {};
        this.cisfHolidays = {};
        this.loadHolidays();
    }

    // JSON फाइल से त्योहार लोड करें
    async loadHolidays() {
        try {
            const response = await fetch('holidays.json');
            const data = await response.json();
            this.holidays = data.festivals;
            this.cisfHolidays = data.cisfHolidays;
            console.log('Holidays loaded successfully for years:', Object.keys(this.holidays));
        } catch (error) {
            console.error('Error loading holidays:', error);
            // डिफॉल्ट डेटा (अगर फाइल नहीं मिली)
            this.loadDefaultHolidays();
        }
    }

    // डिफॉल्ट त्योहार डेटा
    loadDefaultHolidays() {
        this.holidays = {
            "2024": [
                { date: "2024-01-26", name: "Republic Day", type: "GH", color: "#FF6B6B" },
                { date: "2024-08-15", name: "Independence Day", type: "GH", color: "#FF6B6B" },
                { date: "2024-10-02", name: "Gandhi Jayanti", type: "GH", color: "#FF6B6B" },
                { date: "2024-10-31", name: "Diwali", type: "RH", color: "#FFD166" }
            ],
            "2025": [
                { date: "2025-01-26", name: "Republic Day", type: "GH", color: "#FF6B6B" },
                { date: "2025-08-15", name: "Independence Day", type: "GH", color: "#FF6B6B" },
                { date: "2025-10-02", name: "Gandhi Jayanti", type: "GH", color: "#FF6B6B" },
                { date: "2025-10-20", name: "Diwali", type: "RH", color: "#FFD166" }
            ],
            "2026": [
                { date: "2026-01-26", name: "Republic Day", type: "GH", color: "#FF6B6B" },
                { date: "2026-08-15", name: "Independence Day", type: "GH", color: "#FF6B6B" },
                { date: "2026-10-02", name: "Gandhi Jayanti", type: "GH", color: "#FF6B6B" },
                { date: "2026-10-19", name: "Diwali", type: "RH", color: "#FFD166" }
            ]
        };
        
        this.cisfHolidays = {
            "2024": [
                { date: "2024-01-26", name: "Republic Day", type: "GH", color: "#4A90E2" },
                { date: "2024-08-15", name: "Independence Day", type: "GH", color: "#4A90E2" },
                { date: "2024-10-02", name: "Gandhi Jayanti", type: "GH", color: "#4A90E2" }
            ],
            "2025": [
                { date: "2025-01-26", name: "Republic Day", type: "GH", color: "#4A90E2" },
                { date: "2025-08-15", name: "Independence Day", type: "GH", color: "#4A90E2" },
                { date: "2025-10-02", name: "Gandhi Jayanti", type: "GH", color: "#4A90E2" }
            ],
            "2026": [
                { date: "2026-01-26", name: "Republic Day", type: "GH", color: "#4A90E2" },
                { date: "2026-08-15", name: "Independence Day", type: "GH", color: "#4A90E2" },
                { date: "2026-10-02", name: "Gandhi Jayanti", type: "GH", color: "#4A90E2" }
            ]
        };
    }

    // तारीख के लिए त्योहार प्राप्त करें
    getHolidaysForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        const year = date.getFullYear().toString();
        const result = {
            festivals: [],
            cisfHolidays: []
        };

        // सामान्य त्योहार
        if (this.holidays[year]) {
            const festivals = this.holidays[year].filter(h => h.date === dateStr);
            result.festivals = festivals;
        }

        // CISF के GH/RH
        if (this.cisfHolidays[year]) {
            const cisfHolidays = this.cisfHolidays[year].filter(h => h.date === dateStr);
            result.cisfHolidays = cisfHolidays;
        }

        return result;
    }

    // महीने के सभी त्योहार प्राप्त करें
    getHolidaysForMonth(year, month) {
        const yearStr = year.toString();
        const result = {
            festivals: [],
            cisfHolidays: []
        };

        // सामान्य त्योहार
        if (this.holidays[yearStr]) {
            result.festivals = this.holidays[yearStr].filter(h => {
                const holidayMonth = parseInt(h.date.split('-')[1]) - 1;
                return holidayMonth === month;
            });
        }

        // CISF के GH/RH
        if (this.cisfHolidays[yearStr]) {
            result.cisfHolidays = this.cisfHolidays[yearStr].filter(h => {
                const holidayMonth = parseInt(h.date.split('-')[1]) - 1;
                return holidayMonth === month;
            });
        }

        return result;
    }

    // त्योहार का प्रकार और रंग प्राप्त करें
    getHolidayTypeColor(holiday) {
        if (holiday.type === 'GH') {
            return {
                color: holiday.color || '#FF6B6B',
                label: 'GH',
                title: 'Gazetted Holiday',
                class: 'gh'
            };
        } else if (holiday.type === 'RH') {
            return {
                color: holiday.color || '#06D6A0',
                label: 'RH',
                title: 'Restricted Holiday',
                class: 'rh'
            };
        }
        return {
            color: '#9AA0A6',
            label: 'H',
            title: 'Holiday',
            class: 'h'
        };
    }

    // त्योहार बैज HTML बनाएं
    createHolidayBadge(holiday, isCisf = false) {
        const typeInfo = this.getHolidayTypeColor(holiday);
        const badgeClass = isCisf ? 'holiday-badge-cisf' : 'holiday-badge';
        
        return `
            <div class="${badgeClass} holiday-${typeInfo.class}${isCisf ? '-cisf' : ''}" 
                 style="background-color: ${typeInfo.color}" 
                 title="${holiday.name} - ${typeInfo.title} (${isCisf ? 'CISF' : 'National'})">
                <span class="holiday-label">${typeInfo.label}</span>
                <span class="holiday-name">${holiday.name}</span>
            </div>
        `;
    }

    // त्योहार टूलटिप HTML बनाएं
    createHolidayTooltip(holidays) {
        if (holidays.festivals.length === 0 && holidays.cisfHolidays.length === 0) {
            return '';
        }

        let html = '<div class="holiday-tooltip">';
        
        // सामान्य त्योहार
        if (holidays.festivals.length > 0) {
            html += '<div class="holiday-section">';
            html += '<strong>National Holidays:</strong>';
            holidays.festivals.forEach(holiday => {
                const typeInfo = this.getHolidayTypeColor(holiday);
                html += `<div class="holiday-item-tooltip">
                    <span class="holiday-type-tooltip" style="background-color: ${typeInfo.color}">${typeInfo.label}</span>
                    <span>${holiday.name}</span>
                </div>`;
            });
            html += '</div>';
        }

        // CISF के GH/RH
        if (holidays.cisfHolidays.length > 0) {
            html += '<div class="holiday-section">';
            html += '<strong>CISF Holidays:</strong>';
            holidays.cisfHolidays.forEach(holiday => {
                const typeInfo = this.getHolidayTypeColor(holiday);
                html += `<div class="holiday-item-tooltip">
                    <span class="holiday-type-tooltip" style="background-color: ${typeInfo.color}">${typeInfo.label}</span>
                    <span>${holiday.name} (CISF)</span>
                </div>`;
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // त्योहार का संक्षिप्त नाम बनाएं
    getShortHolidayName(holidayName, maxWords = 2) {
        const words = holidayName.split(' ');
        if (words.length <= maxWords) {
            return holidayName;
        }
        return words.slice(0, maxWords).join(' ') + '...';
    }

    // वर्ष के सभी त्योहार प्राप्त करें
    getAllHolidaysForYear(year) {
        const yearStr = year.toString();
        const result = {
            festivals: [],
            cisfHolidays: []
        };

        if (this.holidays[yearStr]) {
            result.festivals = this.holidays[yearStr];
        }

        if (this.cisfHolidays[yearStr]) {
            result.cisfHolidays = this.cisfHolidays[yearStr];
        }

        return result;
    }

    // आने वाले त्योहार प्राप्त करें
    getUpcomingHolidays(days = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const upcoming = [];
        const currentYear = today.getFullYear().toString();
        const nextYear = (today.getFullYear() + 1).toString();
        
        // वर्तमान वर्ष के त्योहार
        if (this.holidays[currentYear]) {
            this.holidays[currentYear].forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate >= today && holidayDate <= futureDate) {
                    upcoming.push({
                        ...holiday,
                        isCisf: false,
                        dateObj: holidayDate
                    });
                }
            });
        }
        
        // अगले वर्ष के त्योहार (अगर ज़रूरी हो)
        if (this.holidays[nextYear]) {
            this.holidays[nextYear].forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate <= futureDate) {
                    upcoming.push({
                        ...holiday,
                        isCisf: false,
                        dateObj: holidayDate
                    });
                }
            });
        }
        
        // CISF त्योहार
        if (this.cisfHolidays[currentYear]) {
            this.cisfHolidays[currentYear].forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate >= today && holidayDate <= futureDate) {
                    upcoming.push({
                        ...holiday,
                        isCisf: true,
                        dateObj: holidayDate
                    });
                }
            });
        }
        
        // तारीख के हिसाब से सॉर्ट करें
        upcoming.sort((a, b) => a.dateObj - b.dateObj);
        
        return upcoming;
    }
}

// ग्लोबल हॉलिडे मैनेजर
window.holidaysManager = new HolidaysManager();