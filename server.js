const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
require("dotenv").config();
const crypto = require('crypto');
const fs = require("fs");

// database
const rooms = require("./services/rooms");
const users = require("./services/users");
const check = require("./services/check");

// validation schemas
const { loginSchema, roomSchema, userSchema } = require("./services/schemas");

//socket.io
const server = http.createServer(app);
const {
  Server
} = require("socket.io");
const io = new Server(server);

// serve static files
app.use("/assets", express.static(path.join(__dirname, "./assets")));

app.get("/jetpunk_together", (req, res) => {
  fs.readFile(path.join(__dirname, "assets", "tampermonkey", "index.user.js"), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    res.setHeader('Content-Type', 'text/javascript');
    res.send(data.replaceAll("YOUR_SERVER_URL", process.env.HOST_SERVER));
  });
});

app.get("/jetpunk_together.user.js", (req, res) => {
  fs.readFile(path.join(__dirname, "assets", "tampermonkey", "index.user.js"), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    res.setHeader('Content-Type', 'text/javascript');
    res.send(data.replaceAll("YOUR_SERVER_URL", process.env.HOST_SERVER));
  });
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

var disconnectedUsers = [];

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

    // check if user disconnected less than 5 seconds ago
    const disconnectedSessionIds = disconnectedUsers.map(el => el.sessionId);
    if (disconnectedSessionIds.includes(sessionId)) {
      const index = disconnectedSessionIds.indexOf(sessionId)
      clearTimeout(disconnectedUsers[index].timeout);
      disconnectedUsers.splice(index, 1);
    };

    const user = users.getUser(sessionId);
    if (user) {
      const ownRoom = rooms.isOwner(user.id);
      if (ownRoom && !rooms.gameStarted(ownRoom.id)) {
        const participants = rooms.getParticipants(ownRoom.id);
        socket.join(ownRoom.room);
        socket.profile.id = user.id;
        socket.profile.roomId = ownRoom.id;
        socket.profile.roomCode = ownRoom.room;
        socket.profile.isAdmin = true;

        socket.emit("connected to room", {
          id: user.id,
          username: user.username,
          isAdmin: true,
          ready: 1
        }, {
          code: ownRoom.room,
          quiz: ownRoom.quiz,
          state: ownRoom.state,
          participants: participants.map(el => ({
            id: el.id,
            username: el.username,
            ready: el.ready
          }))
        });
      } else if (ownRoom && rooms.gameStarted(ownRoom.id)) {
        socket.emit("found error", "the game you want to join has already started");
      } else {
        const joinedRoom = rooms.getRoomById(user.room);
        if (!rooms.gameStarted(joinedRoom.id)) {
          socket.join(joinedRoom.room);
          socket.profile.id = user.id;
          socket.profile.roomId = user.room;
          socket.profile.roomCode = joinedRoom.room;
          socket.profile.isAdmin = false;

          socket.emit("connected to room", {
            id: user.id,
            username: user.username,
            isAdmin: false,
            ready: user.ready
          }, {
            code: joinedRoom.room,
            quiz: joinedRoom.quiz,
            state: joinedRoom.state
          });
        } else {
          socket.emit("found error", "the game you want to join has already started");
        }
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
          } else if (!rooms.gameStarted(room.id)) {
            const newUser = users.newUser(socket.profile.sessionId, data.name, room.id, 0);

            io.to(data.roomId).emit("new user", ({
              id: newUser.lastInsertRowid,
              username: data.name,
              ready: 0
            }));

            socket.join(data.roomId);
            socket.profile.id = newUser.lastInsertRowid;
            socket.profile.roomId = room.id;
            socket.profile.roomCode = data.roomId;
            socket.profile.isAdmin = false;

            socket.emit("connected to room", {
              id: newUser.lastInsertRowid,
              username: data.name,
              isAdmin: false,
              ready: 0
            }, {
              code: room.room,
              quiz: room.quiz,
              state: room.state
            });
          } else {
            socket.emit("found error", "the game you want to join has already started");
          }
        } else {
          socket.emit("found error", "already logged in");
        }
      } catch (error) {
        console.log(error);
        socket.emit("found error", "error while storing user data");
      }
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
        if (!check.isQuiz(data.quiz)) {
          socket.emit("found error", "please navigate to a quiz to create a room");
          return false;
        }
        const room = crypto.randomBytes(3).toString("hex").toUpperCase();
        const newUser = users.newUser(socket.profile.sessionId, data.name, "", 1);
        const newRoom = rooms.newRoom(newUser.lastInsertRowid, room, data.quiz);
        const updatedUser = rooms.updateUserRoom(newUser.lastInsertRowid, newRoom.lastInsertRowid);
        const participants = rooms.getParticipants(newRoom.lastInsertRowid);

        socket.join(room);
        socket.profile.id = newUser.lastInsertRowid;
        socket.profile.roomId = newRoom.lastInsertRowid;
        socket.profile.roomCode = room;
        socket.profile.isAdmin = true;

        // let user know about connection
        socket.emit("connected to room", {
          id: newUser.lastInsertRowid,
          username: data.name,
          isAdmin: true,
          ready: 1
        }, {
          code: room,
          quiz: data.quiz,
          state: "waiting",
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
      const room = rooms.getRoomById(socket.profile.roomId);
      if (!users.getUserReady(socket.profile.sessionId)) {
        users.setReadyState(socket.profile.sessionId, 1);
        io.to(socket.profile.roomCode).emit("user ready", socket.profile.id);
      } else {
        users.setReadyState(socket.profile.sessionId, 0);
        io.to(socket.profile.roomCode).emit("user unready", socket.profile.id);
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing ready state of user");
    }
  });

  socket.on("start game", () => {
    if (check.usersReady(socket.profile.roomId)) {
      try {
        rooms.setRoomState(socket.profile.roomId, "started");

        io.to(socket.profile.roomCode).emit("game started");

      } catch (error) {
        console.log(error);
        socket.emit("found error", "error while changing state of game to 'started'");
      }
    } else {
      console.log("not all players in room are ready to start");
      socket.emit("found error", "not all players in room are ready to start");
    }
  });

  socket.on("changing quiz", () => {
    try {
      if (socket.profile.isAdmin) {
        rooms.setRoomState(socket.profile.roomId, "changing");
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing state of game to 'changing'");
    }
  });

  socket.on("change quiz", quiz => {
    try {
      if (check.isQuiz(quiz)) {
        rooms.setRoomQuiz(socket.profile.roomId, quiz);
        rooms.setRoomState(socket.profile.roomId, "waiting");

        users.unreadyUsers(socket.profile.roomId, socket.profile.id);

        io.to(socket.profile.roomCode).emit("quiz changed", quiz);
      } else {
        socket.emit("found error", "please navigate to a quiz and press 'Change quiz'");
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing quiz of game");
    }
  });

  socket.on("leave game", () => {
    io.to(socket.profile.roomCode).emit("user disconnected", {
      id: socket.profile.id,
      isAdmin: socket.profile.isAdmin
    });

    if (socket.profile.isAdmin) {
      rooms.removeRoom(socket.profile.roomId);
      users.removeByRoom(socket.profile.roomId);
    } else {
      users.removeUser(socket.profile.sessionId);
    }

    if (check.usersFinished(socket.profile.roomId)) {
      rooms.setRoomState(socket.profile.roomId, "ended");

      io.to(socket.profile.roomCode).emit("game has ended");
    }

    socket.profile = {};
  });

  socket.on("disconnect", () => {
    if (socket.profile.roomCode) {
      // set ready state to 0
      if (!socket.profile.isAdmin && users.getUserReady(socket.profile.sessionId) && !rooms.gameStarted(socket.profile.roomId)) {
        users.setReadyState(socket.profile.sessionId, 0);
        io.to(socket.profile.roomCode).emit("user unready", socket.profile.id);
      } else if (users.getUserReady(socket.profile.sessionId) && rooms.gameStarted(socket.profile.roomId)) {
        // remove user or host and the connected users instantly if the game has started;
        io.to(socket.profile.roomCode).emit("user disconnected", {
          id: socket.profile.id,
          isAdmin: socket.profile.isAdmin
        });

        if (socket.profile.isAdmin) {
          rooms.removeRoom(socket.profile.roomId);
          users.removeByRoom(socket.profile.roomId);
        } else {
          users.removeUser(socket.profile.sessionId);
        }

        if (check.usersFinished(socket.profile.roomId)) {
          rooms.setRoomState(socket.profile.roomId, "ended");
    
          io.to(socket.profile.roomCode).emit("game has ended");
        }

        return false;
      }

      // remove user after 5 seconds if he doesn't reconnect.
      disconnectedUsers.push({
        sessionId: socket.profile.sessionId,
        timeout: setTimeout(() => {
          try {
            io.to(socket.profile.roomCode).emit("user disconnected", {
              id: socket.profile.id,
              isAdmin: socket.profile.isAdmin
            });

            if (socket.profile.isAdmin) {
              rooms.removeRoom(socket.profile.roomId);
              users.removeByRoom(socket.profile.roomId);
            } else {
              users.removeUser(socket.profile.sessionId);
            }
          } catch (error) {
            console.log(error);
            socket.emit("found error", "error while disconnecting user");
          }
        }, 5000)
      });
    }
  });

  socket.emit("reset profile", () => {
    socket.profile = {
      sessionId: socket.profile.sessionId
    };
  });

  socket.on("game ended", (game) => {
    users.setUserScore(socket.profile.sessionId, game.score, game.possible);

    if (check.usersFinished(socket.profile.roomId)) {
      rooms.setRoomState(socket.profile.roomId, "ended");

      io.to(socket.profile.roomCode).emit("game has ended");
    }
  });

  socket.on("reveal scores", () => {
    if (check.usersFinished(socket.profile.roomId)) {
      rooms.setRoomState(socket.profile.roomId, "ended");
      const allScores = users.getScores(socket.profile.roomId);

      io.to(socket.profile.roomCode).emit("show scores", allScores);
    } else {
      socket.emit("found error", "not all players finished their quiz yet");
    }
  });

  socket.on("restart game", () => {
    try {
      rooms.setRoomState(socket.profile.roomId, "waiting");

      users.unreadyUsers(socket.profile.roomid, socket.profile.id);
      rooms.resetScores(socket.profile.roomId);

      io.to(socket.profile.roomCode).emit("game restarted");
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while restarting game");
    }
  });

  socket.on("test", () => {
    console.log(socket.profile);
  });

});