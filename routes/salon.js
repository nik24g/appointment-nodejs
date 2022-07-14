const express = require("express");
const mysql = require("mysql");
const passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");
const router = express.Router();
const session = require("express-session");
const { create_work } = require("../models/salon");
const { create_slots } = require("../models/slots");
const { response } = require("express");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nitin",
  encoding: "utf8mb4",
  multipleStatements: true
});

function is_authenticated(req){
  if (req.user == undefined){
    return true
  }
  else{
    return false
  }
}

router.use(passport.initialize());
router.use(passport.session());
router.use(passport.authenticate("session"));

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

passport.use(
  "salonStrategy",
  new LocalStrategy(async function verify(username, password, cb) {
    db.query(
      "SELECT * FROM salons WHERE username = ?",
      [username],
      function (err, row) {
        if (err) {
          return cb(err);
        }
        if (!row) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        crypto.pbkdf2(
          password,
          row[0].salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row[0].password, hashedPassword)) {
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            return cb(null, row[0]);
          }
        );
      }
    );

    // current login time
    let currentLoginTime = new Date();
    currentLoginTime.setHours(09);
    currentLoginTime.setMinutes(40);
    currentLoginTime.hour = currentLoginTime.toLocaleTimeString("hi-IN").split(" ")[0].split(":")[0];
    currentLoginTime.minute = currentLoginTime.toLocaleTimeString("hi-IN").split(" ")[0].split(":")[1];
    currentLoginTime.period = currentLoginTime.toLocaleTimeString("hi-IN").split(" ")[1];

    // saving login time in db
    db.query(`UPDATE salons SET last_login = '${currentLoginTime.toISOString().slice(0,10)} ${currentLoginTime.toLocaleTimeString()}' WHERE username = '${username}';`
    );

    // fetching login count from db
    let login_count = await new Promise((resolve, reject) => {
      db.query(
        `SELECT login_count FROM salons WHERE username = '${username}';`,
        (err, result) => {
          if (err) throw err;
          resolve(result[0].login_count);
        }
      );
    });

    // cancelling pre-generated holiday on 1st login of the day
    if (login_count == 0) {
      if (currentLoginTime.hour < 11 && currentLoginTime.period == "am") {
        db.query(
          `UPDATE salons SET holiday = '0' WHERE username = '${username}';`
        );
      } else if (
        currentLoginTime.hour == 11 &&
        currentLoginTime.period == "am"
      ) {
        if (currentLoginTime.minute <= 30) {
          console.log("check-2");
          db.query(
            `UPDATE salons SET holiday = '0' WHERE username = '${username}';`
          );
        }
      }
    }

    // updating login count in db
    login_count += 1;
    db.query(
      `UPDATE salons SET login_count = '${login_count}' WHERE username = '${username}'`
    );
  })
);

router.use(async function (req, res, next) {
  if (req.user) {
    var sql = "SELECT * FROM salons WHERE id = ?";
    var value = req.user.id;
    // console.log(req.user);
    db.query(sql, value, (err, result) => {
      if (req.user !== null) {
        req.user.name = result[0].name;
        req.user.owner_name = result[0].owner_name;
        req.user.email = result[0].email;
        req.user.address = result[0].address;
        req.user.phone = result[0].phone;
        req.user.login_count = result[0].login_count;
        req.user.isSlotsAlloted = result[0].isSlotsAlloted;
        req.user.isHoliday = result[0].holiday;
        req.user.slot_disable_count = result[0].slot_disable_count;
      }
    });
  }
  // console.log('check-1')
  res.locals.currentUser = req.user;
  next();
});

