#!/bin/bash

docker stop games-dev
docker run -d -p 8081:8000 --rm --name games-dev games-dev:latest
