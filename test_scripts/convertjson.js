var fs = require('fs');
console.log("starting json conversion");

var emoteLog = JSON.parse(fs.readFileSync('ohIsee_unconverted.json'));

emoteLog.Notetakers = {};
emoteLog.totalcount = 0;
emoteLog.topnotetaker = 0;

for(var note in emoteLog.OhISee){
  if(emoteLog.OhISee.hasOwnProperty(note)){

    var obj = emoteLog.OhISee[note];

    emoteLog.totalcount += obj.times;
    

    console.log("Now parsing " + obj.text);
    for(var i = 0; i < obj.users.length; i++){
      var name = obj.users[i];
      if(!emoteLog.Notetakers.hasOwnProperty(name)){
        emoteLog.Notetakers[name] = {"notecount":1, "noteids":[Object.keys(emoteLog.OhISee).indexOf(obj.text.toLowerCase())]};
      }else{
        emoteLog.Notetakers[name].notecount += 1;
        if(!emoteLog.Notetakers[name].noteids.includes(Object.keys(emoteLog.OhISee).indexOf(obj.text.toLowerCase()))){ //jesus
          emoteLog.Notetakers[name].noteids.push(Object.keys(emoteLog.OhISee).indexOf(obj.text.toLowerCase()));
        }
      }
      console.log(name + " - count: " + emoteLog.Notetakers[name].notecount);
    }
  }
}
console.log("real count - " + emoteLog.totalcount);
console.log("previous count - " + Object.keys(emoteLog.OhISee).length);

fs.writeFile('ohIsee_converted.json', JSON.stringify(emoteLog), 'utf8', err => {
  if(err) throw err;
  console.log("successfully converted");
});

console.log("finished");
