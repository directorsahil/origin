require('dotenv').config()

const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

// You can access your data from .env file

console.log(process.env.API_KEY);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true},{ useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  Password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["Password"] });

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){

  const userOne = new User({
    email: req.body.username,
    Password: req.body.password
  });

  userOne.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});

app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email: username}, function(err, foundusers){
    if(err){
      console.log(err);
    }else{
      if(foundusers){
        if(foundusers.Password === password){
          res.render("secrets");
        }else{
          res.render("usererror");
        }
      }else{
        res.render("usererror");
      }
    }
  });
});

app.post("/usererror", function(req, res){
  res.redirect("/register");
});

app.listen(3000, function(){
  console.log("Port 3000 is started working now");
})
