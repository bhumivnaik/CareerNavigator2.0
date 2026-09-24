const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const skillRoutes = require("./routes/skillsRoute");
const careerRoutes = require("./routes/careerRoutes");
const quizRoutes = require("./routes/quizRoute");
const githubRoutes = require("./routes/githubRoutes");
const skillVerificationRoutes = require("./routes/skillVerificationRoutes");

const streakRoutes = require("./routes/streakRoute");
const resumeRoutes = require("./routes/resumeRoute");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/github", githubRoutes);

app.use("/api/streak", streakRoutes);
app.use("/api/resume", resumeRoutes);

app.use("/api/skill-verification", skillVerificationRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Career Navigator backend is running"
    });
});

const authMiddleware = require("./middleware/authMiddleware");

app.get("/api/test", authMiddleware, (req, res) => {
    res.json({
        message: "You accessed a protected route",
        user_id: req.user.user_id
    });
});

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

