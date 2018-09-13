#!/bin/bash

uglifyjs jsfxr.js utils.js game.js allegro_stripped.js -c passes=3,toplevel -m toplevel -o output.js
zip output.zip index.html output.js tiles.png