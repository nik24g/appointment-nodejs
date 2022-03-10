const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nitin",
    encoding: "utf8mb4"
});

function create_work(work_hour, count, salon_id){
    db.query(`INSERT INTO work_hour (hour, salon_id, count) values ('${work_hour}', '${salon_id}', '${count}')`, (err, result)=>{
        if (err) throw err
    })
}

module.exports = {create_work};