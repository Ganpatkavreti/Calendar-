// tasks.js - सुधारित (मल्टीपल टास्क एड और क्लोज बटन ठीक)

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
            this.existingTasks = calendar.routineTasks;
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
            calendar.deleteRoutineTask(taskId);
            this.openAddTaskModal();
        }
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
            const addedCount = calendar.saveRoutineTasks(taskList);
            this.closeAddTaskModal();
            
            if (document.getElementById('task-modal').classList.contains('active')) {
                calendar.openTaskModal(calendar.selectedDate);
            }
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
}

// इंस्टेंस बनाएं
document.addEventListener('DOMContentLoaded', () => {
    window.tasksManager = new TasksManager();
});