const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const HEALTH_URL = "http://localhost:3000/api/health";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

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

async function waitForBackend(timeoutMs = 60_000) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        try {
            await checkHealth();
            return;
        } catch {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    throw new Error("Backend did not become ready in time.");
}

function run(command, args, name) {
    const child = spawn(command, args, {
        cwd: root,
        stdio: "inherit",
        shell: true,
        env: process.env,
    });

    child.on("exit", (code, signal) => {
        if (signal) {
            console.log(`[${name}] stopped (${signal})`);
        } else if (code !== 0 && code !== null) {
            console.error(`[${name}] exited with code ${code}`);
        }
    });

    return child;
}

async function main() {
    console.log("Starting backend...");
    const backend = run(npmCmd, ["run", "dev:backend"], "backend");

    try {
        await waitForBackend();
        console.log("Backend is ready. Starting frontend...");
    } catch (err) {
        console.error(err.message);
        backend.kill("SIGTERM");
        process.exit(1);
    }

    const frontend = run(npmCmd, ["run", "dev:frontend"], "frontend");

    const shutdown = () => {
        frontend.kill("SIGTERM");
        backend.kill("SIGTERM");
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    frontend.on("exit", (code) => {
        backend.kill("SIGTERM");
        process.exit(code ?? 0);
    });

    backend.on("exit", (code) => {
        if (code !== 0 && code !== null) {
            console.error("Backend stopped unexpectedly.");
            frontend.kill("SIGTERM");
            process.exit(code);
        }
    });
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
