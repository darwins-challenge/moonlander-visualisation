extern crate iron;
extern crate rand;
extern crate glob;
extern crate staticfile;
extern crate mount;
extern crate env_logger;
extern crate rustc_serialize;

mod dirlist;
mod procrun;

#[macro_use]
extern crate log;

use std::env;
use std::process;
use std::error::Error;

use iron::middleware::Handler;
use iron::prelude::*;

use std::path::Path;
use staticfile::Static;
use mount::Mount;


fn run_server<H>(handler: H) -> Result<(), Box<Error>> where H: Handler + Send + Sync {
    let mut mount = Mount::new();
    mount.mount("/d", handler);
    mount.mount("/", Static::new(Path::new("./static/")));

    // Listener has drop
    let _ = try!(Iron::new(mount).http(("localhost", 8080)));
    Ok(())
}

fn main() {
    env_logger::init().unwrap();
    if env::args().len() < 2 {
        println!("Usage: moonvis TRACE_DIRECTORY");
        process::exit(1);
    }

    let directory = env::args().nth(1).unwrap();
    //let handler = dirlist::DirectoryLister { directory: directory };
    let handler = procrun::ProcessRunner::new(directory);

    println!("Running on http://localhost:8080/");
    run_server(handler).expect("Something went wrong");
}
