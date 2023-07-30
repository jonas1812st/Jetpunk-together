const check = require("../services/check");
const crypto = require("crypto");

setInterval(() => {
  const n = crypto.randomInt(100000, 1000000);
  console.log(n);
}, 100);