#[macro_use] extern crate rocket;

// #[cfg(test)] mod tests;

use rocket::{State, Shutdown};
use rocket::fs::{relative, FileServer};
use rocket::form::Form;
use rocket::response::stream::{EventStream, Event};
use rocket::serde::{Serialize, Deserialize};
use rocket::tokio::sync::broadcast::{channel, Sender, error::RecvError};
use rocket::tokio::select;

#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
// #[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
struct Message {
    #[field(validate = len(..20))]
    pub room: String,
    #[field(validate = len(..30))]
    pub username: String,
    pub message: String,
}

#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Play {
    pub cell: u32,
    pub username: String,
    pub reset: bool,
}

#[get("/playEvents")]
async fn playEvents(queue: &State<Sender<Play>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();

    EventStream! {
        loop {
            let play = select! {
                play = rx.recv() => match play {
                    Ok(play) => play,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&play);
        }
    }
}

// Returns an infinite stream of server-sent events.
#[get("/events")]
async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] { //add playQueue: &State<Sender<Play>>
    let mut rx = queue.subscribe();

    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&msg);
        }
    }
}

#[post("/message", data = "<form>")]
fn post(form: Form<Message>, queue: &State<Sender<Message>>) {
    let _res = queue.send(form.into_inner());
}


#[post("/play", data = "<form>")]
fn postPlay(form: Form<Play>, queue: &State<Sender<Play>>) {
    // println!("Play: {:?}", form);
    // if i want to implement game control/logic from server side this is where I would do it
    // just parse form and perform logic on it.
    // one issue though is that i dont know how to send a message to the users from here... oh i guess its just queue.send("message") lmao literally the next line

    // some how i need to keep a state of the game (multiple game states, one for each room)

    let _res = queue.send(form.into_inner());
}


#[launch]
fn rocket() -> _ {
    rocket::build()
    .manage(channel::<Message>(1024).0)
    .manage(channel::<Play>(1024).0)
    .mount("/", routes![post, events, postPlay, playEvents]) // add postPlay for play
    .mount("/", FileServer::from(relative!("static")))
}