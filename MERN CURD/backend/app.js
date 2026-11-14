// panndkumpu1922_db_user
// GXVsYss7QjirazBN

// mongodb+srv://<db_username>:GXVsYss7QjirazBN@cluster0.w08urdq.mongodb.net/?appName=Cluster0

const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

const express = require("express");
const mongoose = require("mongoose");
const route = require("./Route/UserRoute");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/users", route);

mongoose.connect("mongodb+srv://panndkumpu1922_db_user:GXVsYss7QjirazBN@cluster0.w08urdq.mongodb.net/")
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:");
        console.error(error);
    });
    



