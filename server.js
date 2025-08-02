require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const { WebAppStrategy } = require("ibmcloud-appid");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Session setup (REQUIRED for App ID)
app.use(
  session({
    secret: "super-secret-key", // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ Passport & IBM App ID configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new WebAppStrategy({
    clientId: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
    tenantId: process.env.TENANT_ID,
    oauthServerUrl: process.env.OAUTH_SERVER_URL,
    redirectUri: process.env.REDIRECT_URI,
  })
);

// ✅ Required for persistent login sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Task schema and model
const taskSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
});
const Task = mongoose.model("Task", taskSchema);

// 🔒 Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/ibmcloud/login");
}

// ✅ IBM App ID routes
app.get("/ibmcloud/login", passport.authenticate(WebAppStrategy.STRATEGY_NAME));

app.get(
  "/ibmcloud/callback",
  passport.authenticate(WebAppStrategy.STRATEGY_NAME),
  (req, res) => {
    res.redirect("/"); // Redirect after successful login
  }
);

app.get("/ibmcloud/profile", (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// ✅ Logout route
app.get("/ibmcloud/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/"); // Optional: redirect to homepage or login
    });
  });
});

// 🔐 Protect the root route
app.get("/", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Serve static files (after root protection)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Task API Routes (protected)
app.get("/api/tasks", ensureAuthenticated, async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
  const { text, completed } = req.body;
  const newTask = new Task({ text, completed: completed || false });
  await newTask.save();
  res.json(newTask);
});

app.put("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
  const { text, completed } = req.body;
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    { text, completed },
    { new: true }
  );
  res.json(updatedTask);
});

app.delete("/api/tasks", ensureAuthenticated, async (req, res) => {
  await Task.deleteMany({});
  res.sendStatus(204);
});

app.delete("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// ✅ Optional: auth status route
app.get("/status", (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null,
  });
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
