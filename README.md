
# moonlander-visualisation
Canvas based moonlander visualisation, using a Rust program to drive the web
server and the menu.

## Running

First install the JavaScript front-end packages:

    bower install

Build the web server:

    cargo build

Run the web server (you need to point it to a compiled evolution program):

    cargo run ../moonlander-ast-rust/target/release/examples/evolve

You could use the `traces` directory, it contains sample traces.

Then open in the browser:

    http://localhost:8080/
