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

const port = 3000;
const app = express();
const httpServer = createServer(app);

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb",
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
let barberId = "1";

var socket = io.on('connection', function(socket){
  return socket
})
app.get('/test', (req, res)=>{
  socket.emit('1', "refferal")
  res.render('test')
})

var socket = io.on('connection', function(socket){
  return socket
})
// app.post("/signup", async (req, res) => {
//   const { email, username, name, password, repassword } = req.body;
//   if (password != repassword) {
//     res.send("password not matched");
//   }
//   let result;
//   await connection.query(
//     `SELECT * FROM user WHERE username = ${username}`,
//     async (error, results, fields) => {
//       // if (error) throw error;
//       result = results;
//     }
//   );
//   console.log(result);
//   //   const dbUser = await db.query(selectUserQuery);
//   const hashedPassword = await bcrypt.hash(password, 10);
//   console.log(hashedPassword);
//   if (result == undefined) {
//     await connection.query(`
//     INSERT INTO 
//       user (email, username, name, password) 
//     VALUES
//       (
//         '${email}',
//         '${username}',
//         '${name}',
//         '${hashedPassword}'
//       )`);
//     socket.emit('1', "refferal")
//     res.redirect("/");
//   } else {
//     res.status = 400;
//     res.send("User already exists");
//   }
// });

// socket connections

// io.to('1').emit(barberId);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use("/", require("./routes/main.js"));

httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