router.get("/", async (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (req.user.isHoliday) {
    return res.redirect("/salon/holiday");
  }
  const timings = await new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM timings WHERE salon_id = '${req.user.id}' AND active = 1 ORDER BY position_count ASC`,
      (err, result) => {
        if (err) throw err;
        resolve(result);
      }
    );
  });
  // console.log(req.user.isSlotsAlloted);
  if (!req.user.isSlotsAlloted) {
    return res.redirect("/salon/starting-day");
  }
  return res.render("salon-home", { timings: timings });
});

router.get("/login", (req, res) => {
  res.render("salon-login");
});
router.get("/signup", (req, res) => {
  res.render("salon-signup");
});

router.post(
  "/login",
  passport.authenticate("salonStrategy", {
    successRedirect: "/salon",
    failureRedirect: "/salon/login",
  })
);

router.post("/signup", function (req, res, next) {
  if (req.body.password == req.body.repassword) {
    db.query(
      `SELECT * FROM salons WHERE username = '${req.body.username}'`,
      (err, result) => {
        if (err) throw err;
        // console.log(result)
        if (result.length > 0) {
          var context = {
            alert: { tag: "danger", message: "Email already exists" },
          };
          return res.render("salon-signup", { context: context });
        } else {
          var salt = crypto.randomBytes(16);
          crypto.pbkdf2(
            req.body.password,
            salt,
            310000,
            32,
            "sha256",
            function (err, hashedPassword) {
              // console.log('ye h pass-', hashedPassword)
              if (err) {
                return next(err);
              }
              var creatUserSql =
                "INSERT INTO salons (username, email, name, address, owner_name, phone, password, salt) VALUES ?";
              var values = [
                [
                  req.body.username,
                  req.body.email,
                  req.body.name,
                  req.body.address,
                  req.body.ownername,
                  req.body.phone,
                  hashedPassword,
                  salt,
                ],
              ];
              db.query(creatUserSql, [values], function (err) {
                if (err) {
                  return next(err);
                }
                //   console.log("register")
                var user = {
                  id: this.lastID,
                  email: req.body.email,
                };
                res.redirect("/salon/login");
              });
            }
          );
        }
      }
    );
  } else {
    var context = {
      alert: { tag: "danger", message: "Passwords not matched" },
    };
    return res.render("salon-signup", { context: context });
  }
});

router.get("/logout", function (req, res, next) {
  req.logout();
  return res.redirect("/salon/login");
});

router.get("/create-custom-slots", (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  return res.render("create-custom-slots");
});


router.get("/starting-day", (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (req.user.isHoliday) {
    return res.redirect("/salon/holiday");
  }
  if (req.user.isSlotsAlloted) {
    return res.redirect("/salon/");
  }
  return res.render("salon-starting-day");
});
router.post("/starting-day", async (req, res) => {
  let work_hour = req.body.work_hour;
  let count = req.body.count;

  if (work_hour == undefined) {
    create_slots(req.user.id);
    await db.query(
      `UPDATE salons SET isSlotsAlloted = '1' WHERE id = '${req.user.id}'`,
      (err, result) => {
        setTimeout(() => {
          return res.redirect("/salon/");
        }, 500);
      }
    );
  } else {
    await create_work(work_hour, count, req.user.id);
    await create_slots(req.user.id);
    await db.query(
      `UPDATE salons SET isSlotsAlloted = '1' WHERE id = '${req.user.id}'`,
      (err, result) => {
        setTimeout(() => {
          return res.redirect("/salon/");
        }, 500);
      }
    );
  }
});

router.get("/holiday", (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (!req.user.isHoliday) {
    return res.redirect("/salon/");
  }
  return res.render("salon-holiday");
});
router.post("/holiday", (req, res) => {
  db.query(
    `UPDATE salons SET holiday = '1' WHERE id = '${req.user.id}';`,
    (err, result) => {
      if (err) throw err;
      return res.redirect("/salon/holiday");
    }
  );
});

router.get("/profile", (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  db.query(
    `SELECT * from default_work_hour WHERE salon_id = '${req.user.id}'`,
    (err, result) => {
      if (err) throw err;
      let default_work_hour = result[0].hour;
      let sitting_count = result[0].count;
      return res.render("salon-profile", {
        default_work_hour: default_work_hour,
        sitting_count: sitting_count,
      });
    }
  );
});

router.post("/profile/:update", (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (req.params.update == "default") {
    let count = req.body.count;
    let hour = req.body.work_hour;
    var context = {
      alert: { tag: "success", message: "Updated successfully" },
    };
    db.query(
      `UPDATE default_work_hour SET hour = '${hour}', count = '${count}' WHERE salon_id = '${req.user.id}'`
    );
    db.query(
      `SELECT * from default_work_hour WHERE salon_id = '${req.user.id}'`,
      (err, result) => {
        if (err) throw err;
        let default_work_hour = result[0].hour;
        let sitting_count = result[0].count;
        return res.render("salon-profile", {
          default_work_hour: default_work_hour,
          sitting_count: sitting_count,
          context: context,
        });
      }
    );
  }
});

router.get("/custom-slots", async (req, res) => {
  let context = {};
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (req.user.isHoliday) {
    return res.redirect("/salon/holiday");
  }
  if (!req.user.isSlotsAlloted) {
    return res.redirect("/salon/starting-day");
  }
  const timings = await new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM timings WHERE salon_id = '${req.user.id}' AND active = 1 ORDER BY position_count ASC`,
      (err, result) => {
        if (err) throw err;
        resolve(result);
      }
    );
  });
  context.timings = timings;
  return res.render("salon-customSlots", context);
});

