#!/bin/bash

while getopts 't:' OPTION; do
        case "$OPTION" in
                t)
                        avalue = "$OPTARG"
                        echo "building new image"
                        docker build -t games-dev:$OPTARG -t games-dev:latest .
                        ;;
                ?)
                        echo "usage: $(basename \$0) [-t version number]" >&2
                        exit 1
                        ;;
        esac
echo "Done"
done
shift "$(($OPTIND -1))"
