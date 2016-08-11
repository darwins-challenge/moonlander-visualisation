use glob;

use std::path::PathBuf;
use std::error::Error;
use std::fs::File;
use std::io::Read;

use iron::middleware::Handler;
use iron::prelude::*;
use iron::status;

use rustc_serialize::json;


pub struct DirectoryLister {
    pub directory: String
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
