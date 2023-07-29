const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
require("dotenv").config();

//socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

io.on("connection", (socket) => {
  console.log("socket connected");

  socket.on("test", () => {
    console.log("test");
  });

  socket.on("game ended", () => {
    console.log("game ended");
  })
});