var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose =
        require("passport-local-mongoose"),
    User = require("./models/user");
    Project = require("./models/project")
 
    

mongoose.connect("mongodb://localhost/auth_demo_app");
 
var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
 
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
        // Pass the DB result to the template
        res.render('projects', { dropdownVals: response })
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


app.post('/createproject', (req, res) => {
    var project= req.body.projectname;
    var user_id = req.user._id
    Project.create({
        name: project,
        userid: user_id
        
    }).then(book => console.log(book))
        .catch(err => console.error(err));
    
    res.render('index')
    
}); 

app.post('/selectproject', (req, res) => {
    res.render('project')
});


//Handling user logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});
 

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}
 
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});