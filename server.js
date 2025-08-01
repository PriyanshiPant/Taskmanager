require("dotenv").config(); // ✅ Load env variables first

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected");
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// ✅ Task schema and model
const taskSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
});
const Task = mongoose.model("Task", taskSchema);

// ✅ API Routes
app.get("/api/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const { text, completed } = req.body;
  const newTask = new Task({ text, completed: completed || false });
  await newTask.save();
  res.json(newTask);
});

// DELETE all tasks
app.delete("/api/tasks", async (req, res) => {
  await Task.deleteMany({});
  res.sendStatus(204);
});

app.delete("/api/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Update task completed status or text
app.put("/api/tasks/:id", async (req, res) => {
  const { text, completed } = req.body;
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    { text, completed },
    { new: true }
  );
  res.json(updatedTask);
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

