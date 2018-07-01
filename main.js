var TwitchBot = require("twitch-bot");
var fs = require('fs');
var colors = require('colors');
var express = require('express');
var sanitizeHtml = require('sanitize-html');
var Filter = require('bad-words'), filter = new Filter({placeHolder: 'D: '});
filter.removeWords("shit", "hell", "heck", "damn");
//var socket = require('socket-io')(express);

//Twitch Section
var twitch = new TwitchBot({
  username: 'OhISeeBOT',
  oauth: '***REMOVED***',
  channels: ['trihex']
});

try{
  fs.accessSync('ohIsee.json');
} catch (e){

}

var emoteLog = {"OhISee":{},"whispers":{}};
try{
  emoteLog= JSON.parse(fs.readFileSync('ohIsee.json', { flag: 'a+' }));
} catch (e) {
  console.log(("STATUS - CREATING JSON FILE"));
}

var timeout = 30000;

var onTimeout = false;

var msgsp = 0, msgss = 0;

twitch.on('join', channel => {
  console.log(("STATUS - Successfully joined channel " + channel + "...").green);
});

twitch.join('trihex');

console.log("STATUS - OhISee Bot Started...".green);

setTimeout(onlineMessage, 5000);

function statusUpdate(){
  var lines = Object.keys(emoteLog.OhISee).length;
  twitch.say(("📝 OhISee I have taken " + lines + " lines of notes from you guys! That's "+Math.ceil(lines/31)+" pages! OhISee My notes: https://ohisee.herokuapp.com/ 📝 OhISee"), err => {
    console.log(err);
  });
}

function onlineMessage(){
  twitch.say(("📝 OhISee 💤  ...woops I must have dozed off! 📝 OhISee ☝️ I'm awake and ready now, don't worry!"));
}

setTimeout(statusUpdate, 10000);
setInterval(statusUpdate, 300000);

twitch.on('message', chatter => {
  //if(chatter.display_name == "itsMichal" && false);
  //console.log(chatter);
  if(chatter.message === "!RandomNote" && chatter.display_name != "OhISeeBOT"){
    var randumbkeyspot = Math.floor(Math.random()*(Object.keys(emoteLog.OhISee).length));
    var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];

    twitch.say(("📝 OhISee ☝️ Okay! Here's a note from " + randumb.users[0] + ": " + filter.clean(randumb.text)));
  }

  msgsp++;
  if(chatter.message.split(' ')[0] === "📝" && chatter.message.split(' ')[1].indexOf("ISee") > -1){
    console.log(("INFO - MSG - " + chatter.display_name + ": " + chatter.message).gray);
    //console.log("CONTAINS OHISEE".rainbow);


    var fullmsg = "";
    for(var i = 2; i < chatter.message.split(' ').length; i++){
      fullmsg += chatter.message.split(' ')[i] + ' ';
    }
    fullmsg = sanitizeHtml(fullmsg,{allowedTags:['']});
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
        twitch.say("📝 OhISee hmm okay, I've written that down in my notes, @" + chatter.display_name +"...cool!");
        if(!emoteLog.whispers.includes(chatter.display_name)){
          twitch.say("/w @"+chatter.display_name+" OhISee 📝 check out my 📝 at https://ohisee.herokuapp.com/ ...this is a test, so please be gentle. You won't get any more whispers from me (hopefully!)");
          emoteLog.whispers.push(chatter.display_name);
        }else{
          twitch.say("/w @itsMichal I can't message "+chatter.display_name+" anymore PepeHands");
          console.log("STATUS - COULD NOT WHISPER, ON LIST".red);
        }


        // twitch.say(("📝 OhISee @" + chatter.display_name), err => {
        //   console.log(("ERROR - TWITCH MSG SEND ERROR - " + err.message).red);
        // });
        console.log("STATUS - REPLIED, NOW ON TIMEOUT".yellow);
        msgss++;
        onTimeout = true;
        setTimeout(timeoutReset, timeout);
      }
    }else{
      if(!emoteLog.whispers.includes(chatter.display_name)){
        twitch.say("/w @"+chatter.display_name+" OhISee 📝 hmm okay, I've written that down " + chatter.display_name +", so check out my 📝 at https://ohisee.herokuapp.com/ ...this is a test, so please be gentle. You won't get any more whispers from me (hopefully!)");
        emoteLog.whispers.push(chatter.display_name);
        console.log("STATUS - ON TIMEOUT, WHISPERED INFO".purple);
      }else{
        twitch.say("/w @itsMichal I can't message "+chatter.display_name+" anymore PepeHands");
        console.log("STATUS - COULD NOT WHISPER, ON LIST".red);
      }
      //twitch.say("/w @"+chatter.display_name+" 📝 OhISee hmm, I've written that down @" + chatter.display_name +"...check out my 📝: https://ohisee.herokuapp.com/");

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
