FROM rust

ENV ROCKET_ADDRESS=0.0.0.0

ENV ROCKET_PORT=8000

ADD . /app

WORKDIR /app

#RUN rustup update stable

RUN rustup default stable

RUN cargo update

RUN cargo build

CMD ["cargo", "run"]
