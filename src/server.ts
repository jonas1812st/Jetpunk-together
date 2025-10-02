import express from "express";
import { join } from "node:path";
import { createServer } from "node:http";
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs";
import { Server } from "socket.io";

// Load environment variables
config();

// Database services
import * as rooms from "./services/rooms";
import * as users from "./services/users";
import * as check from "./services/check";

// Validation schemas
import { loginSchema, roomSchema, userSchema } from "./services/schemas";

// Types
interface SocketProfile {
  sessionId?: string;
  id?: number;
  roomId?: number;
  roomCode?: string;
  isAdmin?: boolean;
}

interface DisconnectedUser {
  sessionId: string;
  timeout: NodeJS.Timeout;
}

// Express app setup
const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use("/assets", express.static(join(__dirname, "..", "..", "assets")));

// Routes
app.get("/jetpunk_together", (req, res) => {
  readFile(
    join(__dirname, "..", "..", "assets", "tampermonkey", "index.user.js"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      res.setHeader("Content-Type", "text/javascript");
      res.send(data.replaceAll("YOUR_SERVER_URL", process.env.HOST_SERVER || ""));
    },
  );
});

app.get("/jetpunk_together.user.js", (req, res) => {
  readFile(
    join(__dirname, "..", "..", "assets", "tampermonkey", "index.user.js"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      res.setHeader("Content-Type", "text/javascript");
      res.send(data.replaceAll("YOUR_SERVER_URL", process.env.HOST_SERVER || ""));
    },
  );
});

// Start server
server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

// Socket.io logic
let disconnectedUsers: DisconnectedUser[] = [];

