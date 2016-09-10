use iron::middleware::Handler;
use iron::prelude::*;
use iron::status;
use std::process;
use std::error::Error;

use std::ffi::{OsString,OsStr};

use rustc_serialize::{json,Encodable};

use rand::Rng;
use rand;

use std::sync::{Mutex, RwLock, Arc};
use std::thread;
use std::io::{BufReader, BufRead};
use dirlist::{FileType, list_executables};

#[derive(Debug,RustcDecodable,RustcEncodable,Clone,PartialEq)]
struct StartSuccessful {
    id: String
}

#[derive(Debug,RustcDecodable,RustcEncodable,Clone,PartialEq)]
struct LogOutput {
    id: String,
    lines: Vec<String>,
    next_line: usize
}

struct RunnerState {
    /// Current process identifier, process will stop if identifier is changed
    id: Mutex<String>,

    /// The output of the current process
    output: RwLock<Vec<String>>,

    /// Handle to the child process
    child: Mutex<Option<process::Child>>
}

pub struct ProcessRunner {
    pub directory: OsString,
    state: Arc<RunnerState>
}

impl ProcessRunner {
    pub fn new<S: Into<String>>(s: S) -> ProcessRunner {
        ProcessRunner {
            directory: OsString::from(s.into()),
            state: Arc::new(RunnerState {
                id: Mutex::new("".to_owned()),
                output: RwLock::new(vec![]),
                child: Mutex::new(None)
            })
        }
    }

    fn start(&self, program: &OsStr) -> Result<(), ::std::io::Error> {
        let id : String = rand::thread_rng().gen_ascii_chars().take(10).collect();
        *self.state.id.lock().unwrap() = id.clone();
        self.state.output.write().unwrap().clear();

        let state = self.state.clone();

        println!("Starting {}", program.to_str().unwrap_or("?"));

        let mut child = try!(process::Command::new(program)
                .stdout(process::Stdio::piped())
                .spawn());

        let out = child.stdout.take().expect("No stdout on child");

        *state.child.lock().unwrap() = Some(child);

        thread::spawn(move || {
            let mut reader = BufReader::new(out);
            let mut s = String::new();
            loop {
                {
                    if *state.id.lock().unwrap() != id { break; } // End of the party boys, ID changed
                }

                match reader.read_line(&mut s) {
                    Ok(n) if n > 0 => (),
                    _ => break
                };

                {
                    state.output.write().unwrap().push(s.clone());
                }
                s.clear();
            }
        });

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<Error>> {
        // This will cause the background thread to terminate
        self.state.id.lock().unwrap().clear();
        for child in self.state.child.lock().unwrap().iter_mut() {
            if let Some(err) = child.kill().err() {
                error!("Error killing subprocess: {}", err);
            } else {
                warn!("Subprocess stopped");
            }
        }
        Ok(())
    }

    fn read(&self, line: usize) -> LogOutput {
        let output = self.state.output.read().unwrap();

        let len = output.len();

        LogOutput {
            id: self.state.id.lock().unwrap().to_owned(),
            lines: output[::std::cmp::min(line, len)..].iter().map(|x| x.to_owned()).collect(),
            next_line: len
        }
    }

    fn do_stop(&self) -> Result<String, Box<Error>> {
        try!(self.stop());
        Ok("ok".to_owned())
    }

    fn do_start(&self, path_parts: &[String]) -> Result<StartSuccessful, Box<Error>> {
        try!(self.stop());
        let full_path = self.directory.clone().into_string().unwrap() + "/" + &path_parts.join("/");
        try!(self.start(OsStr::new(&full_path)));
        Ok(StartSuccessful { id: self.state.id.lock().unwrap().clone() })
    }

    fn do_list(&self, path_parts: &[String]) -> Result<Vec<(FileType, String)>, Box<Error>> {
        let full_path = self.directory.clone().into_string().unwrap() + "/" + &path_parts.join("/");
        Ok(try!(list_executables(&full_path)))
    }

    fn do_read(&self, id: &str, page: &str) -> Result<LogOutput, Box<Error>> {
        let result = self.read(try!(page.parse::<usize>()));

        if result.id == id {
            Ok(result)
        } else {
            Err(Box::new(ErrString("Incorrect id provided".to_owned())))
        }
    }
}

impl Handler for ProcessRunner {
    fn handle(&self, req: &mut Request) -> IronResult<Response> {
        if req.url.path.len() == 0 {
            return Ok(Response::with((status::BadRequest, "Need at least a command")))
        }

        match req.url.path[0].as_ref() {
            "start" => Ok(make_response(self.do_start(&req.url.path[1..]))),
            "stop" => Ok(make_response(self.do_stop())),
            "get" => {
                if req.url.path.len() == 3 {
                    Ok(make_response(self.do_read(&req.url.path[1], &req.url.path[2])))
                } else {
                    Ok(Response::with((status::BadRequest, "Get needs 2 arguments")))
                }
            },
            "list" => Ok(make_response(self.do_list(&req.url.path[1..]))),
            _ => Ok(Response::with((status::BadRequest, "No such command")))
        }
    }
}

fn make_response<E: Encodable>(r: Result<E, Box<Error>>) -> Response {
    match r {
        Ok(obj) => {
            match json::encode(&obj) {
                Ok(s) => Response::with((status::Ok, s)),
                Err(e) => Response::with((status::InternalServerError, e.description()))
            }
        },
        Err(e) => {
            println!("{:?}", e);
            Response::with((status::InternalServerError, e.description()))
        }
    }
}

#[derive(Debug)]
struct ErrString(String);

// Just so I can error out with strings
impl Error for ErrString {
    fn description(&self) -> &str {
        &self.0
    }
}

impl ::std::fmt::Display for ErrString {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> Result<(), ::std::fmt::Error> {
        try!(write!(f, "{}", self.0));
        Ok(())
    }
}