router.post("/custom-slots", async (req, res) => {
  let first_half_hour_slot = req.body.firstSlot;
  let second_half_hour_slot = req.body.secondSlot;
  let one_hour_slot = req.body.thirdSlot;

  let one_hour_slot_id = one_hour_slot.split(" ")[0];
  let first_half_hour_slot_id = first_half_hour_slot.split(" ")[0];
  let second_half_hour_slot_id = second_half_hour_slot.split(" ")[0];
  
  let shitting_count;

  console.log(req.body);
  let startTimeForMerge;
  let endTimeForMerge;

  // split
  await db.query(
    `SELECT * FROM timings WHERE id = '${one_hour_slot_id}';
    UPDATE timings SET active = 0, available = 0, status = 'dismissed' WHERE id = '${one_hour_slot_id}';`,
    async (err, result) => {
      if (err) throw err;
      else {
        shitting_count = result[0][0].count
        console.log(result[0][0])
        let slot_time = result[0][0].slot_time
        console.log(slot_time)
        let startTime = slot_time.split("-")[0];
        let endTime = slot_time.split("-")[1];
        let position_count_first_half = result[0][0].position_count
        let position_count_second_half = result[0][0].position_count + 0.5

        // 12:00 pm-1:00 pm  -->main slot_time
        // 12:00 pm-12:30 pm -->1st half slot_time
        // 12:30 pm-1:00 pm  -->2nd half slot_time

        // 12:00 pm --> start slot_time
        // 1:00 pm  --> end slot_time
        // 12:30 pm --> break slot_time

        // b1 = 12:
        // b2 = 0 pm
        // b1 = startTime.slice(0, 3);
        // b2 = startTime.slice(4, 8);

        let startTimeHour = startTime.split(" ")[0].split(":")[0];
        let breakTime = `${startTimeHour}:30 pm`;

        console.log("first half-->", `${startTime}-${breakTime}`);
        console.log("second half-->", `${breakTime}-${endTime}`);
        await db.query(
          `INSERT INTO timings 
        (slot_time, slot_type, salon_id, count, position_count, status) VALUES
        ('${startTime}-${breakTime}', 'half hour', '${req.user.id}', '${shitting_count}', '${position_count_first_half}', 'Initilized'),
        ('${breakTime}-${endTime}', 'half hour', '${req.user.id}', '${shitting_count}', '${position_count_second_half}', 'Initilized');`,
          (err, result2) => {
            if (err) throw err;
          }
        );
      }
    }
  );

  // merge
  await db.query(`
    SELECT * FROM timings WHERE id = '${first_half_hour_slot_id}';
    UPDATE timings SET active = 0, available = 0, status = 'dismissed' WHERE id = '${first_half_hour_slot_id}';
    SELECT * FROM timings WHERE id = '${second_half_hour_slot_id}';
    UPDATE timings SET active = 0, available = 0, status = 'dismissed' WHERE id = '${second_half_hour_slot_id}';
    `,async (err, result) => {
    if (err) throw err;
    else {
      let position_count = result[0][0].position_count
      console.log(result)
      if (result[0][0].slot_time.split("-")[0] == result[2][0].slot_time.split("-")[1]){
        startTimeForMerge = result[2][0].slot_time.split("-")[0];
        console.log(startTimeForMerge);

        endTimeForMerge = result[0][0].slot_time.split("-")[1];
        console.log(endTimeForMerge);
      }
      else{
        startTimeForMerge = result[0][0].slot_time.split("-")[0];
        console.log(startTimeForMerge);
  
        endTimeForMerge = result[2][0].slot_time.split("-")[1];
        console.log(endTimeForMerge);
      }

      console.log(`the merged slot_time--> ${startTimeForMerge}-${endTimeForMerge}`)

      await db.query(`INSERT INTO timings (slot_time, slot_type, salon_id, count, position_count, status) VALUES ('${startTimeForMerge}-${endTimeForMerge}', 'one hour', '${req.user.id}', '${shitting_count}', '${position_count}', 'Initilized');`, (err, result)=>{
        if (err) throw err;
        return res.redirect("/salon/")
      })
    }
  });
});

