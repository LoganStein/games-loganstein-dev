# Multilayer Tic Tac Toe with Chat

This is a Rust project that implements a web-based multilayer Tic Tac Toe game with chat functionality, utilizing the Rocket web framework. The project allows users to play Tic Tac Toe games in multiple rooms simultaneously, with support for real-time communication through a chat feature.

## Features

- Play Tic Tac Toe games in multiple rooms concurrently.
- Support for multiple players in each game room.
- Real-time chat functionality for communication between players.
- RESTful API endpoints for game actions, such as making moves and getting game status.
- WebSocket communication for real-time updates.

## Requirements

- Docker (only for docker implementation)
- Rust (only for docker-less implementation)
- Rustc version >= 1.63 (only for docker-less implementation)

If you want to run the application outside of a docker container you'll just need rust installed and rustc version >=1.63. You can run it by changing directory into `tic-tac-toe` then run `cargo run` and the app will be hosted on `localhost:8000`.
If you need to update your rustc you can run
`rustup update stable`

If you intend to run the app in Docker you will only need Docker installed.

(linux) Run `build.sh` to build the docker image and `run.sh` to run the docker container. The app will then be hosted on `localhost:8000`.

## Usage

Once you have it running access the application through your web browser at `http://localhost:8000` You'll be put in the default room called lobby. You can edit this room code to any 5 character code you like. Share this code with a friend and you now have your own private tic tac toe game with a chat.

## Structure

The HTML, Javascript, and CSS that control the user interface and some of the logic for the game/messages (communication with the server) are located in `/tic-tac-toe/static`. The code that runs the server and the game logic (determining a winner) is located in `/tic-tac-toe/src/main.rs`

## Limitations

There are many limitations and I'm currently still working on this project but I have no intention of addressing some of these limitaitons. This project is just for my own education and entertainment.

- Messages are not secure at all. All messages are broadcast to all rooms but only displayed on the correct one. (won't fix)
- Messages are ephemeral ("its a feature not a bug" lol)
- Board doesn't update when changing rooms (will fix)
- App asks if you're sure you want to leave so it can broadcast that you're leaving.
- Doesn't know who left (will fix)
- no rule enforcement (will fix)
- Doesn't list available rooms (this actually is kind of a feature)
  - I decided that it would be better to not list them so that two people who want to play can just share the code with a select few.

## Credits

This project is based on the [rocket chat app](https://github.com/SergioBenitez/Rocket/tree/bd482081ad58b68fdcf2398d87ddda4d8e850964/examples/chat) by the library's creator [Sergio Benitez](https://github.com/SergioBenitez)

## License

Whatever
