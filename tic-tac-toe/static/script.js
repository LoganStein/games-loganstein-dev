let newMessageForm = document.getElementById("new-message");
let newRoomForm = document.getElementById("new-room");

let newPlay = document.getElementById("new-play");

let messageField = newMessageForm.querySelector("#message");
let playField = newMessageForm.querySelector("#play");
let usernameField = newMessageForm.querySelector("#username");
let cellField = newPlay.querySelector("#play");
let roomNameField = newRoomForm.querySelector("#name");

let roomTemplate = document.getElementById("room");
let messageTemplate = document.getElementById("message");
let messagesDiv = document.getElementById("messages");
let roomListDiv = document.getElementById("room-list");
let statusDiv = document.getElementById("status");
let roomCode = document.getElementById("room-code");
let playerTemplate = document.getElementById("player");
let playersDiv = document.getElementById("players");
let observerTemplate = document.getElementById("observer");
let observersDiv = document.getElementById("observers");

const MAX_MSG_COUNT = 9;

var STATE = {
  room: "lobby",
  rooms: [],
  connected: false,
  turn: true,
  symbol: true,
  players: [],
  observers: [],
};

// Generate a color from a "hash" of a string. Thanks, internet.
function hashColor(str) {
  let hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  return `hsl(${hash % 360}, 100%, 70%)`;
}

// Add a new room `name` and change to it. Returns `true` if the room didn't
// already exist and false otherwise.
function addRoom(name) {
  if (STATE[name]) {
    changeRoom(name);
    return false;
  }

  var node = roomTemplate.content.cloneNode(true);
  var room = node.querySelector(".room");
  room.addEventListener("click", () => changeRoom(name));
  room.textContent = name;
  room.dataset.name = name;
  roomListDiv.appendChild(node);

  STATE[name] = [];
  changeRoom(name);
  return true;
}

// Change the current room to `name`, restoring its messages.
function changeRoom(name) {
  if (STATE.room == name) return;

  var newRoom = roomListDiv.querySelector(`.room[data-name='${name}']`);
  var oldRoom = roomListDiv.querySelector(`.room[data-name='${STATE.room}']`);
  if (!newRoom || !oldRoom) return;

  STATE.room = name;
  oldRoom.classList.remove("active");
  newRoom.classList.add("active");

  // removes messages from previous rooms
  messagesDiv.querySelectorAll(".message").forEach((msg) => {
    messagesDiv.removeChild(msg);
  });
  // add messages from new room
  STATE[name].forEach((data) => addMessage(name, data.username, data.message));

  // TODO: update board to reflect new room
}

function addPlayer(name, room) {
  if (STATE.room == room) {
    var node = playerTemplate.content.cloneNode(true);
    node.querySelector("#player-name").textContent = name;
    node.querySelector("#player-score").textContent = "0";
    playersDiv.appendChild(node);
    console.log("Player List:", STATE.players);
  }
}

function addObserver(name, room) {
  if (STATE.room == room) {
    var node = observerTemplate.content.cloneNode(true);
    node.querySelector("#observer-name").textContent = name;
    observersDiv.appendChild(node);
  }
}

function addMessage(room, username, message, push = false) {
  if (push) {
    STATE[room].push({ username, message, room });
  }

  if (STATE.room == room) {
    var node = messageTemplate.content.cloneNode(true);
    node.querySelector(".message .username").textContent = username + ":";
    node.querySelector(".message .username").style.color = hashColor(username);
    node.querySelector(".message .text").textContent = message;
    messagesDiv.appendChild(node);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    document.getElementById("msg_container").scrollTop =
      document.getElementById("msg_container").scrollHeight;
  }
}

function removeMessage(room) {
  STATE[room].pop();
  if (STATE.room == room) {
    messagesDiv.removeChild(messagesDiv.firstElementChild);
  }
}

// subscribe to the event source
function subscribe(uri) {
  var retryTime = 1;

  function connect(uri) {
    const events = new EventSource(uri);

    events.addEventListener("message", (ev) => {
      console.log("FROM SERVER:", JSON.stringify(JSON.parse(ev.data)));
      //more here
      const msg = JSON.parse(ev.data);
      if ("cell" in msg) {
        if (msg.reset && msg.room == STATE.room) {
          resetBoard(msg.username);
          return;
        }
        if (msg.room == STATE.room) {
          markCell(msg.cell, msg.username);
        }
      } else if (
        !"message" in msg ||
        !"room" in msg ||
        !"username" in msg ||
        !"cell" in msg
      ) {
        return;
      } else {
        // console.log(STATE);
        // we want to check if the list of messages in this room is over a certain number then removeMessage(room);
        // but for some reason STATE[room] doesnt exist
        // doesn't work because the rooms aren't added to a list
        // previous messages are stored in STATE[] and it contains the username, message, and room
        // if (STATE[msg.room].length >= MAX_MSG_COUNT) {
        //   removeMessage(msg.room);
        // }
        console.log(STATE[msg.room]);
        addMessage(msg.room, msg.username, msg.message, true);
      }
    });

    events.addEventListener("open", () => {
      setConnectedStatus(true);
      if (uri == "/events") {
        postMessage(STATE.room, "Server", "A new Guest has joined");
        // add players / observers to list
        if (STATE.players.length < 2) {
          addPlayer("guest", STATE.room);
        } else {
          addObserver("guest", STATE.room);
        }
      }

      console.log(`connected to event stream at ${uri}`);
      retryTime = 1;
    });

    events.addEventListener("error", () => {
      setConnectedStatus(false);
      events.close();
      let timeout = retryTime;
      retryTime = Math.min(64, retryTime * 2);
      console.log(`connection lost. attempting to reconnect in ${timeout}s`);
      setTimeout(() => connect(uri), (() => timeout * 1000)());
    });
  }

  connect(uri); //commented out while developing
}

