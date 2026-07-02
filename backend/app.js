//password =khYUy5jxGOLuLeiV

const express = require("express");
const mongoose = require("mongoose");
const route = require("./Route/UserRoute")

const app = express();
const cors = require('cors');

//Middleware
app.use(express.json());
app.use(cors());
app.use("/users",route);


mongoose.connect("mongodb://admin:khYUy5jxGOLuLeiV@ac-3mwk9wg-shard-00-00.lubzwkq.mongodb.net:27017,ac-3mwk9wg-shard-00-01.lubzwkq.mongodb.net:27017,ac-3mwk9wg-shard-00-02.lubzwkq.mongodb.net:27017/?ssl=true&replicaSet=atlas-hrf414-shard-0&authSource=admin&appName=Cluster0")
    .then(() => console.log("Connect mongo db"))
    .then(() => {
        app.listen(5000, () => console.log("Server running on port 5000"));
    })
    .catch((error) => console.log(error));
    