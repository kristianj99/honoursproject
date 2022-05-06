//packages required for site
var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
        require("passport-local-mongoose"),
    User = require("./models/user");
const _ = require("passport-local-mongoose");
const path = require("path");
const project = require("./models/project");
const { db } = require("./models/user");
    Project = require("./models/project");
    multer = require("multer");
    Grid = require("gridfs-stream");
    GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
    crypto = require('crypto');
    methodOverride = require('method-override');
const util = require('util'),
    request = util.promisify(require('request')),
    fs=require("fs"),
    fsp = fs.promises;
var mongodb= require('mongodb');
const { assert } = require("console");
var cookieParser = require('cookie-parser');
const pdf = require('pdfjs');

 
    
//connection for local hosting
//mongoose.connect("mongodb://localhost/auth_demo_app");

//connection to mongoatlas database
mongoose.connect("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");

//sets the app to use express as the engine 
var app = express();
app.set("view engine", "ejs");

//telles the app to use bodyparser, methodoverride and cookie parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
 
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

//initalising passport for user account creation
app.use(passport.initialize());
app.use(passport.session());
 
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//allows use of css sheet
app.use("/static", express.static('./static/'));
app.use(express.static(path.join(__dirname, 'public')));


db1 = mongoose.connection;

// init gfs
Grid.mongo = mongoose.mongo;
//localhost connection
//conndb1 = mongoose.createConnection('mongodb://localhost/auth_demo_app');

//connection to mongoatlas
conndb1 = mongoose.createConnection("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");


let gfs;
//localhost connection
//conndb2 = mongoose.createConnection('mongodb://localhost/projects')

//connection to mongoatlas
conndb2 = mongoose.createConnection("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");


//opens a connection to the collection of uploads inside the database
conndb1.once('open', function () {
      gfs = Grid(conndb1.db, mongoose.mongo);
      gfs.collection('uploads');
});

conndb2.once('open', function () {
    gfs = Grid(conndb2.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine, for storing files
var storage = new GridFsStorage({
    //url: 'mongodb://localhost/projects',
    url: 'mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority',
    //creates a new files
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          //finds the project to store the file
          Project.findOne({_id:req.cookies.project}, function (err, project) {
            //gives the filename, roles of the selected project, and metadata of the file upload, as well as the bucket to be stored in
            var filename = file.originalname;
            var role = project.role;
            var fileInfo = {
              filename: filename,
              bucketName: "uploads",
              metadata: {
                  author:req.user._id,
                  project:req.cookies.project,
                  roleaccess: {role:role}
  
              },
            };
            resolve(fileInfo);
          })
          
        });
      });
    }
  });

//tells the upload command which storage engine to use to upload the files
const upload = multer({ storage });
 
//=====================
// ROUTES
//=====================
 
// Showing home page
app.get("/", function (req, res) {
    res.render("index");
});

//renders privacy policy page
app.get("/privacypolicy", function (req, res) {

    res.render("privacypolicy");
});

//=====================
// REGISTRATION/LOGIN/LOGOUT
//=====================

// Showing register form
app.get("/register", function (req, res) {
    //checks if the user is logged in - if true, error displays
    if (req.isAuthenticated()) {
        return res.render("registererror")
    }
    //renders the register page
    res.render("register");
});

// Handling user signup
app.post("/register", function (req, res) {
    //takes the 2 values from the input forms
    var username = req.body.username
    var password = req.body.password
    //creates a new user based off of the username and password values
    User.register(new User({ username: username }),
            password, function (err, user) {
        if (err) {
            //if an error occurs, render the register error page
            console.log(err);
            return res.render("registererror");
        }
        //authenticate user if it passes, and logs them in
        passport.authenticate("local")(
            req, res, function () {
            res.render("index");
        });
    });
});

// Showing register error
app.get("/registererror", function (req, res) {
    res.render("registererror");
});

//Showing login form
app.get("/login", function (req, res) {
    //if user is already logged in, error will display
    if (req.isAuthenticated()) {
        return res.render("loginerror")
    }
    res.render("login");
});

// Showing login error
app.get("/loginerror", function (req, res) {
    res.render("loginerror");
});

//Handling user login
app.post("/login", passport.authenticate("local", {
    //if authentication passes, index page is rendered, otherwise a login error is displayed
    successRedirect: "/",
    failureRedirect: "/loginerror"
}), function (req, res) {
});