// Set the connection status: `true` for connected, `false` for disconnected.
function setConnectedStatus(status) {
  STATE.connected = status;
  statusDiv.className = status ? "connected" : "reconnecting";
}

function postMessage(room, username, message) {
  console.log(room, username, message);
  if (!message || !username) return;

  if (STATE.connected) {
    console.log("posting");
    //sends message to rocket server
    fetch("/message", {
      method: "POST",
      body: new URLSearchParams({ room, username, message }),
    }).then((resp) => {
      if (resp.ok) messageField.value = "";
    });
  }
}

function init() {
  addRoom("lobby");
  changeRoom("lobby");
  // set up form handler for messages
  newMessageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const room = STATE.room;
    const message = messageField.value;
    const username = usernameField.value || "guest";
    postMessage(room, username, message);
  });

  // set up handler for game play
  newPlay.addEventListener("click", (e) => {
    e.preventDefault();

    const username = usernameField.value;
    const reset = true;
    const cell = 0;
    const room = STATE.room;
    fetch("/play", {
      method: "POST",
      body: new URLSearchParams({ cell, username, reset, room }),
    }).then((resp) => {
      if (resp.ok) cell.value = 0;
    });
  });

  // Set up the new room handler.
  newRoomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const room = roomNameField.value;
    console.log(`Adding room ${room}`);
    if (!room) return;

    roomNameField.value = "";
    if (!addRoom(room)) return;

    addMessage(room, "Rocket", `Look, your own "${room}" room! Nice.`, true);
  });

  roomCode.addEventListener("input", (e) => {
    let newRoomCode = roomCode.textContent;
    if (newRoomCode.length > 5) {
      newRoomCode = newRoomCode.substring(0, 5);
      roomCode.textContent = newRoomCode;
    }
    // changes user to different room when code is full
    if (newRoomCode.length == 5) {
      console.log("going to new room:", newRoomCode);
      addRoom(newRoomCode);
      changeRoom(newRoomCode);
      STATE.room = newRoomCode;
    }
  });

  window.addEventListener("beforeunload", function (event) {
    // TODO: include username that left
    postMessage(STATE.room, "Server", "Someone Left the room");
    event.returnValue = "";
  });

  usernameField.addEventListener("input", (e) => {
    STATE.username = e.target.value;
    document.querySelector("#player-name").textContent = STATE.username;
  });

  subscribe("/events"); // shows us the messages
  subscribe("/playEvents"); // shows us the plays
  roomCode.textContent = STATE.room;
}

// sends the user's move to the server to update other players
function submitPlay(cell, username) {
  let room = STATE.room;
  console.log("state room: ", room);
  if (STATE.turn) {
    fetch("/play", {
      method: "POST",
      body: new URLSearchParams({ cell, username, room }),
    }).then((resp) => {
      if (resp.ok) cell.value = 0;
    });
  }
}

function gameReady() {
  // this is garbo im sure there's a better way
  let cell1 = document.getElementById("cell1");
  let cell2 = document.getElementById("cell2");
  let cell3 = document.getElementById("cell3");
  let cell4 = document.getElementById("cell4");
  let cell5 = document.getElementById("cell5");
  let cell6 = document.getElementById("cell6");
  let cell7 = document.getElementById("cell7");
  let cell8 = document.getElementById("cell8");
  let cell9 = document.getElementById("cell9");

  cell1.addEventListener("click", (e) => {
    console.log("playing 1");
    submitPlay("1", usernameField.value);
  });
  cell2.addEventListener("click", (e) => {
    console.log("playing 2");
    submitPlay(2, usernameField.value);
  });
  cell3.addEventListener("click", (e) => {
    console.log("playing 3");
    submitPlay(3, usernameField.value);
  });
  cell4.addEventListener("click", (e) => {
    console.log("playing 4");
    submitPlay(4, usernameField.value);
  });
  cell5.addEventListener("click", (e) => {
    console.log("playing 5");
    submitPlay(5, usernameField.value);
  });
  cell6.addEventListener("click", (e) => {
    console.log("playing 6");
    submitPlay(6, usernameField.value);
  });
  cell7.addEventListener("click", (e) => {
    console.log("playing 7");
    submitPlay(7, usernameField.value);
  });
  cell8.addEventListener("click", (e) => {
    console.log("playing 8");
    submitPlay(8, usernameField.value);
  });
  cell9.addEventListener("click", (e) => {
    console.log("playing 9");
    submitPlay(9, usernameField.value);
  });
}

function markCell(cell, username) {
  let symbol = "";
  let mark = username == usernameField.value ? STATE.symbol : !STATE.symbol;
  //   console.log(cell, username, mark, usernameField.value);
  if (STATE.symbol) {
    symbol = "X";
  } else {
    symbol = "O";
  }
  document.getElementById(cell).textContent = username[0];
  document.getElementById(cell).style.color = hashColor(username);
}

function resetBoard(username) {
  for (let i = 1; i <= 9; i++) {
    document.getElementById(i.toString()).textContent = "";
  }
  if (STATE[STATE.room].length >= MAX_MSG_COUNT) {
    removeMessage(STATE.room);
  }
  addMessage(STATE.room, "Server", `Game Reset by ${username}`, true);
}

init();
gameReady();