router.get("/appointments", async (req, res)=>{
  if (is_authenticated(req)){
    return res.redirect("/salon/login")
  }
  let payload = {}
  let payloadList = []
  var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  let currentDate = new Date().toLocaleDateString('hi-IN', options).split("/").reverse().join("-")
  let getAppointmentQuery = `SELECT * FROM appointments WHERE salon_id = '${req.user.id}' AND (status = 'accepted' OR status = 'completed') AND date = '${currentDate}';`

  let appointments = await new Promise((resolve, reject)=> {
    db.query(getAppointmentQuery, async (err, result) => {
      if (err) throw err
      resolve(result)
    })
  });
  for (const i of appointments) {
    let lobject = {}
    lobject.id = i.id
    lobject.status = i.status
    lobject.date = i.date.toLocaleDateString()
    
    const name = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM users WHERE id = '${i.user_id}'`, (err, result)=>{
        if (err) throw err
        resolve(result[0].name);
        lobject.name = result[0].name
      })
    });
    const slot_time = await new Promise((resolve, reject)=> {
      db.query(`SELECT * FROM timings WHERE id = '${i.timing_id}'`, (err, result)=>{
        if (err) throw err
        resolve(result[0].slot_time);
        lobject.slot_time = result[0].slot_time
      })
    });
    payloadList.push(lobject)
  }
  payload.appointments = payloadList
  return res.render("salon-appointments", payload)
})

router.post("/appointment/completed", async (req, res)=>{
  let appointmentId = req.body.appointmentId
  await new Promise((resolve, reject)=> {
    db.query(`UPDATE appointments SET status = 'completed', active_status = 0 WHERE id = '${appointmentId}';`, (err, result)=>{
      if (err) throw err
      resolve(result);
    })
  });
  let payload = {response : "done"}
  return res.send(payload)
})


// Itegration start 
router.get("/slots", async (req, res) => {
  if (req.user == undefined) {
    return res.redirect("/salon/login");
  }
  if (req.user.isHoliday) {
    return res.redirect("/salon/holiday");
  }
  if (!req.user.isSlotsAlloted) {
    return res.redirect("/salon/starting-day");
  }

  const timings = await new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM timings WHERE salon_id = '${req.user.id}' AND active = 1 ORDER BY position_count ASC`,
      (err, result) => {
        if (err) throw err;
        resolve(result);
      }
    );
  });

  const default_work_hour = await new Promise((resolve, reject) => {
    db.query(`SELECT * FROM default_work_hour WHERE salon_id = ${req.user.id} and active = 1`, (err, result) => {
        if (err) throw err
        resolve(result[0]);
    })
  });
  const work_hour = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM work_hour WHERE salon_id = ${req.user.id} and active = 1`, (err, result) => {
          if (err) throw err
          resolve(result[0]);
      })
  });


  let totalSittingCount;
  let totalWorkHour;
  if (work_hour == undefined) {
    totalSittingCount = default_work_hour.count;
    totalWorkHour = default_work_hour.hour;
  }
  else{
    totalSittingCount = work_hour.count;
    totalWorkHour = work_hour.hour;
  }
  let total = {totalSittingCount: totalSittingCount, totalWorkHour: totalWorkHour}
  return res.render("salon-slots", { layout: 'salon-layout', timings: JSON.stringify(timings),  total: JSON.stringify(total)});
});
module.exports = router;


