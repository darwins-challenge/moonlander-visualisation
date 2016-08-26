use iron::middleware::Handler;
use iron::prelude::*;
use iron::status;
use std::process;
use std::error::Error;

use std::ffi::OsString;

use rustc_serialize::json;

use rand::Rng;
use rand;

use std::sync::{Mutex, RwLock, Arc};
use std::thread;
use std::io::{BufReader, BufRead};

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
    pub program: OsString,
    state: Arc<RunnerState>
}

impl ProcessRunner {
    pub fn new<S: Into<String>>(s: S) -> ProcessRunner {
        ProcessRunner {
            program: OsString::from(s.into()),
            state: Arc::new(RunnerState {
                id: Mutex::new("".to_owned()),
                output: RwLock::new(vec![]),
                child: Mutex::new(None)
            })
        }
    }

    fn start(&self) -> Result<(), ::std::io::Error> {
        let id : String = rand::thread_rng().gen_ascii_chars().take(10).collect();
        *self.state.id.lock().unwrap() = id.clone();
        self.state.output.write().unwrap().clear();

        let state = self.state.clone();
        let program = self.program.clone();

        let mut child = try!(process::Command::new(&program)
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
                println!("Error killing subprocess: {}", err);
            } else {
                println!("Subprocess stopped");
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

    fn do_start(&self) -> Result<String, Box<Error>> {
        try!(self.stop());
        try!(self.start());
        let response = StartSuccessful { id: self.state.id.lock().unwrap().clone() };
        Ok(try!(json::encode(&response)))
    }

    fn do_read(&self, id: &str, page: &str) -> Result<String, Box<Error>> {
        let result = self.read(try!(page.parse::<usize>()));

        if result.id == id {
            Ok(try!(json::encode(&result)))
        } else {
            Err(Box::new(ErrString("Incorrect id provided".to_owned())))
        }
    }
}

impl Handler for ProcessRunner {
    fn handle(&self, req: &mut Request) -> IronResult<Response> {
        match req.url.path.len() {
            1 => {
                match req.url.path[0].as_ref() {
                    "start" => Ok(make_response(self.do_start())),
                    "stop" => Ok(make_response(self.do_stop())),
                    _ => Ok(Response::with((status::BadRequest, "Command must be 'start' or 'stop'")))
                }
            },
            2 => {
                Ok(make_response(self.do_read(&req.url.path[0], &req.url.path[1])))
            },
            _ => Ok(Response::with((status::BadRequest, "Expecting exactly one URL part")))
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
