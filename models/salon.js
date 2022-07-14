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

async function rating(salon_id){
    let rating;
    await new Promise((resolve, reject)=> {
        db.query(`SELECT * FROM rating WHERE salon_id = '${salon_id}' ORDER BY id DESC LIMIT 10;`, (err, result)=>{
            if (err) throw err
            // console.log(result)
            resolve(result);
            let totalRating = 0;
            let ratingCount = 0;
            for (const i of result) {
                totalRating += i.rate;
                ratingCount += 1;
            }
            // console.log(totalRating/ratingCount);
            rating = totalRating/ratingCount;
        })
    });
    if (rating){
        return rating.toFixed(1);
    }
    else{
        return 3.5;
    }

}

module.exports = {create_work, rating};