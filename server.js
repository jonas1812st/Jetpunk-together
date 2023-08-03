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
  socket.profile = {};

  socket.on("login", (sessionId) => {
    const validation = loginSchema.validate({
      sessionId: sessionId
    });

    if (validation.error) {
      console.log("found error while authenticating");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);

      return false;
    }

    socket.profile.sessionId = sessionId;

    const user = users.getUser(sessionId);
    if (user) {
      const ownRoom = rooms.isOwner(user.id);
      if (ownRoom) {
        const participants = rooms.getParticipants(ownRoom.id);
        socket.join(ownRoom.room);
        socket.profile.id = user.id;
        socket.profile.roomId = ownRoom.id;
        socket.profile.roomCode = ownRoom.room;
        socket.emit("logged in", {
          id: user.id,
          username: user.username,
          isAdmin: true
        }, {
          code: ownRoom.room,
          quiz: ownRoom.quiz,
          participants: participants.map(el => ({
            id: el.id,
            username: el.username,
            ready: el.ready
          }))
        });
      } else {
        const joinedRoom = rooms.getRoomById(user.room);
        socket.join(joinedRoom.room);
        socket.profile.id = user.id;
        socket.profile.roomId = user.room;
        socket.profile.roomCode = joinedRoom.room;
        socket.emit("logged in", {
          id: user.id,
          username: user.username,
          isAdmin: false
        }, {
          code: joinedRoom.room,
          quiz: joinedRoom.quiz
        });
      }

    } else {
      socket.emit("log in");
    };
  });

  socket.on("join room", (name, roomId, quiz) => {
    const validation = userSchema.validate({
      name: name,
      roomId: roomId,
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
        if (!check.sessIdExists(socket.profile.sessionId)) {
          const room = rooms.getRoom(data.roomId);
          if (!room) {
            socket.emit("found error", "room not found");
          } else {
            const info = users.newUser(socket.profile.sessionId, data.name, room.id, 0);
            console.log(info);

            io.to(data.roomId).emit("new user", ({
              id: info.lastInsertRowid,
              username: data.name,
              ready: 0
            }));

            socket.join(data.roomId);
            socket.profile.id = info.lastInsertRowid;
            socket.profile.roomId = room.id;
            socket.profile.roomCode = data.roomId;


            socket.emit("connected to room", {
              id: info.lastInsertRowid,
              username: data.name,
              isAdmin: false
            }, {
              code: room.room,
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

  socket.on("create room", (name, quiz) => {
    const validation = roomSchema.validate({
      name: name,
      quiz: quiz
    });

    if (validation.error) {
      console.log("found error in create room");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      // store all infos in database
      try {
        const data = validation.value;
        const room = crypto.randomBytes(3).toString("hex").toUpperCase();
        const newUser = users.newUser(socket.profile.sessionId, data.name, "", 1);
        const newRoom = rooms.newRoom(newUser.lastInsertRowid, room, data.quiz);
        const updatedUser = rooms.updateUserRoom(newUser.lastInsertRowid, newRoom.lastInsertRowid);
        const participants = rooms.getParticipants(newRoom.lastInsertRowid);

        socket.join(room);
        socket.profile.id = newUser.lastInsertRowid;
        socket.profile.roomId = newRoom.lastInsertRowid;
        socket.profile.roomCode = room;

        // let user know about connection
        socket.emit("connected to room", {
          id: newUser.lastInsertRowid,
          username: data.name,
          isAdmin: true
        }, {
          code: room,
          quiz: data.quiz,
          participants: participants.map(el => ({
            id: el.id,
            username: el.username,
            ready: el.ready
          }))
        });
      } catch (error) {
        console.log(error);
        socket.emit("found error", "error while storing user and room data");
      }
    }
  });

  socket.on("ready", () => {
    try {
      const changedState = users.userReadyState(socket.profile.sessionId, 1);
      socket.profile.ready = 1;

      io.to(socket.profile.roomCode).emit("user ready", socket.profile.id);
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing ready state of user");
    }

  })

  socket.on("game ended", () => {
    console.log("game ended", socket.profile);
  });

  socket.on("test", () => {
    console.log(socket.profile);
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
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});

// TODO combine the schemas in one single schema that works for all
const roomSchema = Joi.object({
  name: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});

const loginSchema = Joi.object({
  sessionId: Joi.string()
    .trim()
    .alphanum()
    .required()
    .label("session id")
});