//user is logged out and redirect to index page
app.post('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

//Handling user logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


//checks if the user is logged in
function isLoggedIn(req, res, next) {
    //if not, redirects them to the log in page
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}
 
//=====================
// PROJECT CREATION/VIEWING
//=====================

// Showing projects page
app.get("/projects", isLoggedIn, function (req, res) {
    //takes user ID from logged in user
    var user_id = req.user._id;
    //finds all projects associated with that id
    Project.find({"userid": user_id}, function (err, response) {
        if (err) {
            console.log(err);
        }
        //finds all projects that have a matching user ID with the logged in users ID
        Project.find({"access.userid":(user_id.toString())}, function (err, response2) {
            //renders the projects page with the 2 sets of projects queried previously
            res.render('projects', {data: { dropdownVals: response, dropdownVals2:response2} });
        });
        
    });
});

//new project page is rendered
app.post('/newproject', (req, res) => {
    res.render("newproject");
  });

//creates a project
app.post('/createproject', isLoggedIn, (req, res) => {
    //takes the project name from input form, as well as logged in users ID
    var project= req.body.projectname;
    var user_id = req.user._id
    //if the length of the name is 0, an error is displayed, aka if the user entered no information
    if ((project.length) == 0) {
        res.render('newprojecterror');
    } else {
        //otherwise, a project is created using the project schema with the name and user ID identified previously
        Project.create({
            name: project,
            userid: user_id
            
        }).then(book => console.log(book))
            .catch(err => console.error(err));
        //renders index page
        res.render('index')
    }
    
    
});

//post request for selecting a project
app.post('/selectproject', isLoggedIn, (req, res) => {
    //takes the project ID, the value of the buttton pressed, the logged in users ID, and their role
    var selectedproject = req.body.Project;
    var buttonvalue = req.body.select;
    var user = req.user._id;
    var loggeduserrole = loggeduserrole;
    //creates a cookie based off of the selected project
    res.cookie('project', selectedproject);
    //checks if there was an error connecting to the database
    if(!gfs) {
        console.log("some error occured, check connection to db");
        res.send("some error occured, check connection to db");
        process.exit(0);
      }
    //if the value was to select the project
    if (buttonvalue == "Select project") {
        //if the cookie has not yet updated, force it to update to the selected project ID
        if (req.cookies.project != selectedproject) {
            req.cookies.project = selectedproject
        }
        //find files which match the project ID
        gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
                //find project which matches the ID
                Project.findOne({_id:selectedproject}, function (err, response) {
                    //if it can't find the project, return error
                    if (response == null) {
                        res.render('selectprojecterror')
                    } else {
                        //checks the list of users that has access
                        for (const i in response.access) {
                            console.log("user is " + response.access[i].user)
                            console.log("user is " + user)
                            //finds the user that matches with the logged in user
                            if (response.access[i].userid == user) {
                                //sets their role to be the role they have been given by the project creator
                                loggeduserrole = response.access[i].role;
                            };
                        };
                        //renders the project, sending over all the data collected beforehand
                        res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
                    }
                    
                });
            
        });
        //if the value of the button was delete project
    } else if (buttonvalue == "Delete project") {
        //remove the project from the collection
        Project.remove({_id:selectedproject}, (function(err) {
            console.log("deleted");
            res.redirect("/");
        }))
        //if the value of the button was to create a new project
    } else if (buttonvalue == "New project") {
        //render the newproject screen
        res.render("newproject");
    }
    
    
      
});

//=====================
// ADD/REMOVE USERS/ROLES
//=====================

