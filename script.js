// Stopwatch Class for better organization
class PrecisionStopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.lapCounter = 1;
        this.sessionCount = parseInt(localStorage.getItem('sessionCount') || '0');
        this.lapTimes = [];
        this.totalSessionTime = 0;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.loadBestLap();
    }
    
    initializeElements() {
        this.elements = {
            timeDisplay: document.getElementById('timeDisplay'),
            timeMain: document.querySelector('.time-main'),
            timeMilliseconds: document.querySelector('.time-milliseconds'),
            startBtn: document.getElementById('startBtn'),
            startIcon: document.getElementById('startIcon'),
            startText: document.getElementById('startText'),
            lapBtn: document.getElementById('lapBtn'),
            resetBtn: document.getElementById('resetBtn'),
            lapTimes: document.getElementById('lapTimes'),
            lapSection: document.getElementById('lapSection'),
            clearLaps: document.getElementById('clearLaps'),
            progressCircle: document.getElementById('progressCircle'),
            stopwatchCard: document.getElementById('stopwatchCard'),
            modeIndicator: document.getElementById('modeIndicator'),
            
            // Stats elements
            sessionCount: document.getElementById('sessionCount'),
            bestLap: document.getElementById('bestLap'),
            totalLaps: document.getElementById('totalLaps'),
            avgLapTime: document.getElementById('avgLapTime'),
            currentSession: document.getElementById('currentSession')
        };
    }
    
    initializeEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch gestures for mobile
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            // Swipe gestures
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.startStop();
                } else if (this.isRunning) {
                    this.recordLap();
                }
            }
        });
        
        // Prevent default space bar behavior
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }
    
    handleKeyPress(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.startStop();
                break;
            case 'KeyL':
                if (!this.elements.lapBtn.disabled) {
                    this.recordLap();
                }
                break;
            case 'KeyR':
                this.reset();
                break;
            case 'KeyC':
                this.clearAllLaps();
                break;
            case 'Escape':
                if (this.isRunning) {
                    this.startStop();
                }
                break;
        }
    }
    
    formatTime(milliseconds, includeMilliseconds = true) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = milliseconds % 1000;
        
        if (includeMilliseconds) {
            return {
                main: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                milliseconds: ms.toString().padStart(3, '0')
            };
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateDisplay() {
        const time = this.formatTime(this.elapsedTime);
        this.elements.timeMain.textContent = time.main;
        this.elements.timeMilliseconds.textContent = time.milliseconds;
        this.updateProgressRing();
        this.updateCurrentSessionTime();
    }
    
    updateProgressRing() {
        const seconds = (this.elapsedTime / 1000) % 60;
        const progress = (seconds / 60) * 534; // 534 is the circumference
        this.elements.progressCircle.style.strokeDashoffset = 534 - progress;
    }
    
    updateCurrentSessionTime() {
        this.elements.currentSession.textContent = this.formatTime(this.totalSessionTime + this.elapsedTime, false);
    }
    
    updateStats() {
        this.elements.sessionCount.textContent = this.sessionCount;
        this.elements.totalLaps.textContent = this.lapTimes.length;
        
        if (this.lapTimes.length > 0) {
            const avgTime = this.lapTimes.reduce((sum, lap) => sum + lap.duration, 0) / this.lapTimes.length;
            this.elements.avgLapTime.textContent = this.formatTime(avgTime, false);
        } else {
            this.elements.avgLapTime.textContent = '--:--';
        }
    }
    
    loadBestLap() {
        const bestLap = localStorage.getItem('bestLap');
        if (bestLap) {
            this.elements.bestLap.textContent = bestLap;
        }
    }
    
    saveBestLap(timeString) {
        const currentBest = localStorage.getItem('bestLap');
        if (!currentBest || currentBest === '--:--:---') {
            localStorage.setItem('bestLap', timeString);
            this.elements.bestLap.textContent = timeString;
        } else {
            // Compare times (simplified comparison)
            const currentTime = this.parseTimeString(timeString);
            const bestTime = this.parseTimeString(currentBest);
            
            if (currentTime < bestTime) {
                localStorage.setItem('bestLap', timeString);
                this.elements.bestLap.textContent = timeString;
                this.showNotification('New Best Lap! 🎉');
            }
        }
    }
    
    parseTimeString(timeString) {
        const parts = timeString.split(':');
        const minutes = parseInt(parts[0]) * 60000;
        const seconds = parseInt(parts[1]) * 1000;
        const milliseconds = parseInt(parts[2]);
        return minutes + seconds + milliseconds;
    }
    
    startStop() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }, 10);
        
        this.isRunning = true;
        this.updateButtonStates();
        this.elements.stopwatchCard.classList.add('running');
        this.elements.modeIndicator.textContent = 'RUNNING';
        
        this.addRippleEffect(this.elements.startBtn, 'success');
    }
    
    stop() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.totalSessionTime += this.elapsedTime;
        this.sessionCount++;
        localStorage.setItem('sessionCount', this.sessionCount.toString());
        
        this.updateButtonStates();
        this.elements.stopwatchCard.classList.remove('running');
        this.elements.modeIndicator.textContent = 'STOPPED';
        this.updateStats();
        
        this.addRippleEffect(this.elements.startBtn, 'stop');
        this.showNotification('Timer Stopped');
    }
    
    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.elapsedTime = 0;
        this.lapCounter = 1;
        this.lapTimes = [];
        this.totalSessionTime = 0;
        
        this.updateDisplay();
        this.updateButtonStates();
        this.elements.stopwatchCard.classList.remove('running');
        this.elements.modeIndicator.textContent = 'READY';
        this.elements.lapTimes.innerHTML = '';
        this.updateProgressRing();
        this.updateStats();
        
        this.addRippleEffect(this.elements.resetBtn, 'reset');
        this.showNotification('Timer Reset');
        
        // Reset animation
        this.elements.stopwatchCard.classList.add('success-flash');
        setTimeout(() => {
            this.elements.stopwatchCard.classList.remove('success-flash');
        }, 500);
    }
    
    recordLap() {
        if (this.isRunning && this.elapsedTime > 0) {
            const lapTime = this.elapsedTime;
            const lapData = {
                number: this.lapCounter,
                duration: lapTime,
                timestamp: Date.now()
            };
            
            this.lapTimes.unshift(lapData); // Add to beginning for newest first
            this.createLapElement(lapData);
            this.updateLapStyles();
            this.updateStats();
            
            // Save best lap
            const timeString = this.formatTime(lapTime).main + ':' + this.formatTime(lapTime).milliseconds;
            this.saveBestLap(timeString);
            
            this.lapCounter++;
            this.addRippleEffect(this.elements.lapBtn, 'lap');
            this.showNotification(`Lap ${lapData.number} Recorded`);
        }
    }
    
    createLapElement(lapData) {
        const lapElement = document.createElement('div');
        lapElement.className = 'lap-time';
        lapElement.innerHTML = `
            <div class="lap-info">
                <span class="lap-number">Lap ${lapData.number}</span>
            </div>
            <div class="lap-duration">${this.formatTime(lapData.duration).main}:${this.formatTime(lapData.duration).milliseconds}</div>
        `;
        
        this.elements.lapTimes.insertBefore(lapElement, this.elements.lapTimes.firstChild);
        
        // Animate in
        setTimeout(() => {
            lapElement.style.transform = 'translateX(0)';
            lapElement.style.opacity = '1';
        }, 10);
    }
    
    updateLapStyles() {
        const lapElements = this.elements.lapTimes.querySelectorAll('.lap-time');
        
        if (this.lapTimes.length > 1) {
            // Find fastest and slowest laps
            const durations = this.lapTimes.map(lap => lap.duration);
            const fastest = Math.min(...durations);
            const slowest = Math.max(...durations);
            
            // Remove existing classes
            lapElements.forEach(el => {
                el.classList.remove('fastest', 'slowest');
            });
            
            // Add classes to fastest and slowest
            this.lapTimes.forEach((lap, index) => {
                const element = lapElements[index];
                if (element) {
                    if (lap.duration === fastest && fastest !== slowest) {
                        element.classList.add('fastest');
                    } else if (lap.duration === slowest && fastest !== slowest) {
                        element.classList.add('slowest');
                    }
                }
            });
        }
    }
    
    clearAllLaps() {
        this.lapTimes = [];
        this.elements.lapTimes.innerHTML = '';
        this.lapCounter = 1;
        this.updateStats();
        this.showNotification('All Laps Cleared');
        
        // Animate clear
        this.elements.lapSection.classList.add('success-flash');
        setTimeout(() => {
            this.elements.lapSection.classList.remove('success-flash');
        }, 500);
    }
    
    updateButtonStates() {
        if (this.isRunning) {
            this.elements.startIcon.textContent = '⏸';
            this.elements.startText.textContent = 'STOP';
            this.elements.startBtn.className = 'btn btn-secondary';
            this.elements.lapBtn.disabled = false;
        } else {
            this.elements.startIcon.textContent = '▶';
            this.elements.startText.textContent = 'START';
            this.elements.startBtn.className = 'btn btn-primary';
            this.elements.lapBtn.disabled = true;
        }
    }
    
    addRippleEffect(button, type) {
        button.classList.add('success-flash');
        setTimeout(() => {
            button.classList.remove('success-flash');
        }, 300);
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 245, 255, 0.9), rgba(124, 58, 237, 0.9));
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2500);
    }
}

