const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
require("dotenv").config();
const Joi = require('joi');
const crypto = require('crypto');

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
    const validation = userSchema.validate({
      name: name,
      roomId: roomId,
      sessionId: sessionId
    });

    if (validation.error) {
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      const data = validation.value;

      try {
        if (!check.sessIdExists(sessionId)) {
          const info = store.newUser(data.sessionId, data.name, data.roomId);
          console.log(info);
        } else {
          socket.emit("found error", "already logged in");
        }
      } catch (error) {
        console.log(error);
        socket.emit("found error", "error while storing user data");
      }
      // TODO worked out, finish here
    }
  });

  socket.on("create room", (name, sessionId) => {
    const validation = userSchema.validate({
      name: name,
      sessionId: sessionId
    });

    if (validation.error) {
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      const data = validation.value;
      const room = crypto.randomInt(100000, 1000000);
      const newUser = store.newUser(sessionId, name, "");
      const newRoom = store.newRoom(newUser.lastInsertRowid, room);
      const updatedUser = store.upadateUserRoom(newUser.lastInsertRowid, newRoom.lastInsertRowid);
      // TODO finished creating room in database
    }
  });

  socket.on("game ended", () => {
    console.log("game ended", socket.profile);
  });

});

// validation schemas 
// TODO maybe put these schemas in an extra file

const userSchema = Joi.object({
  name: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  roomId: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .label("room id"),
  sessionId: Joi.string()
    .trim()
    .alphanum()
    .required()
    .label("session id"),
});