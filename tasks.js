// tasks.js - अपडेटेड (रिपोर्ट कार्ड सिस्टम के साथ)

class TasksManager {
    constructor() {
        this.taskCounter = 1;
        this.existingTasks = [];
        this.initTaskListeners();
        this.loadExistingTasks();
    }

    initTaskListeners() {
        // हैमबर्गर मेनू टास्क बटन
        const addTaskBtn = document.getElementById('add-task-menu-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.openAddTaskModal());
        }
        
        // नया टास्क एड मोडल बटन्स
        const saveAllBtn = document.getElementById('save-all-tasks');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => this.saveAllRoutineTasks());
        }
        
        // अलग-अलग क्लोज बटन
        const closeAddTaskBtn = document.getElementById('close-add-task-modal');
        if (closeAddTaskBtn) {
            closeAddTaskBtn.addEventListener('click', () => this.closeAddTaskModal());
        }
        
        const cancelAddTaskBtn = document.getElementById('cancel-add-task');
        if (cancelAddTaskBtn) {
            cancelAddTaskBtn.addEventListener('click', () => this.closeAddTaskModal());
        }
        
        const addMoreBtn = document.getElementById('add-more-tasks-btn');
        if (addMoreBtn) {
            addMoreBtn.addEventListener('click', () => this.addAnotherTask());
        }
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        const addTaskModal = document.getElementById('add-task-modal');
        if (addTaskModal) {
            addTaskModal.addEventListener('click', (e) => {
                if (e.target === addTaskModal) {
                    this.closeAddTaskModal();
                }
            });
        }
    }

    loadExistingTasks() {
        if (calendar && calendar.routineTasks) {
            this.existingTasks = [...calendar.routineTasks];
        }
    }

    openAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (!modal) return;
        
        this.loadExistingTasks();
        
        const container = document.getElementById('tasks-input-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.existingTasks.length > 0) {
            this.taskCounter = this.existingTasks.length;
            this.existingTasks.forEach((task, index) => {
                container.innerHTML += this.createTaskInputGroup(index + 1, task);
            });
        } else {
            this.taskCounter = 1;
            container.innerHTML = this.createTaskInputGroup(1);
        }
        
        this.setupDeleteButtons();
        
        modal.classList.add('active');
        
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        
        setTimeout(() => {
            const firstInput = document.getElementById('add-task-title-1');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    createTaskInputGroup(index, task = null) {
        const title = task ? task.title : '';
        const notes = task ? (task.notes || '') : '';
        const taskId = task ? task.id : '';
        
        return `
            <div class="task-input-group" data-task-index="${index}" data-task-id="${taskId || ''}">
                <div class="form-group">
                    <label for="add-task-title-${index}">Routine Task ${index}</label>
                    <div class="task-input-with-delete">
                        <input type="text" id="add-task-title-${index}" class="task-title-input" 
                               value="${title}" placeholder="Enter routine task title">
                        ${taskId ? `<button type="button" class="btn-delete-task" data-task-id="${taskId}">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
                <div class="form-group">
                    <label for="add-task-notes-${index}">Notes (Optional)</label>
                    <textarea id="add-task-notes-${index}" class="task-notes-input" 
                              placeholder="Add any notes..." rows="2">${notes}</textarea>
                </div>
            </div>
        `;
    }

    setupDeleteButtons() {
        document.querySelectorAll('.btn-delete-task').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.getAttribute('data-task-id'));
                if (taskId && confirm('Are you sure you want to delete this routine task?')) {
                    this.deleteRoutineTask(taskId);
                }
            });
        });
    }

    deleteRoutineTask(taskId) {
        if (calendar) {
            // पहले टास्क की जानकारी सेव करें (हिस्ट्री के लिए)
            this.saveTaskHistoryBeforeDeletion(taskId);
            
            // टास्क डिलीट करें
            calendar.deleteRoutineTask(taskId);
            
            // रिपोर्ट कार्ड्स अपडेट करें
            this.updateReportCardsAfterTaskChange();
            
            // मोडल रीफ्रेश करें
            this.openAddTaskModal();
        }
    }

    // टास्क हिस्ट्री सेव करें (डिलीट होने से पहले)
    saveTaskHistoryBeforeDeletion(taskId) {
        // टास्क की जानकारी प्राप्त करें
        const taskToDelete = this.existingTasks.find(task => task.id === taskId);
        if (!taskToDelete) return;
        
        // टास्क हिस्ट्री localStorage में सेव करें
        const taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '{}');
        
        if (!taskHistory[taskId]) {
            taskHistory[taskId] = {
                task: taskToDelete,
                deletedAt: new Date().toISOString(),
                history: []
            };
        }
        
        // टास्क कम्प्लीशन हिस्ट्री भी सेव करें
        if (calendar && calendar.taskCompletions) {
            const taskCompletions = calendar.taskCompletions.filter(comp => comp.taskId === taskId);
            if (taskCompletions.length > 0) {
                taskHistory[taskId].completions = taskCompletions;
            }
        }
        
        localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
    }

    addAnotherTask() {
        this.taskCounter++;
        const container = document.getElementById('tasks-input-container');
        if (!container) return;
        
        container.insertAdjacentHTML('beforeend', this.createTaskInputGroup(this.taskCounter));
        
        setTimeout(() => {
            const newInput = document.getElementById(`add-task-title-${this.taskCounter}`);
            if (newInput) newInput.focus();
        }, 50);
        
        container.scrollTop = container.scrollHeight;
    }

    saveAllRoutineTasks() {
        const allTaskGroups = document.querySelectorAll('.task-input-group');
        if (!allTaskGroups || allTaskGroups.length === 0) {
            if (calendar) calendar.showNotification('Please enter at least one routine task', 'error');
            return;
        }
        
        const taskList = [];
        
        allTaskGroups.forEach((group, index) => {
            const taskId = group.getAttribute('data-task-id');
            const titleInput = document.getElementById(`add-task-title-${index + 1}`);
            const notesInput = document.getElementById(`add-task-notes-${index + 1}`);
            
            if (titleInput) {
                const title = titleInput.value.trim();
                const notes = notesInput ? notesInput.value.trim() : '';
                
                if (title) {
                    const taskData = {
                        id: taskId ? parseInt(taskId) : Date.now() + index,
                        title: title,
                        notes: notes || null,
                        createdAt: taskId ? this.getTaskCreationDate(taskId) : new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    taskList.push(taskData);
                }
            }
        });
        
        if (taskList.length === 0) {
            if (calendar) calendar.showNotification('Please enter at least one routine task title', 'error');
            return;
        }
        
        if (calendar) {
            // पुराने टास्क्स की जानकारी सेव करें (हिस्ट्री के लिए)
            this.saveTaskHistoryBeforeUpdate(taskList);
            
            // नए टास्क्स सेव करें
            const addedCount = calendar.saveRoutineTasks(taskList);
            
            // रिपोर्ट कार्ड्स अपडेट करें
            this.updateReportCardsAfterTaskChange();
            
            this.closeAddTaskModal();
            
            if (document.getElementById('task-modal').classList.contains('active')) {
                calendar.openTaskModal(calendar.selectedDate);
            }
        }
    }

    // टास्क अपडेट से पहले हिस्ट्री सेव करें
    saveTaskHistoryBeforeUpdate(newTaskList) {
        const oldTasks = [...this.existingTasks];
        const newTaskIds = newTaskList.map(task => task.id);
        
        // डिलीट हुए टास्क्स की हिस्ट्री सेव करें
        oldTasks.forEach(oldTask => {
            if (!newTaskIds.includes(oldTask.id)) {
                // टास्क डिलीट हो गया है
                this.saveTaskHistoryBeforeDeletion(oldTask.id);
            } else {
                // टास्क अपडेट हुआ है - पुरानी वर्जन सेव करें
                const updatedTask = newTaskList.find(t => t.id === oldTask.id);
                if (updatedTask && (updatedTask.title !== oldTask.title || updatedTask.notes !== oldTask.notes)) {
                    this.saveTaskUpdateHistory(oldTask, updatedTask);
                }
            }
        });
    }

    // टास्क अपडेट हिस्ट्री सेव करें
    saveTaskUpdateHistory(oldTask, updatedTask) {
        const taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '{}');
        
        if (!taskHistory[oldTask.id]) {
            taskHistory[oldTask.id] = {
                task: oldTask,
                updatedAt: new Date().toISOString(),
                history: []
            };
        }
        
        // पुरानी वर्जन हिस्ट्री में एड करें
        taskHistory[oldTask.id].history.push({
            oldVersion: oldTask,
            newVersion: updatedTask,
            updatedAt: new Date().toISOString()
        });
        
        localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
    }

    // रिपोर्ट कार्ड्स अपडेट करें (टास्क बदलने पर)
    updateReportCardsAfterTaskChange() {
        // रिपोर्ट कार्ड मैनेजर को अपडेट करें
        if (window.reportCardManager) {
            window.reportCardManager.updateAllReportsOnTaskChange();
        }
        
        // डायरी मैनेजर को अपडेट करें
        if (window.diaryManager && window.diaryManager.onRoutineTasksChanged) {
            window.diaryManager.onRoutineTasksChanged();
        }
    }

    getTaskCreationDate(taskId) {
        const task = this.existingTasks.find(t => t.id === parseInt(taskId));
        return task ? task.createdAt : new Date().toISOString();
    }

    closeAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) modal.classList.remove('active');
        
        this.taskCounter = 1;
    }

    // टास्क कम्प्लीशन बदलने पर अपडेट करें
    onTaskCompletionChanged(dateStr, taskId, completed) {
        // रिपोर्ट कार्ड अपडेट करें
        if (window.reportCardManager) {
            window.reportCardManager.onTaskCompletionChanged(dateStr);
        }
        
        // डायरी मैनेजर को अपडेट करें
        if (window.diaryManager && window.diaryManager.onTaskCompletionChanged) {
            window.diaryManager.onTaskCompletionChanged(dateStr);
        }
        
        // टास्क कम्प्लीशन हिस्ट्री सेव करें
        this.saveTaskCompletionHistory(dateStr, taskId, completed);
    }

    // टास्क कम्प्लीशन हिस्ट्री सेव करें
    saveTaskCompletionHistory(dateStr, taskId, completed) {
        const task = this.existingTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const completionHistory = JSON.parse(localStorage.getItem('completionHistory') || '{}');
        const historyKey = `${dateStr}_${taskId}`;
        
        if (!completionHistory[historyKey]) {
            completionHistory[historyKey] = [];
        }
        
        // हिस्ट्री में एड करें
        completionHistory[historyKey].push({
            taskId: taskId,
            taskTitle: task.title,
            date: dateStr,
            completed: completed,
            timestamp: new Date().toISOString()
        });
        
        // सिर्फ आखिरी 10 एंट्रीज रखें
        if (completionHistory[historyKey].length > 10) {
            completionHistory[historyKey] = completionHistory[historyKey].slice(-10);
        }
        
        localStorage.setItem('completionHistory', JSON.stringify(completionHistory));
    }

    // टास्क हिस्ट्री प्राप्त करें
    getTaskHistory(taskId) {
        const taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '{}');
        return taskHistory[taskId] || null;
    }

    // टास्क कम्प्लीशन हिस्ट्री प्राप्त करें
    getCompletionHistory(dateStr, taskId) {
        const completionHistory = JSON.parse(localStorage.getItem('completionHistory') || '{}');
        const historyKey = `${dateStr}_${taskId}`;
        return completionHistory[historyKey] || [];
    }

    // टास्क स्नैपशॉट प्राप्त करें (रिपोर्ट कार्ड के लिए)
    getTaskSnapshotForDate(dateStr) {
        const taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '{}');
        const currentTasks = calendar.getRoutineTasks();
        
        // हर टास्क के लिए उस दिन की वर्जन खोजें
        const snapshot = currentTasks.map(task => {
            const history = taskHistory[task.id];
            if (history && history.history) {
                // उस दिन से पहले की आखिरी वर्जन ढूंढें
                const date = new Date(dateStr);
                const previousVersions = history.history.filter(h => 
                    new Date(h.updatedAt) <= date
                );
                
                if (previousVersions.length > 0) {
                    const latestVersion = previousVersions[previousVersions.length - 1];
                    return {
                        ...latestVersion.oldVersion,
                        currentId: task.id
                    };
                }
            }
            
            // अगर हिस्ट्री नहीं है तो करंट टास्क
            return {
                ...task,
                currentId: task.id
            };
        });
        
        return snapshot;
    }
}

// इंस्टेंस बनाएं
document.addEventListener('DOMContentLoaded', () => {
    window.tasksManager = new TasksManager();
});