// Global functions for HTML onclick handlers
let stopwatch;

function startStop() {
    stopwatch.startStop();
}

function recordLap() {
    stopwatch.recordLap();
}

function reset() {
    stopwatch.reset();
}

function clearAllLaps() {
    stopwatch.clearAllLaps();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    stopwatch = new PrecisionStopwatch();
});

// Advanced Features

// Performance optimization - use RAF for smooth animations
function smoothUpdate() {
    if (stopwatch && stopwatch.isRunning) {
        stopwatch.updateDisplay();
    }
    requestAnimationFrame(smoothUpdate);
}

// Start smooth updates
requestAnimationFrame(smoothUpdate);

// Theme switcher (bonus feature)
class ThemeManager {
    constructor() {
        this.themes = {
            cyber: {
                '--accent-cyan': '#00f5ff',
                '--accent-purple': '#7c3aed',
                '--accent-pink': '#ec4899',
                '--accent-orange': '#f59e0b',
                '--accent-green': '#10b981'
            },
            neon: {
                '--accent-cyan': '#ff0080',
                '--accent-purple': '#8000ff',
                '--accent-pink': '#ff4080',
                '--accent-orange': '#ff8000',
                '--accent-green': '#00ff80'
            },
            ocean: {
                '--accent-cyan': '#00bcd4',
                '--accent-purple': '#3f51b5',
                '--accent-pink': '#e91e63',
                '--accent-orange': '#ff9800',
                '--accent-green': '#4caf50'
            }
        };
        
        this.currentTheme = localStorage.getItem('stopwatchTheme') || 'cyber';
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (theme) {
            Object.entries(theme).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
            });
            this.currentTheme = themeName;
            localStorage.setItem('stopwatchTheme', themeName);
        }
    }
    
    cycleTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        this.applyTheme(themeNames[nextIndex]);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Add theme cycling on Ctrl+T
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        themeManager.cycleTheme();
    }
});

