const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport");
var { engine } = require("express-handlebars");
const { createServer } = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const { authenticate } = require("passport");
const async = require("hbs/lib/async");
const Handlebars = require("handlebars");


const port = 3000;
const app = express();
const httpServer = createServer(app);
// var t = "router"
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nitin",
  multipleStatements: true
});

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "static")));
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

var socket = io.on('connection', function(socket){
  socket.emit("connected", "connected")

  socket.on("request", async (message)=>{
    var initializeAppointment = "INSERT INTO appointments (active_status	, status, user_id, salon_id, timing_id) VALUES ?";
    var values = [["1", "pending", message.user_id, message.salon_id, message.timing_id]]
    const appointment = await new Promise((resolve, reject)=> {
      db.query(initializeAppointment, [values], (err, result)=>{
        if (err) throw err
        resolve(result);
      })
    });
    const user_query = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM users WHERE id = '${message.user_id}'`, (err, result)=> {
        if (err) throw err
        resolve(result);
      })
    });
    const timing_query = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM timings WHERE id = '${message.timing_id}'`, (err, result)=> {
        if (err) throw err
        resolve(result);
      })
    });
    var user = {id: user_query[0].id, name: user_query[0].name, email: user_query[0].email}
    console.log(appointment.insertId);
    await io.emit(`incoming-request-${message.salon_id}`, {user: user, timing: timing_query[0].slot_time, timing_id: message.timing_id, appointment_id: appointment.insertId})
  })

  socket.on('accept-event', async(message)=>{
    var appointment_id = message.appointment_id
    var timing_id = message.timing_id
    var user_id = message.user_id
    let timing_query = `UPDATE timings SET count = count - 1 WHERE id = '${timing_id}'; SELECT * FROM timings WHERE id = '${timing_id}';`

    db.query(`UPDATE appointments SET status = 'accepted' WHERE id = '${appointment_id}';`)
    db.query(timing_query, (err, result)=>{
      if (err) throw err;
      console.log(result[1][0].count)
      if (result[1][0].count == 0){
        db.query(`UPDATE timings SET available = '0', status = "Booked" WHERE id = '${timing_id}';`)
      }
    })

    const timing_obj = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM timings WHERE id = '${timing_id}'`, (err, result)=> {
        if (err) throw err
        resolve(result);
      })
    });
    const salon_query = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM salons WHERE id = '${timing_obj[0].salon_id}'`, (err, result)=> {
        if (err) throw err
        resolve(result);
      })
    });
    var info = `Your appointment request in "${salon_query[0].name}" at time ${timing_obj[0].slot_time} is accepted`
    io.emit(`request-accepted-${user_id}`, {message: info})
  })
  socket.on('decline-event', async(message)=>{
    var appointment_id = message.appointment_id
    var user_id = message.user_id
    var timing_id = message.timing_id
    const appointment_status = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM appointments WHERE id = '${appointment_id}'`, (err, result)=>{
        if(err) throw err
        if (err) throw err
          resolve(result[0].status);
      })
    });
    if (appointment_status == "pending"){
      db.query(`UPDATE appointments SET status = 'decline', active_status = 0 WHERE id = '${appointment_id}';`)
      
      const timing_query = await new Promise((resolve, reject)=> {
        db.query(`SELECT * FROM timings WHERE id = '${timing_id}'`, (err, result)=> {
          if (err) throw err
          resolve(result);
        })
      });
      const salon_query = await new Promise((resolve, reject)=> {
        db.query(`SELECT * FROM salons WHERE id = '${timing_query[0].salon_id}'`, (err, result)=> {
          if (err) throw err
          resolve(result);
        })
      });
      var info = `Your appointment request in "${salon_query[0].name}" at time ${timing_query[0].slot_time} is declined`
      // console.log(`request-declined-${user_id}`);
      io.emit(`request-declined-${user_id}`, {message: info})
    }
  })

  socket.on(`disable-slot`, (message)=>{
    var timing_id = message.timing_id
    var salon_id = message.salon_id
    let slot_type = message.slot_type
    let update_count;
    if(slot_type == "one hour"){
      update_count = 1
    }
    else{
      update_count = 0.5
    }
    console.log(slot_type)
    db.query(`UPDATE timings SET available = '0', status = "Disabled" WHERE id = '${timing_id}';`)
    db.query(`UPDATE salons SET slot_disable_count = slot_disable_count - '${update_count}' WHERE id = '${salon_id}';`)
  })

  socket.on(`enable-slot`, (message)=>{
    var timing_id = message.timing_id
    var salon_id = message.salon_id
    let slot_type = message.slot_type
    let update_count;
    if(slot_type == "one hour"){
      update_count = 1
    }
    else{
      update_count = 0.5
    }
    db.query(`UPDATE timings SET available = '1', status = "Enabled" WHERE id = '${timing_id}';`)
    db.query(`UPDATE salons SET slot_disable_count = slot_disable_count + '${update_count}' WHERE id = '${salon_id}';`)
  })

  return socket
})

app.get('/test', (req, res)=>{
  socket.emit('1', "refferal")
  res.render('test')
})
app.get("/", (req, res)=>{
  return res.render("index")
})

app.use('/static', express.static(path.join(__dirname, 'static')))
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use("/user", require("./routes/user.js"));
app.use("/salon", require("./routes/salon.js"))

// handlebars halpers
Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('times', function(n, block) {
  var accum = '';
  for(var i = 0; i < n; ++i)
      accum += block.fn(i);
  return accum;
});


httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


// very usefull for authenticate two users with different tables
// https://stackoverflow.com/questions/20052617/use-multiple-local-strategies-in-passportjs
