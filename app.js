require('dotenv').config()

const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
// const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

// You can access your data from .env file


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

app.use(session({
  secret: "This is my lil secret.",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true},{ useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  Password: String,
  googleId: String,
  secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

//will help in authenticate the data of users.
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Google OAuth.
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {   //Remember: findOrCreate requires mongoose-findOrCreate package.
      return done(err, user);
    });
  }
));


app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/usererror", function(req, res){
  res.render("usererror");
})
app.get("/secrets", function(req, res){
   User.find({"secret": {$ne:null}}, function(err, foundUsers){  // Here $ne = not null.It will check whether secret field is null or not.
     if(err){
       console.log(err);
     }else{
       if(foundUsers){
         res.render("secrets", {usersWithSecrets: foundUsers});
       }
     }
   })
});

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){   // Remember: .isAuthenticated() will see if user is logged in or not. if user logged-In the it will generate True.
    res.render("submit");
  } else{
    res.redirect("/login");
  }
});

  app.post("/submit", function(req, res){

    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser){
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

User.register({username:req.body.username}, req.body.password, function(err, user){
  if(err){
    console.log(err);
    res.redirect("/register");
  }else{
   passport.authenticate("local")(req, res, function(){
     res.redirect("/secrets");
   })
  }
})
});

app.post("/login", function(req, res){

  const user = new User({
  email: req.body.username,
    Password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })

});

app.post("/usererror", function(req, res){
  res.redirect("/register");
});



app.listen(3000, function(){
  console.log("Port 3000 is started working now");
});
