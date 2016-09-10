use glob;

use std::path::{Path,PathBuf};
use std::error::Error;
use std::fs;
use std::fs::File;
use std::ffi::OsStr;
use std::io::Read;

use std::os::unix::fs::PermissionsExt;

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

pub fn list_dir(pattern: String) -> Result<Vec<String>, Box<Error>> {
    Ok(try!(glob::glob(&pattern))
            .filter_map(Result::ok)
            .filter_map(name_from_path)
            .filter(|n| !n.starts_with("."))
            .collect())
}

pub type FileType = &'static str;

fn file_type<S: AsRef<OsStr>>(name: S) -> FileType {
    if Path::new(&name).is_dir() {
        "dir"
    } else if name.as_ref().to_str().map(|s| s.ends_with(".json")).unwrap_or(false) {
        "trace"
    } else {
        "file"
    }
}

pub fn is_executable<P: AsRef<Path>>(p: P) -> bool {
    let r = p.as_ref();
    return fs::metadata(r).map(|m| m.permissions().mode() & 0o111 != 0).unwrap_or(false)
        || r.to_str().map(|s| s.ends_with(".exe")).unwrap_or(false);
}


pub fn list_executables(dir: &str) -> Result<Vec<(FileType, String)>, Box<Error>> {
    list_dir(dir.to_owned() + "/*").map(|xs| xs
            .into_iter()
            .map(|name| (file_type(dir.to_owned() + "/" + &name), name))
            .filter(|t| t.0 == "dir" || is_executable(dir.to_owned() + "/" + &t.1))
            .collect())
}

pub fn list_json_files(dir: &str) -> Result<Vec<(FileType, String)>, Box<Error>> {
    list_dir(dir.to_owned() + "/*").map(|xs| xs
            .into_iter()
            .map(|name| (file_type(dir.to_owned() + "/" + &name), name))
            .filter(|t| t.0 == "dir" || t.0 == "trace")
            .collect())
}

impl DirectoryLister {
    fn list(&self, path_parts: &[String]) -> Result<String, Box<Error>> {
        let full_path = self.directory.clone() + "/" + &path_parts.join("/");
        let files = try!(list_json_files(&full_path));
        Ok(try!(json::encode(&files)))
    }

    fn load(&self, path_parts: &[String]) -> Result<String, Box<Error>> {
        let full_path = self.directory.clone() + "/" + &path_parts.join("/");
        let mut f = try!(File::open(full_path));
        let mut ret = String::new();
        try!(f.read_to_string(&mut ret));
        Ok(ret)
    }
}

impl Handler for DirectoryLister {
    fn handle(&self, req: &mut Request) -> IronResult<Response> {
        match req.url.path[0].as_ref() {
            "list" => Ok(make_response(self.list(&req.url.path[1..]))),
            "get" => Ok(make_response(self.load(&req.url.path[1..]))),
            _ => Ok(Response::with((status::BadRequest, "Unrecognized command")))
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
