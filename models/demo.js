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

async function create_default_slot(salon_id) {
    const default_hour = await new Promise((resolve, reject) => {
        db.query(`SELECT * FROM default_work_hour WHERE salon_id = ${salon_id}`, (err, result) => {
            if (err) throw err
            resolve(result[0]);
        })
    });

    let times = create_time(default_hour.hour)
    for (const i of times.one_hour_times) {
        db.query(`INSERT INTO timings (time, salon_id, count, status) VALUES ('${i}', '${salon_id}', '${default_hour.count}', 'initilized');`)
    }
    for (const i of times.half_hour_times) {
        db.query(`INSERT INTO timings (time, salon_id, count, status) VALUES ('${i}', '${salon_id}', '${default_hour.count}', 'initilized');`)
    }
}


module.exports = create_default_slot;