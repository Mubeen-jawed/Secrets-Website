require('dotenv').config()
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session");
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: "String which i can remember",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session())

// DB Setup

mongoose.connect('mongodb://127.0.0.1:27017/userDB')
  .then(() => console.log('connected to db'))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

const LocalStrategy = require("passport-local")
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

///////////////////////////////////// Google Strategy /////////////////////////////////////////////////////


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  // scope: [ 'profile' ],
  // state: true
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOne({ googleId: profile.id })
      .then(user => {
        if (user) {
          return cb(null, user);
        }
        else {
          const newUser = new User({ googleId: profile.id });
          newUser.save()
            .then(user => {
              return cb(null, user);
            })
            .catch(err => {
              return cb(err);
            });
        }
      })
      .catch(err => {
        return cb(err);
      });
  }
));

///////////////////////////////////// Facebook Strategy /////////////////////////////////////////////////////

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOne({ facebookId: profile.id })
      .then(user => {
        if (user) {
          return cb(null, user);
        }
        else {
          const newUser = new User({ facebookId: profile.id });
          newUser.save()
            .then(user => {
              return cb(null, user);
            })
            .catch(err => {
              return cb(err);
            });
        }
      })
      .catch(err => {
        return cb(err);
      });
  }
));

////////////////////////////////////////////// Routes //////////////////////////////////////////////////

app.get('/', function (req, res) {
  res.render('home')
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/register', function (req, res) {
  res.render('register')
})


app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render('secrets')
  }
  else {
    res.redirect('login')
    console.log("not authenticated");
  }
})

////////////////////////////////////////////// Google Login Route //////////////////////////////////////////////////


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

////////////////////////////////////////////// Facebook Login Route //////////////////////////////////////////////////


app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/")
    }
  });
})

app.post('/register', function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register')
    }

    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets")
      })
    }
  })
})

app.post('/login', function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets")
      })
    }
  })
})



app.listen(3000, function () {
  console.log("server has started on port 3000");
})








