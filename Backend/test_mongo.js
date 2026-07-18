require('dotenv').config();
const mongoose = require('mongoose');
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function test() {
    console.log("Testing MongoDB Connection...");
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB SUCCESS!");
        process.exit(0);
    } catch (err) {
        console.error("MongoDB ERROR:", err.message);
        process.exit(1);
    }
}
test();
