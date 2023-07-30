const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
require("dotenv").config();
const Joi = require('joi');

// database
const store = require("./services/store");

//socket.io
const server = http.createServer(app);
const {
  Server
} = require("socket.io");
const io = new Server(server);

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

io.on("connection", (socket) => {
  console.log("socket connected");
  socket.profile = {
    id: 3
  };

  socket.on("join room", (name, roomId, sessionId) => {
    //const info = store.insertUser(id);
    const schema = Joi.object({
      name: Joi.string()
        .trim()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
      "room id": Joi.string()
        .trim()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
      "session id": Joi.string()
        .trim()
        .alphanum()
        .required(),
    });

    const data = schema.validate({
      name: "jonas",
      "room id": "3>",
      "session id": undefined
    });

    if (data.error) {
      const errorMessage = data.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      console.log("joining room", data);
    }
  });

  socket.on("game ended", () => {
    console.log("game ended", socket.profile);
  });
});