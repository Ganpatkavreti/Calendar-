// tasks.js - सुधारित (डुप्लीकेट लिसनर्स हटाए)

class TasksManager {
    constructor() {
        this.taskCounter = 1;
        this.initTaskListeners();
        this.loadExistingTasks();
    }

    initTaskListeners() {
        // हैमबर्गर मेनू टास्क बटन
        document.getElementById('add-task-menu-btn').addEventListener('click', () => this.openAddTaskModal());
        
        // नया टास्क एड मोडल बटन्स
        document.getElementById('save-all-tasks').addEventListener('click', () => this.saveAllRoutineTasks());
        document.getElementById('cancel-add-task').addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('close-add-task-modal').addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('add-more-tasks-btn').addEventListener('click', () => this.addAnotherTask());
        
        // मोडल के बाहर क्लिक करने पर बंद करें
        document.getElementById('add-task-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('add-task-modal')) {
                this.closeAddTaskModal();
            }
        });
    }

    // मौजूदा टास्क्स लोड करें
    loadExistingTasks() {
        this.existingTasks = calendar.routineTasks;
    }

    // हैमबर्गर मेनू से टास्क एड मोडल खोलें
    openAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        
        // मौजूदा टास्क्स लोड करें
        this.existingTasks = calendar.routineTasks;
        
        // टास्क कंटेनर को रीसेट करें
        const container = document.getElementById('tasks-input-container');
        container.innerHTML = '';
        
        // मौजूदा टास्क्स दिखाएं
        if (this.existingTasks.length > 0) {
            this.taskCounter = this.existingTasks.length;
            this.existingTasks.forEach((task, index) => {
                container.innerHTML += this.createTaskInputGroup(index + 1, task);
            });
        } else {
            // कोई टास्क नहीं है, एक खाली फॉर्म दिखाएं
            this.taskCounter = 1;
            container.innerHTML = this.createTaskInputGroup(1);
        }
        
        // डिलीट बटन के लिए इवेंट लिसनर्स सेट करें
        this.setupDeleteButtons();
        
        // मोडल खोलें
        modal.classList.add('active');
        
        // साइडबार बंद करें
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    // टास्क इनपुट ग्रुप बनाएं (एडिट के लिए)
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

    // डिलीट बटन सेटअप करें
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

    // रूटीन टास्क डिलीट करें
    deleteRoutineTask(taskId) {
        calendar.deleteRoutineTask(taskId);
        
        // मोडल रीफ्रेश करें
        this.openAddTaskModal();
    }

    // एक और टास्क जोड़ें
    addAnotherTask() {
        this.taskCounter++;
        const container = document.getElementById('tasks-input-container');
        container.insertAdjacentHTML('beforeend', this.createTaskInputGroup(this.taskCounter));
        
        // नए इनपुट पर फोकस करें
        setTimeout(() => {
            document.getElementById(`add-task-title-${this.taskCounter}`).focus();
        }, 50);
        
        // कंटेनर को स्क्रॉल करें
        container.scrollTop = container.scrollHeight;
    }

    // सभी रूटीन टास्क्स सेव करें
    saveAllRoutineTasks() {
        const taskList = [];
        const allTaskGroups = document.querySelectorAll('.task-input-group');
        
        // सभी टास्क इनपुट्स से डेटा कलेक्ट करें
        allTaskGroups.forEach((group, index) => {
            const taskId = group.getAttribute('data-task-id');
            const title = document.getElementById(`add-task-title-${index + 1}`).value.trim();
            const notes = document.getElementById(`add-task-notes-${index + 1}`).value.trim();
            
            if (title) { // सिर्फ टाइटल वाले टास्क्स ही सेव करें
                const taskData = {
                    id: taskId ? parseInt(taskId) : Date.now() + index,
                    title: title,
                    notes: notes || null,
                    createdAt: taskId ? this.getTaskCreationDate(taskId) : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                taskList.push(taskData);
            }
        });
        
        if (taskList.length === 0) {
            calendar.showNotification('Please enter at least one routine task title', 'error');
            return;
        }
        
        // पहले सभी पुराने टास्क्स डिलीट करें
        calendar.routineTasks = [];
        
        // फिर सभी नए टास्क्स सेव करें
        const addedCount = calendar.saveRoutineTasks(taskList);
        
        // मोडल क्लोज करें
        this.closeAddTaskModal();
        
        // अगर वर्तमान तारीख का टास्क मोडल खुला है, तो अपडेट करें
        const taskModal = document.getElementById('task-modal');
        if (taskModal.classList.contains('active')) {
            calendar.openTaskModal(calendar.selectedDate);
        }
    }

    // टास्क की क्रिएशन डेट प्राप्त करें
    getTaskCreationDate(taskId) {
        const task = this.existingTasks.find(t => t.id === parseInt(taskId));
        return task ? task.createdAt : new Date().toISOString();
    }

    closeAddTaskModal() {
        document.getElementById('add-task-modal').classList.remove('active');
        
        // सभी इनपुट्स क्लियर करें
        const allTaskGroups = document.querySelectorAll('.task-input-group');
        allTaskGroups.forEach((group, index) => {
            const titleInput = document.getElementById(`add-task-title-${index + 1}`);
            const notesInput = document.getElementById(`add-task-notes-${index + 1}`);
            if (titleInput) titleInput.value = '';
            if (notesInput) notesInput.value = '';
        });
        
        // टास्क काउंटर रीसेट करें
        this.taskCounter = 1;
    }
}

// ग्लोबल टास्क्स मैनेजर
window.tasksManager = new TasksManager();