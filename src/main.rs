extern crate iron;
extern crate glob;
extern crate staticfile;
extern crate mount;
extern crate env_logger;
extern crate rustc_serialize;

#[macro_use]
extern crate log;

use std::error::Error;
use std::env;
use std::process;
use std::path::{Path, PathBuf};
use std::fs::File;
use std::io::Read;

use iron::middleware::Handler;
use iron::prelude::*;
use iron::status;
use staticfile::Static;
use mount::Mount;

use rustc_serialize::json;


struct DirectoryLister {
    directory: String
}

fn name_from_path(pb: PathBuf) -> Option<String> {
    pb.file_name()
        .and_then(|x| x.to_str())
        .map(|y| y.to_owned())
}

impl DirectoryLister {
    fn list(&self) -> Result<String, Box<Error>> {
        let pattern = self.directory.clone() + "/*.json";
        let paths = try!(glob::glob(&pattern));
        let files : Vec<String> = paths
                .filter_map(Result::ok)
                .filter_map(name_from_path)
                .collect();
        Ok(try!(json::encode(&files)))
    }

    fn load(&self, name: &str) -> Result<String, Box<Error>> {
        let mut path = PathBuf::from(self.directory.clone());
        path.push(name);
        let mut f = try!(File::open(path));
        let mut ret = String::new();
        try!(f.read_to_string(&mut ret));
        Ok(ret)
    }
}

impl Handler for DirectoryLister {
    fn handle(&self, req: &mut Request) -> IronResult<Response> {
        match req.url.path.len() {
            0 => Ok(make_response(self.list())),
            1 => Ok(make_response(self.load(&req.url.path[0]))),
            _ => Ok(Response::with((status::BadRequest, "Only 0 or 1 filename part allowed")))
        }
    }
}

fn make_response(r: Result<String, Box<Error>>) -> Response {
    match r {
        Ok(s) => Response::with((status::Ok, s)),
        Err(e) => {
            println!("{:?}", e);
            Response::with((status::InternalServerError, e.description()))
        }
    }
}

fn run_server<H>(handler: H) -> Result<(), Box<Error>> where H: Handler + Send + Sync {
    let mut mount = Mount::new();
    mount.mount("/d", handler);
    mount.mount("/", Static::new(Path::new("./static/")));

    // Listener has drop
    let _ = Iron::new(mount).http(("localhost", 8080));
    Ok(())
}

fn main() {
    env_logger::init().unwrap();
    if env::args().len() < 2 {
        println!("Usage: moonvis TRACE_DIRECTORY");
        process::exit(1);
    }

    let directory = env::args().nth(1).unwrap();
    let handler = DirectoryLister { directory: directory };

    println!("Running on http://localhost:8080/");
    run_server(handler).expect("Something went wrong");
}
