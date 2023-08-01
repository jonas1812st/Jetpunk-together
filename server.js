const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
require("dotenv").config();
const Joi = require('joi');
const crypto = require('crypto');

// database
const rooms = require("./services/rooms");
const users = require("./services/users");
const check = require("./services/check");

//socket.io
const server = http.createServer(app);
const {
  Server
} = require("socket.io");
const io = new Server(server);

// serve static files
app.use("/assets", express.static(path.join(__dirname, "./assets")));

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});


io.on("connection", (socket) => {

  console.log("socket connected", socket.id);

  socket.on("login", sessionId => {
    const user = getUser(sessionId);
    if(user){
      socket.emit("logged in", user);
    };
  });

  socket.on("join room", (name, roomId, sessionId, quiz) => {
    const validation = userSchema.validate({
      name: name,
      roomId: roomId,
      sessionId: sessionId,
      quiz: quiz
    });

    if (validation.error) {
      console.log("found error in join room");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      const data = validation.value;

      try {
        if (!check.sessIdExists(sessionId)) {
          const room = rooms.getRoom(data.roomId);
          if (!room) {
            socket.emit("found error", "room not found");
          } else {
            const info = users.newUser(data.sessionId, data.name, room.id);
            console.log(info);

            socket.join(data.roomId);

            socket.emit("connected to room", {
              isAdmin: false,
              quiz: room.quiz
            });
          }
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

  socket.on("create room", (name, sessionId, quiz) => {
    const validation = roomSchema.validate({
      name: name,
      sessionId: sessionId,
      quiz: quiz
    });

    if (validation.error) {
      console.log("found error in create room");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      // store all infos in database
      const data = validation.value;
      const room = crypto.randomBytes(3).toString("hex").toUpperCase();
      const newUser = users.newUser(data.sessionId, data.name, "");
      const newRoom = rooms.newRoom(newUser.lastInsertRowid, room, data.quiz);
      const updatedUser = rooms.updateUserRoom(newUser.lastInsertRowid, newRoom.lastInsertRowid);

      socket.join(room);

      // let user know about connection
      socket.emit("connected to room", {
        isAdmin: true,
        quiz: data.quiz
      });
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
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});

// TODO combine roomSchema and userSchema in one single schema that works for both
const roomSchema = Joi.object({
  name: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  sessionId: Joi.string()
    .trim()
    .alphanum()
    .required()
    .label("session id"),
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});