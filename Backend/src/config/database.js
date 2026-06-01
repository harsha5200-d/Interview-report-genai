const mongoose = require("mongoose");

require("dotenv").config();

let listenersAttached = false;

function attachConnectionListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    mongoose.connection.on("connected", () => console.log("Mongoose: connected"));
    mongoose.connection.on("error", (err) =>
        console.error("Mongoose: connection error", err.message)
    );
    mongoose.connection.on("disconnected", () => console.log("Mongoose: disconnected"));
}

function buildConnectionOptions(uri) {
    const options = {
        serverSelectionTimeoutMS: 15000,
    };

    const usesTls =
        uri.startsWith("mongodb+srv://") ||
        uri.includes("ssl=true") ||
        uri.includes("tls=true");

    if (usesTls) {
        options.tls = true;

        const allowInsecureTls =
            process.env.MONGODB_TLS_INSECURE === "true" ||
            (process.env.NODE_ENV !== "production" &&
                process.env.MONGODB_TLS_INSECURE !== "false");

        if (allowInsecureTls) {
            options.tlsAllowInvalidCertificates = true;
        }
    }

    return options;
}

async function connectDB() {
    const uri = process.env.MONGO_URI?.trim();

    if (!uri) {
        throw new Error("MONGO_URI is not set in Backend/.env");
    }

    attachConnectionListeners();

    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        await mongoose.connect(uri, buildConnectionOptions(uri));
        console.log("Connected to database");
        return mongoose.connection;
    } catch (err) {
        console.error("Database connection failed:", err.message);

        if (err.message?.includes("whitelist") || err.message?.includes("IP")) {
            console.error(
                "\n→ MongoDB Atlas: open Network Access and add your current IP (or 0.0.0.0/0 for local dev only).\n"
            );
        }

        if (
            err.message?.includes("certificate") ||
            err.message?.includes("TLS") ||
            err.message?.includes("SSL")
        ) {
            console.error(
                "→ TLS error on Windows: add MONGODB_TLS_INSECURE=true to Backend/.env for local development.\n"
            );
        }

        if (uri.startsWith("mongodb+srv://")) {
            console.error(
                "→ Tip: use the standard mongodb:// connection string from Atlas (not mongodb+srv) on Windows.\n"
            );
        }

        throw err;
    }
}

module.exports = connectDB;
