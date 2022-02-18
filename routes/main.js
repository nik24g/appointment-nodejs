const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const passport = require("passport");
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
const router = express.Router();
const session = require("express-session");
const async = require("hbs/lib/async");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nitin",
  encoding: "utf8mb4"
});
router.use(passport.initialize());
router.use(passport.session());
// router.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );
router.use(passport.authenticate('session'));
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(new LocalStrategy(function verify(username, password, cb) {
  db.query("SELECT * FROM users WHERE username = ?", [username], function(err, row) {
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    crypto.pbkdf2(password, row[0].salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(row[0].password, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row[0]);
    });
  });
}));
router.use(async function(req,res,next){
  if (req.user){
    var sql = "SELECT * FROM users WHERE id = ?";
    var value = req.user.id;
    // console.log(req.user);
    await db.query(sql, value, (err, result)=>{
      if (req.user !== null){
        req.user.fullname = result[0].name
        req.user.email = result[0].email
      }
    })
  }
  // console.log('check-1')
  res.locals.currentUser=req.user;
  next();
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.get("/", async(req, res) => {
  if (req.user == undefined){
    return res.redirect("/login")
  }
  const salons = await new Promise((resolve, reject)=> {
    db.query('SELECT * FROM salons', (err, result)=> {
      if (err) throw err
      resolve(result);
    })
  });
  // console.log(salons)
  return res.render("home", {salons: salons});
});

router.post('/signup', function(req, res, next) {
  if(req.body.password == req.body.repassword){
    db.query(`SELECT * FROM users WHERE username = '${req.body.username}'`, (err, result)=>{
      if(err) throw err
      // console.log(result)
      if (result.length > 0){
        var context = {alert: {tag: "danger", message: "User is already exists"}}
        return res.render("signup", {context: context})
      }
      else{
        var salt = crypto.randomBytes(16);
        crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
          // console.log('ye h pass-', hashedPassword)
          if (err) { return next(err); }
          var creatUserSql = "INSERT INTO users (email, username, name, password, salt) VALUES ?";
          var values = [[req.body.email, req.body.username, req.body.name, hashedPassword, salt]]
          db.query(creatUserSql, [values], function(err) {
            if (err) { return next(err); }
            var user = {
              id: this.lastID,
              username: req.body.username,
            };
            res.redirect('/login');
          });
        });
      }
    })
  }
  else{
    var context = {alert: {tag: "danger", message: "Passwords not matched"}}
    return res.render("signup", {context: context})
  }  
});
router.get("/login", (req, res) => {
  res.render("login");
});
router.get('/logout', function(req, res, next) {
  req.logout();
  return res.redirect('/');
});

// router.post("/login", async (req, res) => {
//   // Capture the input fields
//   let username = req.body.username;
//   let password = req.body.password;
//   // Ensure the input fields exists and are not empty
//   if (username && password) {
//     // Execute SQL query that'll select the account from the database based on the specified username and password
    // await connection.query(
    //   "SELECT * FROM user WHERE username = ?",
    //   [username],
//       async function (error, results, fields) {
//         // If there is an issue with the query, output the error
//         if (error) throw error;
//         // If the account exists
//         console.log(results[0].password);
//         if (results.length > 0) {
//           // Authenticate the user
//           const isPasswordMatched = await bcrypt.compare(
//             password,
//             results[0].password
//           );
//           if (isPasswordMatched) {
//             req.session.loggedin = true;
//             req.session.username = username;
//             req.session.email = results[0].email
//             req.session.name = results[0].name
//             // Redirect to home page
//             res.redirect("/");
//           } else {
//             res.send("password not matched");
//           }
//         } else {
//           res.send("Incorrect Username and/or Password!");
//         }
//         res.end();
//       }
//     );
//   } else {
//     res.send("Please enter Username and Password!");
//     res.end();
//   }
// });

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.get("/salon/:id", async(req, res)=>{
  const salon = await new Promise((resolve, reject)=> {
    db.query(`SELECT * FROM salons WHERE id = '${req.params.id}'`, (err, result)=> {
      if (err) throw err
      resolve(result);
    })
  });
  // console.log(salon[0]);

  const timings = await new Promise((resolve, reject)=> {
    db.query(`SELECT * FROM timings WHERE salon_id = '${salon[0].id}'`, (err, result)=> {
      if (err) throw err
      resolve(result);
    })
  });
  // console.log(timings)
  return res.render('salon', {salon: salon[0], timings: timings})
})
module.exports = router;
