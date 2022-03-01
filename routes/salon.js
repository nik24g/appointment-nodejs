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

passport.use("salonStrategy", new LocalStrategy(function verify(username, password, cb) {
    db.query("SELECT * FROM salons WHERE username = ?", [username], function(err, row) {
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
    let time = new Date()
    db.query(`UPDATE salons SET last_login = '${time.toISOString().slice(0, 10)} ${time.toLocaleTimeString()}' WHERE username = '${username}';`)
}));

router.use(async function(req,res,next){
    if (req.user){
      var sql = "SELECT * FROM salons WHERE id = ?";
      var value = req.user.id;
      // console.log(req.user);
      await db.query(sql, value, (err, result)=>{
        if (req.user !== null){
          req.user.name = result[0].name
          req.user.owner_name = result[0].owner_name
          req.user.email = result[0].email
          req.user.address = result[0].address
          req.user.phone = result[0].phone
        }
      })
    }
    // console.log('check-1')
    res.locals.currentUser=req.user;
    next();
  });
router.get("/", async (req, res)=>{
    if (req.user == undefined){
        return res.redirect("/salon/login")
    }
    const timings = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM timings WHERE salon_id = '${req.user.id}'`, (err, result)=> {
        if (err) throw err
        resolve(result);
      })
    });
    res.render("salon-home", {timings: timings})
})
router.get("/login", (req, res)=>{
    res.render("salon-login")
})
router.get("/signup", (req, res)=>{
    res.render("salon-signup")
})

router.post('/login', passport.authenticate('salonStrategy', {
    successRedirect: '/salon',
    failureRedirect: '/salon/logi'
}));

router.post('/signup', function(req, res, next) {
    if(req.body.password == req.body.repassword){
      db.query(`SELECT * FROM salons WHERE username = '${req.body.username}'`, (err, result)=>{
        if(err) throw err
        // console.log(result)
        if (result.length > 0){
          var context = {alert: {tag: "danger", message: "Email already exists"}}
          return res.render("salon-signup", {context: context})
        }
        else{
          var salt = crypto.randomBytes(16);
          crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            // console.log('ye h pass-', hashedPassword)
            if (err) { return next(err); }
            var creatUserSql = "INSERT INTO salons (username, email, name, address, owner_name, phone, password, salt) VALUES ?";
            var values = [[req.body.username, req.body.email, req.body.name, req.body.address, req.body.ownername, req.body.phone, hashedPassword, salt]]
            db.query(creatUserSql, [values], function(err) {
              if (err) { return next(err); }
            //   console.log("register")
              var user = {
                id: this.lastID,
                email: req.body.email,
              };
              res.redirect('/salon/login');
            });
          });
        }
      })
    }
    else{
      var context = {alert: {tag: "danger", message: "Passwords not matched"}}
      return res.render("salon-signup", {context: context})
    }  
});

router.get('/logout', function(req, res, next) {
    req.logout();
    return res.redirect('/salon/login');
  });
module.exports = router;