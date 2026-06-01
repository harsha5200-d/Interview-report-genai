const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const HEALTH_URL = "http://localhost:3000/api/health";
const TIMEOUT_MS = 60_000;
const INTERVAL_MS = 500;

function checkHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get(HEALTH_URL, (res) => {
            res.resume();
            if (res.statusCode === 200) resolve();
            else reject(new Error(`Unexpected status ${res.statusCode}`));
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error("Health check timed out"));
        });
    });
}

async function waitForBackend() {
    const started = Date.now();

    while (Date.now() - started < TIMEOUT_MS) {
        try {
            await checkHealth();
            console.log("Backend is ready. Starting frontend...");
            return;
        } catch {
            await new Promise((r) => setTimeout(r, INTERVAL_MS));
        }
    }

    console.error("Backend did not start within 60 seconds.");
    console.error("Make sure port 3000 is free and MongoDB is configured in Backend/.env");
    process.exit(1);
}

async function main() {
    await waitForBackend();

    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npmCmd, ["run", "dev:frontend"], {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
        shell: true,
    });

    child.on("exit", (code) => process.exit(code ?? 0));
}

main();
