FROM liuchong/rustup

ENV ROCKET_ADDRESS=0.0.0.0

ENV ROCKET_PORT=8000

ADD ./tic-tac-toe /app

WORKDIR /app

RUN rustup default stable

RUN cargo build

CMD ["cargo", "run"]
