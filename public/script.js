document.addEventListener("DOMContentLoaded", async () => {
  const taskList = document.getElementById("task-list");
  const taskCount = document.getElementById("task-count");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const clearAllBtn = document.getElementById("clear-all"); // ✅ New

  // Load tasks and render
  let tasks = await fetchTasks();
  renderTasks(tasks);

  // Add task form submit
  document.getElementById("task-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("task-input");
    const text = input.value.trim();
    if (text) {
      const newTask = await addTask(text);
      tasks.push(newTask);
      renderTasks(tasks);
      input.value = "";
    }
  });

  // Clear completed tasks button
  clearCompletedBtn.addEventListener("click", async () => {
    const completedTasks = tasks.filter(t => t.completed);
    await Promise.all(completedTasks.map(t => deleteTask(t._id)));
    tasks = tasks.filter(t => !t.completed);
    renderTasks(tasks);
  });

  // ✅ Clear all tasks button with confirmation
//clearAllBtn.addEventListener("click", async () => {
  //const confirmed = confirm("Are you sure you want to delete ALL tasks?");
  //if (!confirmed) return;

  //const response = await fetch("/api/tasks", { method: "DELETE" });
  //if (response.ok) {
    //tasks = [];
    //renderTasks(tasks);
  //} else {
    //alert("Failed to clear all tasks.");
  //}
//});

  // Fetch tasks from backend
  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    return await res.json();
  }

  // Add task to backend
  async function addTask(text) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return await res.json();
  }

  // Delete task from backend
  async function deleteTask(id) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  // Toggle completed state
  async function toggleCompleted(task) {
    task.completed = !task.completed;
    await fetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: task.completed }),
    });
  }

  // Render tasks in the DOM
  function renderTasks(tasks) {
    taskList.innerHTML = "";
    if (tasks.length === 0) {
      taskCount.textContent = "No tasks, add one above!";
      return;
    }

    tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = task.completed ? "completed" : "";
      li.dataset.id = task._id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.onchange = async () => {
        await toggleCompleted(task);
        li.className = task.completed ? "completed" : "";
        updateCount();
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      span.className = "task-text";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.className = "delete-btn";
      deleteBtn.onclick = async () => {
        await deleteTask(task._id);
        tasks = tasks.filter(t => t._id !== task._id);
        renderTasks(tasks);
      };

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });

    updateCount();
  }

  // Update task counts display
  function updateCount() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    taskCount.textContent = `Total tasks: ${total} | Completed: ${completed}`;
  }
});