// Fullscreen API support
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Add fullscreen toggle on F11
document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

// Wake Lock API to prevent screen from sleeping during timing
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('Wake Lock not supported');
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
    }
}

// Auto-enable wake lock when timer starts
document.addEventListener('DOMContentLoaded', () => {
    const originalStart = PrecisionStopwatch.prototype.start;
    const originalStop = PrecisionStopwatch.prototype.stop;
    
    PrecisionStopwatch.prototype.start = function() {
        originalStart.call(this);
        requestWakeLock();
    };
    
    PrecisionStopwatch.prototype.stop = function() {
        originalStop.call(this);
        releaseWakeLock();
    };
});

// Export data functionality
function exportLapData() {
    if (stopwatch && stopwatch.lapTimes.length > 0) {
        const data = {
            sessionDate: new Date().toISOString(),
            totalTime: stopwatch.formatTime(stopwatch.elapsedTime),
            lapCount: stopwatch.lapTimes.length,
            laps: stopwatch.lapTimes.map(lap => ({
                lapNumber: lap.number,
                time: stopwatch.formatTime(lap.duration),
                timestamp: new Date(lap.timestamp).toISOString()
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stopwatch-session-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        stopwatch.showNotification('Lap data exported!');
    }
}

// Add export functionality on Ctrl+E
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportLapData();
    }
});

// Voice announcements (optional)
class VoiceAnnouncer {
    constructor() {
        this.enabled = localStorage.getItem('voiceEnabled') === 'true';
        this.synthesis = window.speechSynthesis;
    }
    
    announce(text) {
        if (this.enabled && this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 1.1;
            utterance.volume = 0.7;
            this.synthesis.speak(utterance);
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('voiceEnabled', this.enabled.toString());
        return this.enabled;
    }
}

const voiceAnnouncer = new VoiceAnnouncer();

// Add voice toggle on Ctrl+V
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        const enabled = voiceAnnouncer.toggle();
        stopwatch.showNotification(`Voice ${enabled ? 'Enabled' : 'Disabled'}`);
    }
});