//adds user to a project
app.post('/adduser', isLoggedIn, (req, res) => {
    //collects user name, project ID and role selected
    var user= req.body.user;
    var project = req.cookies.project
    var role = req.body.role
    //finds the user based on the name entered
    User.findOne({"username":user}, function(err, account) {
        //if the user cannot be found, an error page is displayed
        if (account == null) {
            res.render('addusererror')
        } else {
            //otherwise, the project is found by querying the id and the user and their role is pushed into the access value, and the document is returned
            Project.findOneAndUpdate({_id:project}, {$push: {access: {userid: account._id, user:account.username, role:role}}}, {returnNewDocument: true}, function(err, result) {
            
            });
                //data needed to reload the page is sent to avoid having to return to the index page
                var selectedproject = req.cookies.project;
                var user = req.user._id;
                var loggeduserrole = loggeduserrole;
                console.log(req.cookies.project)
                if (req.cookies.project != selectedproject) {
                    req.cookies.project = selectedproject
                }
                gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
                        console.log(files)
                        db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                            if (!result) {
                                console.log("error")
                            } else {
                                console.log(result)
                            }
                            
                        }
                        Project.findOne({_id:selectedproject}, function (err, response) {
                            for (const i in response.access) {
                                console.log("user is " + response.access[i].user)
                                console.log("user is " + user)
                                if (response.access[i].user == user) {
                                    loggeduserrole = response.access[i].role
                                };
                            };
                            console.log(loggeduserrole)
                            console.log()
                            res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
                        });
                    
                });
        }
        
    });
    
    
    
    
});

//remove user from a project
app.post('/removeuser', isLoggedIn, (req, res) => {
    //takes user requested and project ID
    var user = req.body.user;
    var project = req.cookies.project;
    //finds user based off of name selected
    User.findOne({"username":user}, function(err, account) {
        //if the account doesnt exist, error message displays
        if (account == null) {
            res.render("removeusererror")
        } else {
            //otherwise, the project is found through its ID and the users access is pulled from the array
            Project.findOneAndUpdate({_id:project}, {$pull: {access: {user: account.username}}}, {returnNewDocument: true}, function(err, result) {
                console.log(result);
            });
            //data needed to reload the page is sent to avoid having to return to the index page
            var selectedproject = req.cookies.project;
    var user = req.user._id;
    var loggeduserrole = loggeduserrole;
    console.log(req.cookies.project)
    if (req.cookies.project != selectedproject) {
        req.cookies.project = selectedproject
    }
    gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
            console.log(files)
            db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                if (!result) {
                    console.log("error")
                } else {
                    console.log(result)
                }
                
            }
            Project.findOne({_id:selectedproject}, function (err, response) {
                for (const i in response.access) {
                    console.log("user is " + response.access[i].user)
                    console.log("user is " + user)
                    if (response.access[i].user == user) {
                        loggeduserrole = response.access[i].role
                    };
                };
                console.log(loggeduserrole)
                console.log()
                res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
            });
        
    });
        }
        
    });
});

//add role to a project
app.post('/addrole', isLoggedIn, (req, res) => {
    //takes the input
    var role = req.body.role;
    //if the length of the input is 0, return error
    if ((role.length) == 0) {
        res.render('roleundefined')
    } else {
        //otherwise, collect project ID, find project, and push it into the object
        var project = req.cookies.project;
        Project.findOneAndUpdate({_id:project}, {$push: {role:role}}, {returnNewDocument: true}, function(err, result) {
            console.log(result)
        });
        //data needed to reload the page is sent to avoid having to return to the index page
            var selectedproject = req.cookies.project;
            var user = req.user._id;
            var loggeduserrole = loggeduserrole;
            console.log(req.cookies.project)
            if (req.cookies.project != selectedproject) {
                req.cookies.project = selectedproject
            }
            gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
                    console.log(files)
                    db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                        if (!result) {
                            console.log("error")
                        } else {
                            console.log(result)
                        }
                        
                    }
                    Project.findOne({_id:selectedproject}, function (err, response) {
                        for (const i in response.access) {
                            console.log("user is " + response.access[i].user)
                            console.log("user is " + user)
                            if (response.access[i].user == user) {
                                loggeduserrole = response.access[i].role
                            };
                        };
                        console.log(loggeduserrole)
                        console.log()
                        res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
                    });
                
            });
    }
    
}); 

//remove a role from the project
app.post('/removerole', isLoggedIn, (req,res) => {
    // takes role from input
    var role = req.body.role;
    //if no role selected, return error
    if (role == undefined) {
        res.render('removeroleerror')
    } else {
        //project id taken
        var project = req.cookies.project;
        //project is found and the role is pulled
        Project.findOneAndUpdate({_id:project}, {$pull: {role:role}}, {returnNewDocument: true}, function(err, result) {
        });
        //data needed to reload the page is sent to avoid having to return to the index page
            var selectedproject = req.cookies.project;
            var user = req.user._id;
            var loggeduserrole = loggeduserrole;
            console.log(req.cookies.project)
            if (req.cookies.project != selectedproject) {
                req.cookies.project = selectedproject
            }
            gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
                    console.log(files)
                    db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                        if (!result) {
                            console.log("error")
                        } else {
                            console.log(result)
                        }
                        
                    }
                    Project.findOne({_id:selectedproject}, function (err, response) {
                        for (const i in response.access) {
                            console.log("user is " + response.access[i].user)
                            console.log("user is " + user)
                            if (response.access[i].user == user) {
                                loggeduserrole = response.access[i].role
                            };
                        };
                        console.log(loggeduserrole)
                        console.log()
                        res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
                    });
                
            });
    }
    
});

