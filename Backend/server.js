require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = require("./src/app");
const connectDB = require("./src/config/database");

const PORT = process.env.PORT || 3000;
let server;

async function start() {
    if (server) return;

    try {
        await connectDB();
    } catch {
        console.error(
            "Database offline — server will start but register/login and reports will fail until MongoDB connects."
        );
    }

    server = app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Run: npm run predev`);
        } else {
            console.error("Failed to start server:", err.message);
        }
        process.exit(1);
    });
}

start();
