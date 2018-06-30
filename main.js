var TwitchBot = require("twitch-bot");
var fs = require('fs');
var colors = require('colors');
var express = require('express');
//var socket = require('socket-io')(express);

//Twitch Section
var twitch = new TwitchBot({
  username: 'OhISeeBOT',
  oauth: '***REMOVED***',
  channels: ['trihex']
});

var emoteLog = JSON.parse(fs.readFileSync('ohIsee.json'));

var timeout = 10000;

var onTimeout = false;

var msgsp = 0, msgss = 0;

twitch.on('join', channel => {
  console.log(("STATUS - Successfully joined channel " + channel + "...").green);
});

twitch.join('trihex');

console.log("STATUS - OhISee Bot Started...".green);

twitch.on('message', chatter => {
  msgsp++;
  if(chatter.message.split(' ')[0] === "📝" && chatter.message.split(' ')[1] === "OhISee"){
    console.log(("INFO - MSG - " + chatter.display_name + ": " + chatter.message).gray);
    //console.log("CONTAINS OHISEE".rainbow);


    var fullmsg = "";
    for(var i = 2; i < chatter.message.split(' ').length; i++){
      fullmsg += chatter.message.split(' ')[i] + ' ';
    }
    console.log(("INFO - PARSED MSG - "+fullmsg).grey);

    if(!emoteLog.OhISee.hasOwnProperty(fullmsg.toLowerCase())){
      emoteLog.OhISee[fullmsg.toLowerCase()] = {"text":fullmsg, "times":1, "users":[chatter.display_name]};
    }else{
      emoteLog.OhISee[fullmsg.toLowerCase()].times += 1;
      if(!emoteLog.OhISee[fullmsg.toLowerCase()].users.includes(chatter.display_name)){
        emoteLog.OhISee[fullmsg.toLowerCase()].users.push(chatter.display_name);
      }
    }

    if(!onTimeout){
      if(chatter.display_name != "OhISeeBOT"){
        twitch.say("📝 OhISee hmm, I've written that down @" + chatter.display_name +"...");

        // twitch.say(("📝 OhISee @" + chatter.display_name), err => {
        //   console.log(("ERROR - TWITCH MSG SEND ERROR - " + err.message).red);
        // });
        console.log("STATUS - REPLIED, ON TIMEOUT".yellow);
        msgss++;
        onTimeout = true;
        setTimeout(timeoutReset, timeout);
      }
    }else{
      twitch.say("/w @itsMichal 📝 OhISee hmm, I've written that down @" + chatter.display_name +"...check out my 📝:");
      console.log("STATUS - WHISPERED INFO".purple);
      msgss++;
    }

    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if(err) throw err;
      console.log("STATUS - JSON updated!".blue);
      console.log(("INFO - " + Object.keys(emoteLog.OhISee).length + " entries in JSON.").gray);
    });

  }
});

function timeoutReset(){
  onTimeout = false;
  console.log("STATUS - REPLY READY".green);
  console.log(("INFO - " + msgsp + " messages processed, and "+ msgss + " messages sent.").gray);
}

//Website Section
var app = express();
app.get('/', function(req,res){
  res.setHeader('Content-Type', 'text/html');
  res.send(fs.readFileSync('index.html'));
});
app.get(['/ohIsee.json','/ohIsee'], function(req,res){
  res.setHeader('Content-Type', 'json');
  res.send(fs.readFileSync('ohIsee.json'));
});
app.listen((process.env.PORT || 8000), () => console.log("STATUS - Webserver started listening on 8000...".green));
