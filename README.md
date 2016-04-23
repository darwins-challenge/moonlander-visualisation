# moonlander-visualisation
Canvas based moonlander visualisation, using a Rust program to drive the web
server and the menu.

## Running

First install the JavaScript front-end packages:

    cd static
    bower install

Build the web server:

    cargo build

Run the web server (you need some JSON files in these directories):

    cargo run /path/to/trace/files

Then open in the browser:

    http://localhost:8080/