io.on("connection", (socket) => {
  (socket as any).profile = {} as SocketProfile;

  socket.on("login", (sessionId: string) => {
    const validation = loginSchema.validate({
      sessionId: sessionId,
    });

    if (validation.error) {
      console.log("found error while authenticating");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
      return false;
    }

    (socket as any).profile.sessionId = sessionId;

    // check if user disconnected less than 5 seconds ago
    const disconnectedSessionIds = disconnectedUsers.map((el) => el.sessionId);
    if (disconnectedSessionIds.includes(sessionId)) {
      const index = disconnectedSessionIds.indexOf(sessionId);
      clearTimeout(disconnectedUsers[index].timeout);
      disconnectedUsers.splice(index, 1);
    }

    const user = users.getUser(sessionId);
    if (user) {
      const ownRoom = rooms.isOwner(user.id);
      if (ownRoom && !rooms.gameStarted(ownRoom.id)) {
        const participants = rooms.getParticipants(ownRoom.id);
        socket.join(ownRoom.room);
        (socket as any).profile.id = user.id;
        (socket as any).profile.roomId = ownRoom.id;
        (socket as any).profile.roomCode = ownRoom.room;
        (socket as any).profile.isAdmin = true;

        socket.emit(
          "connected to room",
          {
            id: user.id,
            username: user.username,
            isAdmin: true,
            ready: 1,
          },
          {
            code: ownRoom.room,
            quiz: ownRoom.quiz,
            state: ownRoom.state,
            participants: participants.map((el) => ({
              id: el.id,
              username: el.username,
              ready: el.ready,
            })),
          },
        );
      } else if (ownRoom && rooms.gameStarted(ownRoom.id)) {
        socket.emit(
          "found error",
          "the game you want to join has already started",
        );
      } else {
        const joinedRoom = rooms.getRoomById(user.room);
        if (joinedRoom && !rooms.gameStarted(joinedRoom.id)) {
          socket.join(joinedRoom.room);
          (socket as any).profile.id = user.id;
          (socket as any).profile.roomId = user.room;
          (socket as any).profile.roomCode = joinedRoom.room;
          (socket as any).profile.isAdmin = false;

          socket.emit(
            "connected to room",
            {
              id: user.id,
              username: user.username,
              isAdmin: false,
              ready: user.ready,
            },
            {
              code: joinedRoom.room,
              quiz: joinedRoom.quiz,
              state: joinedRoom.state,
            },
          );
        } else {
          socket.emit(
            "found error",
            "the game you want to join has already started",
          );
        }
      }
    } else {
      socket.emit("log in");
    }
  });

  socket.on("join room", (name: string, roomId: string, quiz: string) => {
    const validation = userSchema.validate({
      name: name,
      roomId: roomId,
      quiz: quiz,
    });

    if (validation.error) {
      console.log("found error in join room");
      const errorMessage = validation.error.details[0].message;
      console.log(errorMessage);
      socket.emit("found error", errorMessage);
    } else {
      const data = validation.value;

      try {
        if (!check.sessIdExists((socket as any).profile.sessionId)) {
          const room = rooms.getRoom(data.roomId);
          if (!room) {
            socket.emit("found error", "room not found");
          } else if (!rooms.gameStarted(room.id)) {
            const newUser = users.newUser(
              (socket as any).profile.sessionId,
              data.name,
              room.id.toString(),
              0,
            );

            io.to(data.roomId).emit("new user", {
              id: newUser.lastInsertRowid,
              username: data.name,
              ready: 0,
            });

            socket.join(data.roomId);
            (socket as any).profile.id = newUser.lastInsertRowid;
            (socket as any).profile.roomId = room.id;
            (socket as any).profile.roomCode = data.roomId;
            (socket as any).profile.isAdmin = false;

            socket.emit(
              "connected to room",
              {
                id: newUser.lastInsertRowid,
                username: data.name,
                isAdmin: false,
                ready: 0,
              },
              {
                code: room.room,
                quiz: room.quiz,
                state: room.state,
              },
            );
          } else {
            socket.emit(
              "found error",
              "the game you want to join has already started",
            );
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

  socket.on("create room", (name: string, quiz: string) => {
    const validation = roomSchema.validate({
      name: name,
      quiz: quiz,
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
          socket.emit(
            "found error",
            "please navigate to a quiz to create a room",
          );
          return false;
        }
        const room = randomBytes(3).toString("hex").toUpperCase();
        const newUser = users.newUser(
          (socket as any).profile.sessionId,
          data.name,
          "",
          1,
        );
        const newRoom = rooms.newRoom(Number(newUser.lastInsertRowid), room, data.quiz);
        const updatedUser = rooms.updateUserRoom(
          Number(newUser.lastInsertRowid),
          Number(newRoom.lastInsertRowid),
        );
        const participants = rooms.getParticipants(Number(newRoom.lastInsertRowid));

        socket.join(room);
        (socket as any).profile.id = newUser.lastInsertRowid;
        (socket as any).profile.roomId = newRoom.lastInsertRowid;
        (socket as any).profile.roomCode = room;
        (socket as any).profile.isAdmin = true;

        socket.emit(
          "connected to room",
          {
            id: newUser.lastInsertRowid,
            username: data.name,
            isAdmin: true,
            ready: 1,
          },
          {
            code: room,
            quiz: data.quiz,
            state: "waiting",
            participants: participants.map((el) => ({
              id: el.id,
              username: el.username,
              ready: el.ready,
            })),
          },
        );
      } catch (error) {
        console.log(error);
        socket.emit("found error", "error while creating room");
      }
    }
  });

  socket.on("ready", () => {
    try {
      const currentState = users.getUserReady((socket as any).profile.sessionId);

      if (currentState) {
        users.setReadyState((socket as any).profile.sessionId, 0);
        io.to((socket as any).profile.roomCode).emit("user unready", (socket as any).profile.id);
      } else {
        users.setReadyState((socket as any).profile.sessionId, 1);
        io.to((socket as any).profile.roomCode).emit("user ready", (socket as any).profile.id);
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing ready state of user");
    }
  });

  socket.on("start game", () => {
    if (check.usersReady((socket as any).profile.roomId)) {
      try {
        rooms.setRoomState((socket as any).profile.roomId, "started");

        io.to((socket as any).profile.roomCode).emit("game started");
      } catch (error) {
        console.log(error);
        socket.emit(
          "found error",
          "error while changing state of game to 'started'",
        );
      }
    } else {
      console.log("not all players in room are ready to start");
      socket.emit("found error", "not all players in room are ready to start");
    }
  });

  socket.on("changing quiz", () => {
    try {
      if ((socket as any).profile.isAdmin) {
        rooms.setRoomState((socket as any).profile.roomId, "changing");
      }
    } catch (error) {
      console.log(error);
      socket.emit(
        "found error",
        "error while changing state of game to 'changing'",
      );
    }
  });

  socket.on("change quiz", (quiz: string) => {
    try {
      if (check.isQuiz(quiz)) {
        rooms.setRoomQuiz((socket as any).profile.roomId, quiz);
        rooms.setRoomState((socket as any).profile.roomId, "waiting");

        users.unreadyUsers((socket as any).profile.roomId, (socket as any).profile.id);

        io.to((socket as any).profile.roomCode).emit("quiz changed", quiz);
      } else {
        socket.emit(
          "found error",
          "please navigate to a quiz and press 'Change quiz'",
        );
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while changing quiz of game");
    }
  });

  socket.on("leave game", () => {
    io.to((socket as any).profile.roomCode).emit("user disconnected", {
      id: (socket as any).profile.id,
      isAdmin: (socket as any).profile.isAdmin,
    });

    if ((socket as any).profile.isAdmin) {
      rooms.removeRoom((socket as any).profile.roomId);
      users.removeByRoom((socket as any).profile.roomId);
    } else {
      users.removeUser((socket as any).profile.sessionId);
    }
  });

  socket.on("finished quiz", (score: number, possible: number) => {
    try {
      users.setUserScore((socket as any).profile.sessionId, score, possible);

      io.to((socket as any).profile.roomCode).emit("user finished quiz", (socket as any).profile.id);

      if (check.usersFinished((socket as any).profile.roomId)) {
        rooms.setRoomState((socket as any).profile.roomId, "ended");
        io.to((socket as any).profile.roomCode).emit("all users finished");
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while setting user score");
    }
  });

  socket.on("reveal scores", () => {
    try {
      const scores = users.getScores((socket as any).profile.roomId);
      io.to((socket as any).profile.roomCode).emit("reveal scores", scores);
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while revealing scores");
    }
  });

  socket.on("restart game", () => {
    try {
      if ((socket as any).profile.isAdmin) {
        rooms.setRoomState((socket as any).profile.roomId, "waiting");
        rooms.resetScores((socket as any).profile.roomId);
        users.unreadyUsers((socket as any).profile.roomId, (socket as any).profile.id);

        io.to((socket as any).profile.roomCode).emit("game restarted");
      }
    } catch (error) {
      console.log(error);
      socket.emit("found error", "error while restarting game");
    }
  });

  socket.on("disconnect", () => {
    if ((socket as any).profile.sessionId) {
      disconnectedUsers.push({
        sessionId: (socket as any).profile.sessionId,
        timeout: setTimeout(() => {
          const sessionId = (socket as any).profile.sessionId;
          const index = disconnectedUsers.findIndex(
            (user) => user.sessionId === sessionId
          );
          if (index !== -1) {
            disconnectedUsers.splice(index, 1);
          }

          if ((socket as any).profile.isAdmin) {
            rooms.removeRoom((socket as any).profile.roomId);
            users.removeByRoom((socket as any).profile.roomId);
          } else if ((socket as any).profile.id) {
            users.removeUser((socket as any).profile.sessionId);
          }

          io.to((socket as any).profile.roomCode).emit("user disconnected", {
            id: (socket as any).profile.id,
            isAdmin: (socket as any).profile.isAdmin,
          });
        }, 5000),
      });
    }
  });
});