//update permissions for a file. :id specifies the ID of the file requested
app.post('/updatepermissions/:id', isLoggedIn, (req,res) => {
    //if no boxes were checked, the array is returned as empty
    if (req.body.permission == undefined) {
        req.body.permission = [];
    }
    //finds the file based off the ID, and replaces the previous set of permissions with the new array of permissions
    gfs.files.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.params.id)}, {$set: {"metadata.roleaccess.role":req.body.permission} }, (err, file) => {
        console.log(file)
    });
    //data needed to reload the page is sent to avoid having to return to the index page
    var selectedproject = req.cookies.project;
    var user = req.user._id;
    var loggeduserrole = loggeduserrole;
    console.log(req.cookies.project)
    if (req.cookies.project != selectedproject) {
        req.cookies.project = selectedproject
    }
    gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
            console.log(files)
            db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                if (!result) {
                    console.log("error")
                } else {
                    console.log(result)
                }
                
            }
            Project.findOne({_id:selectedproject}, function (err, response) {
                for (const i in response.access) {
                    console.log("user is " + response.access[i].user)
                    console.log("user is " + user)
                    if (response.access[i].user == user) {
                        loggeduserrole = response.access[i].role
                    };
                };
                console.log(loggeduserrole)
                console.log()
                res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
            });
        
    });
});


    
//=====================
// FILES
//=====================
//uploading files
//uploads the file sent by the upload form
app.post('/upload', upload.single('file'), isLoggedIn, (req, res, next) => {
    //data needed to reload the page is sent to avoid having to return to the index page
    var selectedproject = req.cookies.project;
    var user = req.user._id;
    var loggeduserrole = loggeduserrole;
    console.log(req.cookies.project)
    if (req.cookies.project != selectedproject) {
        req.cookies.project = selectedproject
    }
    gfs.files.find({"metadata.project":selectedproject}).toArray((err,files) => {
            console.log(files)
            db.collection('projects').findOne({_id:selectedproject}), (err, result) => {
                if (!result) {
                    console.log("error")
                } else {
                    console.log(result)
                }
                
            }
            Project.findOne({_id:selectedproject}, function (err, response) {
                for (const i in response.access) {
                    console.log("user is " + response.access[i].user)
                    console.log("user is " + user)
                    if (response.access[i].user == user) {
                        loggeduserrole = response.access[i].role
                    };
                };
                console.log(loggeduserrole)
                console.log()
                res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
            });
        
    });
});

//delete a file based on the id selected
app.delete('/files/:id', isLoggedIn, (req, res) => {
    //find the uploads bucket
    gridfsBucket = new mongoose.mongo.GridFSBucket(conndb2.db, {
        bucketName: "uploads",
      });
      //removes the file from the chunks and files collections
      gridfsBucket.delete(mongoose.Types.ObjectId(req.params.id));
    //returns the user to the index
    res.redirect("/");
});

//view a file
app.post('/files/:id', isLoggedIn, async (req, res) => {
    console.log(req.params.id);
    console.log("downloading rn")
    //gets the bucket
    const bucket = new mongodb.GridFSBucket(db1, {
        chunkSizeBytes: 1024,
        bucketName: 'uploads'
    });
    //finds the file in the database and creates a read stream of the chunks
    gfs.files.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, (err, file) => {
        const readStream = bucket.openDownloadStream(file._id);
        //displays or downloads the file
        readStream.pipe(res)


    });      
});

//display the templates
app.post('/templates', isLoggedIn, (req,res) => {
    //finds the templates
    gfs.files.find({"metadata.project":"template"}).toArray((err,files) => {
        //renders the page with the list of templates
        res.render('templates', {data: {files : files}})
    });    
});
  
//chooses port
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});
