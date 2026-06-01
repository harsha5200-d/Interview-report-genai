const express = require('express');
const authRouter = require("./routes/auth.routes")  
const interviewRouter = require("./routes/interview.routes")
const app = express();
const cookieParser = require("cookie-parser")
const cors = require("cors")

app.use(cors({
    origin: true,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
});

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app