require('dotenv').config()
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const encrypt = require('mongoose-encryption')

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }))

// DB Setup

mongoose.connect('mongodb://127.0.0.1:27017/userDB')
  .then(() => console.log('connected to db'))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})
console.log(process.env.SECRET);

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);


app.get('/', function (req, res) {
  res.render('home')
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/register', function (req, res) {
  res.render('register')
})

app.post('/register', function (req, res) {
  let username = req.body.username;
  let password = req.body.password;

  const user1 = new User({
    email: username,
    password: password
  })

  user1.save()
    .then(() => {
      res.render('secrets');
    })
    .catch((err) => {
      console.log(err);
    })
})

app.post('/login', function (req, res) {
  let username = req.body.username;
  let password = req.body.password;

  User.findOne({ email: username })
    .then(function (foundUser) {

      if (foundUser) {

        if (foundUser.password === password) {
          res.render("secrets")
        }
        else if (foundUser.password !== password) {
          res.send("The Password You Provided Is Wrong")
        }

      } else if (!foundUser) {
        res.send("Account Doesn't Exist. Register Your Account To Login")
      }

    })
    .catch(function (err) {
      console.log(err);
    })
})



app.listen(3000, function () {
  console.log("server has started on port 3000");
})








