let time = new Date()
time.setMinutes(30)
time.setHours(09)
time.setSeconds(00)
console.log(time.toLocaleTimeString('hi-IN'));

// time.setMinutes(time.getMinutes()+30)
// console.log(time.toTimeString());

// time.setMinutes(time.getMinutes()+30)
// console.log(time.toLocaleTimeString('hi-IN'));
// let timeList = time.toLocaleTimeString('hi-IN').split(" ")
// let period = timeList[1]
// let hourAndMinute = timeList[0]
// let hour = hourAndMinute.split(":")[0]
// let minute = hourAndMinute.split(":")[1]
// console.log(hour);

// let compareTime = new Date()
// compareTime.setHours(11)
// compareTime.setMinutes(32)
// compareTime.hour = compareTime.toLocaleTimeString('hi-IN').split(" ")[0].split(":")[0]
// compareTime.minute = compareTime.toLocaleTimeString('hi-IN').split(" ")[0].split(":")[1]
// compareTime.period = compareTime.toLocaleTimeString('hi-IN').split(" ")[1]

// if (compareTime.hour < hour && compareTime.period == "am") {
//     console.log("yaha aa gya")
// }
// else if(compareTime.hour == hour){
//     if (compareTime.minute <=30) {
//         console.log("yaha aa gya")
//     }
// }

