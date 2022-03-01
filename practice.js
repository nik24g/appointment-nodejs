let time = new Date()
time.setMinutes(00)
time.setHours(12)
time.setSeconds(00)
console.log(time.toTimeString());

time.setMinutes(time.getMinutes()+30)
console.log(time.toTimeString());

time.setMinutes(time.getMinutes()+30)
console.log(time.toLocaleTimeString('hi-IN'));