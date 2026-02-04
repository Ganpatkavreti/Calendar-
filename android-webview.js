// android-webview.js - Android WebView Optimization

class AndroidWebView {
    constructor() {
        this.isAndroidApp = this.detectAndroidWebView();
        this.isFullscreen = false;
        this.keyboardOpen = false;
        
        if (this.isAndroidApp) {
            this.initialize();
        }
    }
    
    detectAndroidWebView() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.indexOf('android') > -1;
        const isWebView = userAgent.indexOf('wv') > -1 || 
                         (userAgent.indexOf('android') > -1 && 
                          userAgent.indexOf('chrome') === -1);
        
        return isAndroid && isWebView;
    }
    
    initialize() {
        console.log('Android WebView detected - Initializing optimizations');
        
        // Android specific class add करें
        document.body.classList.add('android-app');
        
        // Event listeners सेटअप करें
        this.setupEventListeners();
        
        // UI optimizations apply करें
        this.applyOptimizations();
        
        // Fullscreen mode check करें
        this.checkFullscreen();
        
        // Keyboard detection सेटअप करें
        this.setupKeyboardDetection();
        
        // Back button hint show करें
        this.showBackButtonHint();
    }
    
    setupEventListeners() {
        // Back button handling (Android WebView के लिए)
        document.addEventListener('backbutton', this.handleBackButton.bind(this), false);
        
        // Fullscreen changes
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        
        // App visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Android specific touch events
        this.setupTouchEvents();
    }
    
    handleBackButton(e) {
        e.preventDefault();
        console.log('Android back button pressed');
        
        // पहले active modals check करें
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const closeBtn = activeModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.click();
                return;
            }
        }
        
        // Sidebar check करें
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            document.getElementById('overlay').click();
            return;
        }
        
        // Search bar check करें
        const searchBar = document.getElementById('search-bar-container');
        if (searchBar && searchBar.style.display !== 'none') {
            document.getElementById('close-search').click();
            return;
        }
        
        // Views check करें
        if (!document.getElementById('calendar-view').style.display !== 'none') {
            // कैलेंडर व्यू पर वापस जाएँ
            document.querySelector('.view-option[data-view="month"]').click();
            return;
        }
        
        // Last resort: exit confirmation
        if (confirm('Exit the app?')) {
            if (typeof navigator.app !== 'undefined' && navigator.app.exitApp) {
                navigator.app.exitApp();
            }
        }
    }
    
    handleFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || 
                              document.webkitFullscreenElement);
        
        if (this.isFullscreen) {
            document.body.classList.add('fullscreen');
        } else {
            document.body.classList.remove('fullscreen');
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // App background में गया
            this.saveAppState();
        } else {
            // App foreground में आया
            this.restoreAppState();
        }
    }
    
    setupTouchEvents() {
        // Better touch handling for Android
        document.addEventListener('touchstart', (e) => {
            // Touch feedback के लिए
            if (e.target.classList.contains('touch-feedback')) {
                e.target.classList.add('touch-active');
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            // Touch feedback remove करें
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });
        }, { passive: true });
        
        // Prevent text selection on long press
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    }
    
    setupKeyboardDetection() {
        // Keyboard detection for Android
        const originalHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const newHeight = window.innerHeight;
            const heightDiff = originalHeight - newHeight;
            
            if (heightDiff > 100) {
                // Keyboard opened
                this.keyboardOpen = true;
                document.body.classList.add('keyboard-open');
                this.adjustForKeyboard();
            } else if (this.keyboardOpen && heightDiff < 50) {
                // Keyboard closed
                this.keyboardOpen = false;
                document.body.classList.remove('keyboard-open');
                this.restoreAfterKeyboard();
            }
        });
    }
    
    adjustForKeyboard() {
        // Scroll active input into view
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || 
                             activeElement.tagName === 'TEXTAREA')) {
            setTimeout(() => {
                activeElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        }
        
        // Modal adjustment
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.style.paddingBottom = '250px';
        }
    }
    
    restoreAfterKeyboard() {
        // Modal restore
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.style.paddingBottom = '';
        }
    }
    
    applyOptimizations() {
        // Prevent zooming
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
        
        // Disable text selection (except inputs)
        document.addEventListener('selectstart', (e) => {
            if (e.target.tagName !== 'INPUT' && 
                e.target.tagName !== 'TEXTAREA' &&
                !e.target.isContentEditable) {
                e.preventDefault();
            }
        });
        
        // Better scroll performance
        document.body.style.overflowScrolling = 'touch';
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Status bar spacing
        this.adjustForStatusBar();
    }
    
    adjustForStatusBar() {
        // Add safe area insets
        const topNav = document.querySelector('.top-nav');
        const sidebar = document.querySelector('.sidebar');
        
        if (topNav) {
            const currentPadding = parseInt(window.getComputedStyle(topNav).paddingTop);
            topNav.style.paddingTop = `calc(${currentPadding}px + env(safe-area-inset-top))`;
        }
        
        if (sidebar) {
            sidebar.style.paddingTop = `env(safe-area-inset-top)`;
        }
        
        // Calendar grid height adjustment
        const calendarGrid = document.querySelector('.calendar-grid');
        if (calendarGrid) {
            calendarGrid.style.maxHeight = `calc(100vh - 64px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`;
        }
    }
    
    checkFullscreen() {
        // Try to enter fullscreen mode
        setTimeout(() => {
            if (!this.isFullscreen && this.isAndroidApp) {
                this.requestFullscreen();
            }
        }, 1000);
    }
    
    requestFullscreen() {
        const docEl = document.documentElement;
        
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        }
    }
    
    saveAppState() {
        // Save current state to localStorage
        const state = {
            currentDate: calendar ? calendar.currentDate.toISOString() : null,
            selectedDate: calendar ? calendar.selectedDate.toISOString() : null,
            currentView: this.getCurrentView(),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('androidAppState', JSON.stringify(state));
    }
    
    restoreAppState() {
        // Restore state from localStorage
        const savedState = localStorage.getItem('androidAppState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Check if state is recent (less than 5 minutes old)
            const stateAge = (new Date() - new Date(state.timestamp)) / (1000 * 60);
            if (stateAge < 5 && calendar) {
                // Restore calendar state
                if (state.currentDate) {
                    calendar.currentDate = new Date(state.currentDate);
                    calendar.updateCalendar();
                }
                
                // Restore view
                if (state.currentView) {
                    this.switchToView(state.currentView);
                }
            }
        }
    }
    
    getCurrentView() {
        if (document.getElementById('calendar-view').style.display !== 'none') {
            return 'month';
        } else if (document.getElementById('reminders-view').style.display !== 'none') {
            return 'reminders';
        } else if (document.getElementById('diary-view').style.display !== 'none') {
            return 'diary';
        }
        return 'month';
    }
    
    switchToView(viewName) {
        // This function should match your existing view switching logic
        const viewOptions = document.querySelectorAll('.view-option');
        viewOptions.forEach(option => {
            if (option.getAttribute('data-view') === viewName) {
                option.click();
            }
        });
    }
    
    showBackButtonHint() {
        // Show back button hint for first-time users
        if (!localStorage.getItem('androidBackHintShown')) {
            const hint = document.createElement('div');
            hint.className = 'android-back-hint';
            hint.innerHTML = '<i class="fas fa-arrow-left"></i> Use back button to navigate';
            document.body.appendChild(hint);
            
            setTimeout(() => {
                hint.remove();
                localStorage.setItem('androidBackHintShown', 'true');
            }, 3000);
        }
    }
    
    // Utility function to hide URL bar (if visible)
    hideUrlBar() {
        // Scroll trick to hide URL bar
        window.scrollTo(0, 1);
        
        // Additional method for hiding
        setTimeout(() => {
            document.body.style.height = '100.1%';
            setTimeout(() => {
                document.body.style.height = '100%';
            }, 10);
        }, 100);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.androidWebView = new AndroidWebView();
    
    // Additional Android optimizations
    if (window.androidWebView.isAndroidApp) {
        // Inject CSS for Android
        const style = document.createElement('style');
        style.textContent = `
            /* Prevent pull-to-refresh on Android */
            body {
                overscroll-behavior-y: none;
            }
            
            /* Better touch scrolling */
            * {
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Optimize for WebView rendering */
            .calendar-grid {
                will-change: transform;
                contain: content;
            }
        `;
        document.head.appendChild(style);
        
        // Hide any browser UI elements
        setTimeout(() => {
            window.androidWebView.hideUrlBar();
        }, 500);
    }
});

// Android-specific global functions
window.exitApp = function() {
    if (typeof navigator.app !== 'undefined' && navigator.app.exitApp) {
        navigator.app.exitApp();
    }
};

window.showToast = function(message, duration = 3000) {
    // Simple toast notification for Android
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 10000;
        font-size: 14px;
        max-width: 80%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
};
