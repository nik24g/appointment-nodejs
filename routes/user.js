const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const passport = require("passport");
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
const router = express.Router();
const session = require("express-session");
const { query } = require("express");
const { rating } = require("../models/salon");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nitin",
  encoding: "utf8mb4"
});

function is_authenticated(req) {
  if (req.user == undefined) {
    return true
  }
  else {
    return false
  }
}

router.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
router.use(passport.initialize());
router.use(passport.session());

router.use(passport.authenticate('session'));
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
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  db.query("SELECT * FROM users WHERE username = ?", [username], function (err, row) {
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    crypto.pbkdf2(password, row[0].salt, 310000, 32, 'sha256', function (err, hashedPassword) {
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(row[0].password, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row[0]);
    });
  });
}));
router.use(async function (req, res, next) {
  if (req.user) {
    var sql = "SELECT * FROM users WHERE id = ?";
    var value = req.user.id;
    console.log(req.user);
    await db.query(sql, value, (err, result) => {
      if (req.user !== null) {
        req.user.name = result[0].name
        req.user.email = result[0].email
        req.user.id = result[0].id
      }
    })
  }
  console.log('check-1')
  res.locals.currentUser = req.user;
  next();
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/user',
  failureRedirect: '/user/login'
}));

router.get("/all-salons", async (req, res) => {
  if (is_authenticated(req)) {
    return res.redirect("/user/login")
  }
  const salons = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM salons', async (err, result) => {
      if (err) throw err;
      let count = 0;
      for (const i of result) {
        result[count].rating = await rating(i.id);
        count += 1;
      }
      resolve(result);
    })
  });
  console.log(salons)
  return res.render("home", { salons: salons });
});

router.get("/", (req, res) =>{
  return res.render("user-index", { layout: 'user-layout'})
})
router.get("/about-us", (req, res) =>{
  return res.render("user-aboutus", { layout: 'user-layout'})
})
router.get("/services", (req, res) =>{
  return res.render("user-services", { layout: 'user-layout'})
})
router.get("/blogs", (req, res) =>{
  return res.render("user-blogs", { layout: 'user-layout'})
})
router.get("/contact-us", (req, res) =>{
  return res.render("user-contactus", { layout: 'user-layout'})
})

router.get("/signup", (req, res) => {
  res.render("user-signup");
});
router.post('/signup', function (req, res, next) {
  if (req.body.password == req.body.repassword) {
    db.query(`SELECT * FROM users WHERE username = '${req.body.username}'`, (err, result) => {
      if (err) throw err
      console.log(result)
      if (result.length > 0) {
        var context = { alert: { tag: "danger", message: "User is already exists" } }
        return res.render("user-signup", { context: context })
      }
      else {
        var salt = crypto.randomBytes(16);
        crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function (err, hashedPassword) {
          console.log('ye h pass-', hashedPassword)
          if (err) { return next(err); }
          var creatUserSql = "INSERT INTO users (email, username, name, password, salt) VALUES ?";
          var values = [[req.body.email, req.body.username, req.body.name, hashedPassword, salt]]
          db.query(creatUserSql, [values], function (err) {
            if (err) { return next(err); }
            var user = {
              id: this.lastID,
              username: req.body.username,
            };
            res.redirect('/user/login');
          });
        });
      }
    })
  }
  else {
    var context = { alert: { tag: "danger", message: "Passwords not matched" } }
    return res.render("user-signup", { context: context })
  }
});
router.get("/login", (req, res) => {
  res.render("user-login");
});
router.get('/logout', function (req, res, next) {
  req.logout();
  return res.redirect('/user');
});


router.get("/salon/:id", async (req, res) => {
  if (is_authenticated(req)) {
    return res.redirect("/user/login")
  }
  const salon = await new Promise((resolve, reject) => {
    db.query(`SELECT * FROM salons WHERE id = '${req.params.id}'`, (err, result) => {
      if (err) throw err
      resolve(result);
    })
  });

  const timings = await new Promise((resolve, reject) => {
    db.query(`SELECT * FROM timings WHERE salon_id = '${salon[0].id}' AND active = 1 ORDER BY position_count ASC`, (err, result) => {
      if (err) throw err
      resolve(result);
    })
  });
  return res.render('salon', { salon: salon[0], timings: timings })
})


router.get("/appointments", async (req, res) => {
  if (is_authenticated(req)) {
    return res.redirect("/user/login")
  }
  let payload = {}
  let payloadList = []
  let getAppointmentQuery = `SELECT * FROM appointments WHERE user_id = '${req.user.id}' ORDER BY date DESC;`

  let appointments = await new Promise((resolve, reject) => {
    db.query(getAppointmentQuery, (err, result) => {
      if (err) throw err
      resolve(result)
    })
  });

  for (const i of appointments) {
    let lobject = {}
    lobject.id = i.id
    lobject.status = i.status
    lobject.date = i.date.toLocaleDateString()
    // db.query(`SELECT * FROM salons WHERE id = '${i.salon_id}'`, (err, result)=>{
    //     if (err) throw err
    //     lobject.salon_name = result[0].name
    //     lobject.salon_id = result[0].id
    //     lobject.salon_address = result[0].address
    // })
    let timing = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM timings WHERE id = '${i.timing_id}'`, (err, result) => {
        if (err) throw err
        lobject.slot_time = result[0].slot_time
        resolve(result[0].slot_time)
      })
    });
    payloadList.push(lobject)
  }

  payload.appointments = payloadList
  return res.render("user-all-appointments", payload)
})


router.get("/appointment/:id", async (req, res)=>{
  if (is_authenticated(req)) {
    return res.redirect("/user/login")
  }
  let payload = {}
  let appointment_id = req.params.id
  let getAppointmentQuery = `SELECT * FROM appointments WHERE id = '${appointment_id}';`
  let appointment = await new Promise((resolve, reject) => {
    db.query(getAppointmentQuery, (err, result) => {
      if (err) throw err
      resolve(result[0])
    })
  });
  console.log(appointment);
  if(appointment){
    if(req.user.id == appointment.user_id){
      let salon = await new Promise((resolve, reject) => {
        db.query(`SELECT id, username, email, name, address, owner_name, phone FROM salons WHERE id = '${appointment.salon_id}'`, (err, result)=>{
          if (err) throw err
          resolve(result[0])
        })
      });
    
      let timing = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM timings WHERE id = '${appointment.timing_id}'`, (err, result) => {
          if (err) throw err
          resolve(result[0])
        })
      });
      let rating = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM rating WHERE appointment_id = '${appointment_id}'`, (err, result) => {
          if (err) throw err
          resolve(result[0])
        })
      });
      if (rating){
        payload.rating = true
      }
      else{
        payload.rating = false
      }
      payload.appointment = appointment
      payload.salon = salon
      payload.timing = timing
      return res.render("user-appointment", payload)
    }
    else{
      return res.send("You are not autherise to see this page")
    }
  }
  else{
    return res.send("Appointment not found")
  }
})

router.post("/rating", async (req, res)=>{
  let appointmentId = req.body.appointmentId
  let salonId = req.body.salonId
  let userId = req.body.userId
  let rating = req.body.rating
  let message = req.body.message

  // console.log(req.body)
  if (userId != req.user.id){
    return res.send("You are not allowed to perform this task...")
  }

  let query = `INSERT INTO rating (rate, message, user_id, salon_id, appointment_id) VALUE ('${rating}', '${message}', '${userId}', '${salonId}', '${appointmentId}');`
  // console.log(query);

  await new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) throw err
      resolve(result)
    })
  });
  return res.redirect("/user/")
})
module.exports = router;
