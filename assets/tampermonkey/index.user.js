// ==UserScript==
// @name         Jetpunk together
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Script that allows you to play Jetpunk together
// @author       jonas1812st
// @match        https://www.jetpunk.com/*
// @icon         https://www.jetpunk.com/apple-touch-icon-152x152.png
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @updateURL    YOUR_SERVER_URL/jetpunk_together.user.js
// @downloadURL  YOUR_SERVER_URL/jetpunk_together.user.js
// @require      YOUR_SERVER_URL/socket.io/socket.io.js
// @resource css YOUR_SERVER_URL/assets/css/styles.css
// @require      https://code.jquery.com/jquery-3.7.0.min.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // load remote css
  const myCss = GM_getResourceText("css");
  GM_addStyle(myCss);

  // initialization
  const socket = io.connect("YOUR_SERVER_URL", {
    transports: ['websocket']
  });

  // set profile variable
  var profile = {};

  window.onload = () => {
    socket.emit("login", getCookie("PHPSESSID"));
    displayContainer();
    displayMsg("Authenticating...");

    // Options for the observer (which mutations to observe)
    if (document.getElementsByClassName("user-score")[0]) {
      $("#start-button").css("display", "none");

      const observerConfig = {
        characterData: false,
        attributes: false,
        childList: true,
        subtree: false
      };

      const observerGameEndedCallback = (mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === "childList") {
            if (profile.room.state === "started") {
              const score = $(".user-score").text();
              const possible = $(".num-answers").text();
              socket.emit("game ended", {
                score: score,
                possible: possible
              });

              if (!profile.isAdmin) {
                clearPlayGround();
                displayMsg("Finished. Waiting for others...");
              } else {
                clearContainer({
                  id: "startBtnContainer"
                });
                displayMsgIn({
                  id: "startBtnContainer",
                  msg: "Finished. Waiting for others..."
                });
              }
            }
          }
        }
      };

      const targetNodeGameEnded = document.getElementsByClassName("user-score")[0];

      // Create an observer instance linked to the callback function
      const observerGameEnded = new MutationObserver(observerGameEndedCallback);
      observerGameEnded.observe(targetNodeGameEnded, observerConfig);
    }
  };


  // display functions

  function displayContainer() {
    const container = createContainer();
    const outerContainer = $(".container.content");
    outerContainer.prepend(container);
  }

  function displayChanging() {
    const changing = createChangingQuiz();
    $("#playGround").append(changing);
  }

  function displayLoginForm() {
    const loginForm = createLoginForm();
    $("#playGround").append(loginForm);
  }

  function displayRoomUser() {
    const userDiv = createRoomUser();
    $("#playGround").append(userDiv);
  }

  function displayRoomOwner() {
    const adminDiv = createRoomOwner();
    $("#playGround").append(adminDiv);
  }

  function displayMsg(msg) {
    const paragraph = createMsg(msg);
    $("#playGround").append(paragraph);
  }

  function displayMsgIn(options) {
    const paragraph = createMsg(options.msg);

    if (options.id) {
      $("#" + options.id).append(paragraph);
    } else if (options.class) {
      $("." + options.class).append(paragraph);
    }
  }

  function clearPlayGround() {
    $("#playGround").html("");
  }

  function clearContainer(options) {
    if (options.id) {
      $("#" + options.id).html("");
    } else if (options.class) {
      $("." + options.class).html("");
    }
  }

  function createContainer() {
    const container = $("<div id='playGround' class='jt-container'>");

    return container;
  }

  function createLoginForm() {
    const loginContainer = $("<div id='loginDiv'>");

    const nameInput = $("<input placeholder='Enter your name' id='nameInput' type='text'>");
    if (profile.username) {
      nameInput.val(profile.username);
      profile = {};
    };
    loginContainer.append(nameInput);

    const roomIdInput = $("<input id='roomIdInput' type='password' placeholder='Enter room id (join)' class='jt-ml'>");
    loginContainer.append(roomIdInput);

    const roomIdBtn = $("<button class='jt-ml'>Join</button>");
    roomIdBtn.on("click", () => {
      handleJoinBtn();
    });
    loginContainer.append(roomIdBtn);

    const createRoomBtn = $("<button class='jt-ml'>Create room</button>");
    createRoomBtn.on("click", () => {
      handleCreateBtn();
    });
    loginContainer.append(createRoomBtn);

    return loginContainer;
  }

  function createReadyDisplay(ready) {
    if (ready) {
      return $("<span class='jt-ready'>ready</span>");
    } else {
      return $("<span>waiting...</span>");
    }
  }

  function createLeaveBtn() {
    if (!profile.isAdmin) {
      const leaveBtn = $("<button class='jt-ml btn red' id='leaveBtn'>Leave room</button>");
      leaveBtn.on("click", () => {
        handleLeaveBtn();
      });

      return leaveBtn;
    } else {
      const leaveBtn = $("<button class='jt-ml btn-sm red' id='leaveBtn'>Destroy room</button>");
      leaveBtn.on("click", () => {
        handleLeaveBtn();
      });

      return leaveBtn;
    }
  }

  function createScoreDisplay(score) {
    return $(`<span class='jt-font'>${score}</span>`);
  }

  function createDataTable(data) {
    const dataTable = $("<table border='1' class='jt-table'>");

    for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const tableRow = $("<tr>");
      for (var cellIndex = 0; cellIndex < data[rowIndex].length; cellIndex++) {
        const tableCell = $(rowIndex === 0 ? "<th>" : "<td>");
        if (typeof data[rowIndex][cellIndex] === "object") {
          if (data[rowIndex][cellIndex].content) tableCell.text(data[rowIndex][cellIndex].content);
          if (data[rowIndex][cellIndex].rowId) tableRow.attr("id", data[rowIndex][cellIndex].rowId);
          if (data[rowIndex][cellIndex].id) tableCell.attr("id", data[rowIndex][cellIndex].id);
          if (data[rowIndex][cellIndex].class) tableCell.addClass(data[rowIndex][cellIndex].class);
          if (data[rowIndex][cellIndex].html) tableCell.append(data[rowIndex][cellIndex].html);
        } else {
          tableCell.text(data[rowIndex][cellIndex]);
        }
        tableRow.append(tableCell);
      }
      dataTable.append(tableRow);
    }

    return dataTable;
  }

  function createDataTableRow(data) {
    const tableRow = $("<tr>");
    for (var cellIndex = 0; cellIndex < data.length; cellIndex++) {
      const tableCell = $("<td>");
      if (typeof data[cellIndex] === "object") {
        if (data[cellIndex].content) tableCell.text(data[cellIndex].content);
        if (data[cellIndex].rowId) tableRow.attr("id", data[cellIndex].rowId);
        if (data[cellIndex].id) tableCell.attr("id", data[cellIndex].id);
        if (data[cellIndex].class) tableCell.addClass(data[cellIndex].class);
        if (data[cellIndex].html) tableCell.append(data[cellIndex].html);
      } else {
        tableCell.text(data[cellIndex]);
      }
      tableRow.append(tableCell);
    }

    return tableRow;
  }

  function createMsg(msg) {
    const paragraph = $("<span class='jt-font'>");
    paragraph.html(msg);

    return paragraph;
  }

  function createLineBreak() {
    const lineBreak = $("</br>");

    return lineBreak;
  }

  function createChangeQuizBtn(classes) {
    const changeBtn = $(`<button class='${classes === undefined ? "jt-ml btn-sm green" : classes}' id='changeQuizBtn'>Change quiz</button>`);
    changeBtn.on("click", () => {
      handleChangeBtn();
    });

    return changeBtn;
  }

  function createCopyRoomBtn() {
    const copyBtn = $("<button class='btn-sm'>Copy code</button>");
    copyBtn.on("click", () => {
      handleCopyBtn();
    });

    return copyBtn;
  }

  function createRoomOwner() {
    const adminDiv = $("<div id='adminDiv' class='owner-panel'>");

    const panelTable = $("<table class='jt-table-panel'>");
    adminDiv.append(panelTable);
    const tableRow = $("<tr>");
    panelTable.append(tableRow);
    const tableCellLeft = $("<td>");
    tableRow.append(tableCellLeft);
    const tableCellRight = $("<td>");
    tableRow.append(tableCellRight);

    const dataTable = createDataTable([
      ["#", "Name", {
        content: "Ready",
        id: "stateCell"
      }]
    ].concat(profile.room.participants.map((el, index) => [{
      content: index + 1,
      class: "jt-list-index"
    }, {
      content: el.username,
      rowId: el.id
    }, {
      html: createReadyDisplay(el.ready),
      class: "jt-ready-display"
    }])));
    dataTable.attr("id", "playerList")
    tableCellLeft.append(dataTable);

    const topContainer = createPartingDiv();
    tableCellRight.append(topContainer);

    const copyBtn = createCopyRoomBtn();
    topContainer.append(copyBtn);

    const changeQuizBtn = createChangeQuizBtn();
    topContainer.append(changeQuizBtn);

    const leaveBtn = createLeaveBtn();
    topContainer.append(leaveBtn);

    const bottomContainer = createPartingDiv();
    bottomContainer.attr("id", "startBtnContainer");
    tableCellRight.append(bottomContainer);

    const startBtn = $("<button class='btn blue' id='startBtn'>Start</button>");
    startBtn.on("click", () => {
      handleStartBtn();
    });
    bottomContainer.append(startBtn);

    return adminDiv;
  }

  function createRoomUser() {
    const userDiv = $("<div id='userDiv' class='user-panel'>");

    const topContainer = createPartingDiv();
    userDiv.append(topContainer);

    const msg = createMsg("Press ready to start:");
    msg.attr("id", "readyInfo");
    topContainer.append(msg);

    const bottomContainer = createPartingDiv();
    userDiv.append(bottomContainer);

    const readyBtn = createReadyBtn();
    bottomContainer.append(readyBtn);

    const leaveBtn = createLeaveBtn();
    bottomContainer.append(leaveBtn);

    return userDiv;
  }

  function createPartingDiv() {
    const partingDiv = $("<div class='jt-parting-div'>");

    return partingDiv;
  }

  function createReadyBtn() {
    const readyBtn = $("<button class='btn orange' id='readyBtn'>Not ready</button>");
    if (!profile.ready) {
      changeReadyDisplay();
    }
    readyBtn.on("click", () => {
      handleReadyBtn(readyBtn);
    });

    return readyBtn;
  }

  function createChangingQuiz() {
    const changeDiv = $("<div id='changingDiv'>");

    const topContainer = createPartingDiv();
    changeDiv.append(topContainer);

    const msg = createMsg("Press to change quiz:");
    topContainer.append(msg);

    const bottomContainer = createPartingDiv();
    changeDiv.append(bottomContainer);

    const changeBtn = createChangeQuizBtn("btn orange");
    bottomContainer.append(changeBtn);

    return changeDiv;
  }

  function createRevealBtn() {
    const revealBtn = $("<button class='btn green' id='revealBtn'>Reveal scores</button>");
    revealBtn.on("click", () => {
      handleRevealBtn();
    });

    return revealBtn;
  }

  function createRestartBtn() {
    const restartBtn = $("<button class='btn blue' id='restartBtn'>Restart</button>");;
    restartBtn.on("click", () => {
      handleRestartBtn();
    });

    return restartBtn;
  }

  function changeReadyDisplay() {
    $("#readyInfo").text(profile.ready ? "Waiting for others..." : "Press ready to start:");
    $("#readyBtn").text(profile.ready ? "Not ready" : "Ready");
    if (profile.ready) {
      $("#readyBtn").addClass("orange").removeClass("green");
    } else {
      $("#readyBtn").addClass("green").removeClass("orange");
    }
  }

  function addPlayerList(player) {
    if (profile.isAdmin) {
      const lastTableIndex = Number($("#playerList tr:last-child td:first-child").text());
      const tableRow = createDataTableRow([{
        content: lastTableIndex + 1,
        class: "jt-list-index"
      }, {
        content: player.username,
        rowId: player.id
      }, {
        html: createReadyDisplay(player.ready),
        class: "jt-ready-display"
      }]);
      $("#playerList").append(tableRow);
      updateListIndex();
    }
  }

  function removePlayerList(userId) {
    if (profile.isAdmin) {
      const tableRow = $("#playerList tr#" + userId);
      tableRow.remove();
      updateListIndex()
    }
  }

  function playerDisconnected(user) {
    if (profile.isAdmin) {
      removePlayerList(user.id);
      // remove from profile variable
      const playerIndex = profile.room.participants.map(el => el.id).indexOf(user.id);
      profile.room.participants.splice(playerIndex, 1);
      updateStartBtn();
    } else if (user.isAdmin) {
      $("#readyInfo").text("Host disconnected. Redirecting to login page...");
      $("#readyBtn").remove();
      $("#leaveBtn").remove();

      socket.emit("reset profile");

      // display login page after 1,5 seconds
      setTimeout(() => {
        clearPlayGround();
        displayLoginForm();
      }, 1500);
    }
  }

  function setReadyState(userId, ready) {
    if (profile.isAdmin) {
      const tableCell = $("#playerList tr#" + userId + " .jt-ready-display");
      const readyDisplay = createReadyDisplay(ready);
      tableCell.html(readyDisplay);

      const player = profile.room.participants.find(player => player.id === userId);
      if (player) player.ready = ready;

      updateStartBtn();
    }
  }

  function updateStartBtn() {
    if (profile.room.participants.map(el => el.ready).includes(0) || profile.room.participants.length === 1) {
      $("#startBtn").prop("disabled", true).addClass("jt-btn-disabled");
    } else {
      $("#startBtn").prop("disabled", false).removeClass("jt-btn-disabled");
    }
  }

  function updateListIndex() {
    $(".jt-list-index").each(function (index) {
      $(this).text(index + 1);
    });
  }

  // room functions

  function joinedRoom() {
    clearPlayGround();
    displayMsg("Connecting to room...");
    setTimeout(() => {
      console.log(profile);

      if (profile.room.state === "changing" && profile.isAdmin) {
        clearPlayGround();
        displayChanging();

        return;
      }

      if (profile.room.quiz !== location.pathname) {
        clearPlayGround();
        displayMsg(`Go to <a href='${profile.room.quiz}'>this quiz</a>`);
        
        if (profile.isAdmin) {
          profile.room.state = "changing";
          const changeBtn = createChangeQuizBtn();
          $("#playGround").append(changeBtn);
        }
      } else {
        if (profile.isAdmin) {
          clearPlayGround();
          displayRoomOwner();
          updateStartBtn();
        } else {
          clearPlayGround();
          displayRoomUser();
          changeReadyDisplay()
        }
      }
    }, 1000);
  }

  function startGame() {
    profile.room.state = "started";
    if (!profile.isAdmin) {
      clearPlayGround();
      displayMsg("Starting game...");

      setTimeout(() => {
        clearPlayGround();
        displayMsg("3...");

        setTimeout(() => {
          clearPlayGround();
          displayMsg("2...");

          setTimeout(() => {
            clearPlayGround();
            displayMsg("1...");

            setTimeout(() => {
              clearPlayGround();
              displayMsg("Good luck!");

              setTimeout(() => {
                clearPlayGround();
                const leaveBtn = createLeaveBtn();
                $("#playGround").append(leaveBtn);
              }, 1000);

              $("#start-button").click();
            }, 1500);
          }, 1500);
        }, 1500);
      }, 1500);
    } else {
      clearContainer({
        id: "startBtnContainer"
      });
      displayMsgIn({
        id: "startBtnContainer",
        msg: "Starting game..."
      });

      setTimeout(() => {
        clearContainer({
          id: "startBtnContainer"
        });
        displayMsgIn({
          id: "startBtnContainer",
          msg: "3..."
        });

        setTimeout(() => {
          clearContainer({
            id: "startBtnContainer"
          });
          displayMsgIn({
            id: "startBtnContainer",
            msg: "2..."
          });

          setTimeout(() => {
            clearContainer({
              id: "startBtnContainer"
            });
            displayMsgIn({
              id: "startBtnContainer",
              msg: "1..."
            });

            setTimeout(() => {
              clearContainer({
                id: "startBtnContainer"
              });
              displayMsgIn({
                id: "startBtnContainer",
                msg: "Good Luck!"
              });

              $("#start-button").click();

              $("#changeQuizBtn").prop("disabled", true);
              $("#changeQuizBtn").addClass("jt-btn-disabled");

              clearContainer({
                class: "jt-ready-display"
              });
              displayMsgIn({
                class: "jt-ready-display",
                msg: "<span class='jt-font'>...</span>"
              });
            }, 1500);
          }, 1500);
        }, 1500);
      }, 1500);
    }
  }

  function gameEnded() {
    profile.room.state = "ended";
    if (profile.isAdmin) {
      clearContainer({
        id: "startBtnContainer"
      });
      const revealBtn = createRevealBtn();
      $("#startBtnContainer").append(revealBtn);
    } else {
      clearPlayGround();
      displayMsg("Waiting for host to reveal scores...");

      const leaveBtn = createLeaveBtn();
      $("#playGround").append(leaveBtn);
    }
  }

  function revealScores(scores) {
    console.log(scores);
    const ownScore = scores.find(score => score.id === profile.id).score;
    profile.score = ownScore;

    if (profile.isAdmin) {
      scores.forEach(score => {
        const user = profile.room.participants.find(user => user.id === score.id);
        user.score = score.score;

        $("#stateCell").text("Score");
        $(`tr#${user.id} .jt-ready-display .jt-font`).text(user.score);
      });
      clearContainer({
        id: "startBtnContainer"
      });
      setTimeout(() => {
        const restartBtn = createRestartBtn();
        $("#startBtnContainer").append(restartBtn);
      }, 1000);
    } else {
      profile.room.participants = scores;

      clearPlayGround();
      const dataTable = createDataTable([
        ["#", "Name", {
          content: "Score",
          id: "stateCell"
        }]
      ].concat(profile.room.participants.map((el, index) => [{
        content: index + 1,
        class: "jt-list-index"
      }, {
        content: el.username,
        rowId: el.id
      }, {
        html: createScoreDisplay(el.score),
        class: "jt-ready-display"
      }])));

      const panelTable = $("<table class='jt-table-panel'>");
      $("#playGround").append(panelTable);
      const tableRow = $("<tr>");
      panelTable.append(tableRow);
      const tableCellLeft = $("<td>");
      tableRow.append(tableCellLeft);
      const tableCellRight = $("<td>");
      tableRow.append(tableCellRight);

      tableCellLeft.append(dataTable);
      
      const leaveBtn = createLeaveBtn();
      tableCellRight.append(leaveBtn);
    }
  }

  // handle functions

  function handleJoinBtn() {
    const nameInput = $("#nameInput");
    const roomIdInput = $("#roomIdInput");
    if (!nameInput.val() || !roomIdInput.val()) {
      handleError("Please enter name and room id.");
    } else if (!getCookie("PHPSESSID")) {
      handleError("Cookies have to be enabled");
    } else {
      joinRoom(nameInput.val(), roomIdInput.val());
    }
  }

  function handleStartBtn() {
    if (!profile.room.participants.map(el => el.ready).includes(0)) {
      socket.emit("start game");
    } else {
      handleError("not all players in room are ready to start");
    };
  }

  function handleCreateBtn() {
    const nameInput = $("#nameInput");
    if (!nameInput.val()) {
      handleError("Please enter name");
    } else if (!getCookie("PHPSESSID")) {
      handleError("Cookies have to be enabled");
    } else {
      createRoom(nameInput.val());
    }
  }

  function handleLeaveBtn() {
    socket.emit("leave game");
    location.reload();
  }

  function handleRevealBtn() {
    socket.emit("reveal scores");
  }

  function handleRestartBtn() {
    socket.emit("restart game");
  };

  function handleChangeBtn() {
    if (profile.room.state === "waiting") {
      console.log("changing quiz for whole room...");
      socket.emit("changing quiz");
      clearPlayGround();
      displayChanging();
      profile.room.state = "changing";
    } else if (profile.room.state === "changing") {
      console.log("change quiz for whole room");
      socket.emit("change quiz", location.pathname);
    }
  };

  function handleCopyBtn() {
    console.log("copied room code to clipboard", profile.room.code);
    navigator.clipboard.writeText(profile.room.code);
  };

  function handleReadyBtn(btn) {
    if (profile.ready) {
      profile.ready = 0;
    } else {
      profile.ready = 1;
    };

    socket.emit("ready");
    changeReadyDisplay();
  };


  // error functions

  function handleError(msg) {
    alert(msg);
  }

  // online functions

  function joinRoom(name, roomId) {
    socket.emit("join room", name, roomId, location.pathname);
  }

  function createRoom(name) {
    socket.emit("create room", name, location.pathname);
  }

  // socket.on functions

  socket.on("found error", msg => {
    handleError(msg);
  });

  socket.on("connected to room", (user, room) => {
    profile = user;
    profile.room = room;
    joinedRoom();
  });

  socket.on("log in", () => {
    clearPlayGround();
    displayLoginForm();
  });

  socket.on("new user", user => {
    console.log("new user", user);
    if (profile.isAdmin) {
      profile.room.participants.push(user);
      addPlayerList(user);
      updateStartBtn();
    }
  });

  socket.on("user ready", (userId) => {
    console.log("user ready", userId);
    setReadyState(userId, 1);
  });

  socket.on("user unready", (userId) => {
    console.log("user unready", userId);
    setReadyState(userId, 0);
  });

  socket.on("user disconnected", user => {
    playerDisconnected(user);
  });

  socket.on("quiz changed", quiz => {
    profile.room.quiz = quiz;
    if (profile.isAdmin) {
      profile.room.participants.map(el => el.id !== profile.id ? el.ready = 0 : el.ready = 1);
      profile.room.state = "waiting";
    } else {
      profile.ready = 0;
    }
    joinedRoom();
  });

  socket.on("game started", () => {
    startGame();
  });

  socket.on("game has ended", () => {
    gameEnded();
  });

  socket.on("game restarted", () => {
    location.reload();
  });

  socket.on("show scores", (scores) => {
    revealScores(scores);
  });

  // other functions

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
})();

// FIXME einige quizzes nutzen "keypress event" um Dinge einzugeben. Wenn das der Fall ist, dann lässt sich nichts mehr in den Inputs eingeben
