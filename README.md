# Moonlander visualization program
**DEPRECATED**: use [genoculars](https://github.com/darwins-challenge/genoculars)
Canvas based moonlander visualisation, using a Rust program to drive the web
server and the menu.

## Running

First install the JavaScript front-end packages:

    bower install

Run the web server, pointing it where the trace files are stored:

    cargo run ../moonlander-ast

Then open in the browser:

    http://localhost:8080/
