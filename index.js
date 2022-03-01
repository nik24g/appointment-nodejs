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

const port = 3000;
const app = express();
const httpServer = createServer(app);
// var t = "router"
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nitin",
  encoding: "utf8mb4"
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
    await io.emit(`incoming-request-${message.salon_id}`, {user: user, timing: timing_query[0].time, timing_id: message.timing_id, appointment_id: appointment.insertId})
  })

  socket.on('accept-event', async(message)=>{
    var appointment_id = message.appointment_id
    var timing_id = message.timing_id
    var user_id = message.user_id
    db.query(`UPDATE appointments SET status = 'accepted' WHERE id = '${appointment_id}';`)
    db.query(`UPDATE timings SET available = '0' WHERE id = '${timing_id}';`)

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
    var info = `Your appointment request in "${salon_query[0].name}" at time ${timing_query[0].time} is accepted`
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
      var info = `Your appointment request in "${salon_query[0].name}" at time ${timing_query[0].time} is declined`
      // console.log(`request-declined-${user_id}`);
      io.emit(`request-declined-${user_id}`, {message: info})
    }
  })

  socket.on(`disable-slot`, (message)=>{
    var timing_id = message.timing_id
    var salon_id = message.salon_id
    db.query(`UPDATE timings SET available = '0' WHERE id = '${timing_id}';`)
  })
  socket.on(`enable-slot`, (message)=>{
    var timing_id = message.timing_id
    var salon_id = message.salon_id
    db.query(`UPDATE timings SET available = '1' WHERE id = '${timing_id}';`)
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

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use("/salon", require("./routes/salon.js"))
app.use("/user", require("./routes/user.js"));


httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


// very usefull for authenticate two users with different tables
// https://stackoverflow.com/questions/20052617/use-multiple-local-strategies-in-passportjs
