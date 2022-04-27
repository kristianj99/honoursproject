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
const files = require("./models/files");
const project = require("./models/project");
const { db } = require("./models/user");
    Project = require("./models/project")
    ProjectFile = require('./models/files');
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
const pdf = require('pdfjs')

 
    
//connection for local hosting
//mongoose.connect("mongodb://localhost/auth_demo_app");
mongoose.connect("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");

 
var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.use(cookieParser());
 
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));
 
app.use(passport.initialize());
app.use(passport.session());
 
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/static", express.static('./static/'));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");

db1 = mongoose.connection;
db2 = db1.useDb('projects')

// init gfs
Grid.mongo = mongoose.mongo;
//localhost connection
//conndb1 = mongoose.createConnection('mongodb://localhost/auth_demo_app');
conndb1 = mongoose.createConnection("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");

let gfs;
//localhost connection
//conndb2 = mongoose.createConnection('mongodb://localhost/projects')
conndb2 = mongoose.createConnection("mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority");



conndb1.once('open', function () {
      gfs = Grid(conndb1.db, mongoose.mongo);
      gfs.collection('uploads');
});

conndb2.once('open', function () {
    gfs = Grid(conndb2.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine
var storage = new GridFsStorage({
    //url: 'mongodb://localhost/projects',
    url: 'mongodb+srv://admin:admin@cluster0.1eloq.mongodb.net/honoursproject?retryWrites=true&w=majority',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          Project.findOne({_id:req.cookies.project}, function (err, project) {
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

const upload = multer({ storage });
 
//=====================
// ROUTES
//=====================
 
// Showing home page
app.get("/", function (req, res) {
    res.render("index");
});
 
// Showing projects page
app.get("/projects", isLoggedIn, function (req, res) {
    var user_id = req.user._id;
    Project.find({"userid": user_id}, function (err, response) {
        if (err) {
            console.log(err)
        }
        Project.find({"access.userid":(user_id.toString())}, function (err, response2) {
            console.log(user_id)
            console.log(response2);
            res.render('projects', {data: { dropdownVals: response, dropdownVals2:response2} });
        })
        // Pass the DB result to the template
        
    });
});
 
// Showing register form
app.get("/register", function (req, res) {
    if (req.isAuthenticated()) {
        return res.render("registererror")
    }
    res.render("register");
});
 
// Showing register error
app.get("/registererror", function (req, res) {
    res.render("registererror");
});

// Showing login error
app.get("/loginerror", function (req, res) {
    res.render("loginerror");
});

// Handling user signup
app.post("/register", function (req, res) {
    var username = req.body.username
    var password = req.body.password
    User.register(new User({ username: username }),
            password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("registererror");
        }
 
        passport.authenticate("local")(
            req, res, function () {
            res.render("index");
        });
    });
});
 
//Showing login form
app.get("/login", function (req, res) {
    if (req.isAuthenticated()) {
        return res.render("loginerror")
    }
    res.render("login");
});
 
//Handling user login
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/loginerror"
}), function (req, res) {
});


app.post('/newproject', (req, res) => {
    res.render("newproject");
  });

app.post('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


app.post('/createproject', isLoggedIn, (req, res) => {
    var project= req.body.projectname;
    var user_id = req.user._id
    Project.create({
        name: project,
        userid: user_id
        
    }).then(book => console.log(book))
        .catch(err => console.error(err));

    db2.createCollection(project)
    
    res.render('index')
    
}); 

app.post('/adduser', isLoggedIn, (req, res) => {
    var user= req.body.user;
    var project = req.cookies.project
    var role = req.body.role
    User.findOne({"username":user}, function(err, account) {
        if (account == null) {
            res.render('addusererror')
        } else {
            Project.findOneAndUpdate({_id:project}, {$push: {access: {userid: account._id, user:account.username, role:role}}}, {returnNewDocument: true}, function(err, result) {
            
            });
            //Project.updateOne(
                //{_id:project},
                //{$push: {"meta.access":userid}})
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

app.post('/removeuser', isLoggedIn, (req, res) => {
    var user = req.body.user;
    var project = req.cookies.project;
    User.findOne({"username":user}, function(err, account) {
        if (account == null) {
            res.render("removeusererror")
        } else {
            Project.findOneAndUpdate({_id:project}, {$pull: {access: {user: account.username}}}, {returnNewDocument: true}, function(err, result) {
                console.log(result);
            });
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

app.post('/removerole', isLoggedIn, (req,res) => {
    var role = req.body.role;
    if (role == undefined) {
        res.render('removeroleerror')
    } else {
        var project = req.cookies.project;
        Project.findOneAndUpdate({_id:project}, {$pull: {role:role}}, {returnNewDocument: true}, function(err, result) {
        });
        //Project.updateOne(
            //{_id:project},
            //{$push: {"meta.access":userid}})
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

app.post('/updatepermissions/:id', isLoggedIn, (req,res) => {
    if (req.body.permission == undefined) {
        req.body.permission = [];
    }
    gfs.files.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.params.id)}, {$set: {"metadata.roleaccess.role":req.body.permission} }, (err, file) => {
        console.log(file)
    });
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

app.post('/addrole', isLoggedIn, (req, res) => {
    var role = req.body.role;
    if ((role.length) == 0) {
        res.render('roleundefined')
    } else {
        var project = req.cookies.project;
        Project.findOneAndUpdate({_id:project}, {$push: {role:role}}, {returnNewDocument: true}, function(err, result) {
            console.log(result)
        });
        //Project.updateOne(
            //{_id:project},
            //{$push: {"meta.access":userid}})
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
    


app.post('/selectproject', isLoggedIn, (req, res) => {
    var selectedproject = req.body.Project;
    var buttonvalue = req.body.select;
    var user = req.user._id;
    var loggeduserrole = loggeduserrole;
    res.cookie('project', selectedproject);
    if(!gfs) {
        console.log("some error occured, check connection to db");
        res.send("some error occured, check connection to db");
        process.exit(0);
      }
    if (buttonvalue == "Select project") {
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
                    if (response == null) {
                        res.render('selectprojecterror')
                    } else {
                        for (const i in response.access) {
                            console.log("user is " + response.access[i].user)
                            console.log("user is " + user)
                            if (response.access[i].userid == user) {
                                loggeduserrole = response.access[i].role
                            };
                        };
                        console.log(loggeduserrole)
                        console.log()
                        res.render('project', {data: {project : selectedproject, files:files, roles:response.role, name:response.name, user:user.toString(), creator:response.userid, users:response.access, loggeduserrole:loggeduserrole}});
                    }
                    
                });
            
        });
    } else if (buttonvalue == "Delete project") {
        Project.remove({_id:selectedproject}, (function(err) {
            console.log("deleted");
            res.redirect("/");
        }))
    } else if (buttonvalue == "New project") {
        res.render("newproject");
    }
    
    
      
});



app.delete('/files/:id', isLoggedIn, (req, res) => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conndb2.db, {
        bucketName: "uploads",
      });
      gridfsBucket.delete(mongoose.Types.ObjectId(req.params.id));
    
    res.redirect("/");
});

app.post('/files/:id', isLoggedIn, async (req, res) => {
    console.log(req.params.id);
    console.log("downloading rn")
    const bucket = new mongodb.GridFSBucket(db1, {
        chunkSizeBytes: 1024,
        bucketName: 'uploads'
    });
    gfs.files.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, (err, file) => {
        //bucket.openDownloadStream(mongoose.Types.ObjectId(req.params.id)).
        //pipe(fs.createWriteStream(file.filename)).
        //on('error', function(error) {
        //    assert.ifError(error);
        //}).
        //on('end', function() {
        //    console.log('worked');
        //    process.exit(0);
        //});
        const readStream = bucket.openDownloadStream(file._id);
        readStream.pipe(res)


    });      
        
    //res.redirect('/');
});

app.get("/files", isLoggedIn, (req,res) => {
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0 ) {
            return res.status(404).json( {
                err: 'No Files Exist'
            });
        }
        return res.json(files);
    });
});

app.get("/files/:filename", isLoggedIn, (req,res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if(!file || file.length === 0 ) {
            return res.status(404).json( {
                err: 'No File Exist'
            });
        }
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
          }
    });
});

app.post('/templates', isLoggedIn, (req,res) => {
    gfs.files.find({"metadata.project":"template"}).toArray((err,files) => {
        console.log(files)
        res.render('templates', {data: {files : files}})
    });    
});


//Handling user logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

//app.post('/upload', (req, res) => {
//    var selectedproject = req.body.Projects;
//    res.render('project', { selectedproject } );
//    console.log(selectedproject);
//});
 

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

//uploading files



app.post('/upload', upload.single('file'), isLoggedIn, (req, res, next) => {
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

app.get("/privacypolicy", function (req, res) {

    res.render("privacypolicy");
});
  
 
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});
