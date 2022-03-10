const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nitin",
    encoding: "utf8mb4"
});

// making slots on the basis of default work hour
function create_time(hour){
    let num_one_hour = Math.floor(hour/2)
    let num_half_hour = Math.ceil(hour/2)

    let one_hour_values = []
    let half_hour_values = []

    let start_hour = new Date()
    start_hour.setHours(12)
    start_hour.setMinutes(00)

    let last_hour = new Date()
    last_hour.setHours(12)
    last_hour.setMinutes(00)

    for (let index = 0; index < num_one_hour; index++) {
        start_hour.setMinutes(start_hour.getMinutes()+60)
        one_hour_values.push(`${last_hour.toLocaleTimeString('hi-IN', {timeStyle: "short"})}-${start_hour.toLocaleTimeString('hi-IN', {timeStyle: "short"})}`)
        last_hour.setMinutes(last_hour.getMinutes()+60)
    }
    for (let index = 0; index < num_half_hour*2; index++) {
        start_hour.setMinutes(start_hour.getMinutes()+30)
        half_hour_values.push(`${last_hour.toLocaleTimeString('hi-IN', {timeStyle: "short"})}-${start_hour.toLocaleTimeString('hi-IN', {timeStyle: "short"})}`)
        last_hour.setMinutes(last_hour.getMinutes()+30)
    }
    return {one_hour_times: one_hour_values, half_hour_times: half_hour_values}
}

async function create_slots(salon_id) {
    const default_work_hour = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM default_work_hour WHERE salon_id = ${salon_id} and active = 1`, (err, result) => {
            if (err) throw err
            resolve(result[0]);
        })
    });
    const work_hour = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM work_hour WHERE salon_id = ${salon_id} and active = 1`, (err, result) => {
            if (err) throw err
            resolve(result[0]);
        })
    });
    let times;
    let disable_count;
    let position_count = 1;
    if (work_hour == undefined){
        times = create_time(default_work_hour.hour)
        disable_count = default_work_hour.hour / 2
        for (const i of times.one_hour_times) {
            await db.query(`INSERT INTO timings (slot_time, slot_type, salon_id, count, position_count, status) VALUES ('${i}', 'one hour', '${salon_id}', '${default_work_hour.count}', '${position_count}', 'Initilized');`)
            position_count += 1
        }
        for (const i of times.half_hour_times) {
            await db.query(`INSERT INTO timings (slot_time, slot_type, salon_id, count, position_count, status) VALUES ('${i}', 'half hour', '${salon_id}', '${default_work_hour.count}', '${position_count}', 'Initilized');`)
            position_count += 1
        }
        
    }
    else{
        times = create_time(work_hour.hour)
        disable_count = work_hour.hour / 2
        for (const i of times.one_hour_times) {
            await db.query(`INSERT INTO timings (slot_time, slot_type, salon_id, count, position_count, status) VALUES ('${i}', 'one hour', '${salon_id}', '${work_hour.count}', '${position_count}', 'Initilized');`)
            position_count += 1
        }
        for (const i of times.half_hour_times) {
            await db.query(`INSERT INTO timings (slot_time, slot_type, salon_id, count, position_count, status) VALUES ('${i}', 'half hour', '${salon_id}', '${work_hour.count}', '${position_count}', 'Initilized');`)
            position_count += 1
        }
        
    }
    db.query(`UPDATE salons SET slot_disable_count = '${disable_count}' WHERE id = '${salon_id}';`, (err, result)=>{
        if (err) throw err;
    })    
}
module.exports = {create_slots};