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
    // Listener has drop
    let _ = try!(Iron::new(handler).http(("localhost", 8080)));
    Ok(())
}

fn main() {
    env_logger::init().unwrap();
    if env::args().len() < 2 {
        println!("Usage: moonvis DIRECTORY");
        process::exit(1);
    }

    let directory = env::args().nth(1).unwrap();

    let mut mount = Mount::new();
    mount.mount("/api/load", dirlist::DirectoryLister { directory: directory.to_owned() });
    mount.mount("/api/run", procrun::ProcessRunner::new(directory.to_owned()));
    mount.mount("/", Static::new(Path::new("./static/")));

    println!("Running on http://localhost:8080/");
    run_server(mount).expect("Something went wrong");
}
