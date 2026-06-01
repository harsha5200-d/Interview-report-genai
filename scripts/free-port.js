const { execSync } = require("child_process");

const port = process.argv[2] || "3000";

function freePortWindows(targetPort) {
    try {
        const output = execSync(`netstat -ano | findstr ":${targetPort}"`, { encoding: "utf8" });
        const pids = new Set();

        for (const line of output.split("\n")) {
            if (!line.includes("LISTENING")) continue;
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && /^\d+$/.test(pid) && pid !== "0") {
                pids.add(pid);
            }
        }

        for (const pid of pids) {
            try {
                execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
                console.log(`Freed port ${targetPort} (stopped PID ${pid})`);
            } catch {
                // process may have already exited
            }
        }

        if (pids.size === 0) {
            console.log(`Port ${targetPort} is already free.`);
        }
    } catch {
        console.log(`Port ${targetPort} is already free.`);
    }
}

function freePortUnix(targetPort) {
    try {
        const output = execSync(`lsof -ti tcp:${targetPort}`, { encoding: "utf8" }).trim();
        if (!output) {
            console.log(`Port ${targetPort} is already free.`);
            return;
        }

        for (const pid of output.split("\n").filter(Boolean)) {
            execSync(`kill -9 ${pid}`, { stdio: "ignore" });
            console.log(`Freed port ${targetPort} (stopped PID ${pid})`);
        }
    } catch {
        console.log(`Port ${targetPort} is already free.`);
    }
}

if (process.platform === "win32") {
    freePortWindows(port);
} else {
    freePortUnix(port);
}
