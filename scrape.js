var fs = require('fs');
var http = require('http');
console.log("starting");
setInterval(dl, 300000);
dl();
function dl(){
  console.log("backing up...");
  var d = new Date();
  var file = fs.createWriteStream("backups/ohIsee_"+d.getTime()+".json");
  var request = http.get("http://ohisee.herokuapp.com/ohisee.json", function(response) {
    response.pipe(file);
  });
}
