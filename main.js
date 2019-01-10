var TwitchBot = require("twitch-bot");
var fs = require('fs');
var colors = require('colors');
var express = require('express');
var request = require('request');
var sanitizeHtml = require('sanitize-html');
var Filter = require('bad-words'),
  filter = new Filter({
    placeHolder: '*'
  });
var ordinal = require('ordinal');
filter.removeWords("shit", "hell", "heck", "damn");
//var socket = require('socket-io')(express);

//Twitch Section
var twitch = new TwitchBot({
  username: 'ohiseebot',
  oauth: '***REMOVED***',
  channels: ['trihex']
});

// try{
//   fs.accessSync('ohIsee.json');
// } catch (e){
//
// }

var emoteLog = {
  "OhISee": {},
  "whispers": [],
  "Notetakers": {}
};
try {
  //emoteLog = JSON.parse(fs.readFileSync('ohIsee.json'));
  //request.get("https://api.myjson.com/bins/9p6hk", function(err, resp, body){
  request.get("https://api.myjson.com/bins/13l6lk", function(err, resp, body) {
    if (err)
      console.log(("ERROR - Something went wrong with getting file from myjson!").red);

    console.log("STATUS - Received JSON file from myjson...".green);
    emoteLog = JSON.parse(body);
    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if (err) throw err;
      console.log("STATUS - Local JSON file updated!".blue);
      console.log(("INFO - " + emoteLog.totalcount + " entries in JSON.").gray);
    });
  });



  //emoteLog.whispers.includes(chatter.display_name);
} catch (e) {
  console.log(("STATUS - CREATING JSON FILE"));
}

var timeout = 960000;
var timeout2 = 19000;


var onTimeout = false;
var onTimeout2 = false;

onTimeout = true;
setTimeout(timeoutReset, timeout);

var msgsp = 0,
  msgss = 0;

twitch.on('join', channel => {
  console.log(("STATUS - Successfully joined channel " + channel + "...").green);
  onlineMessage();
});

twitch.on('part', channel => {
  console.log(("STATUS - Successfully left channel " + channel + "...").green);
});



console.log("STATUS - OhISee Bot Started...".green);

setTimeout(onlineMessage, 5000);


var currentchannel = '';

function statusUpdate() {
  var lines = Object.keys(emoteLog.OhISee).length;
  twitch.say(("📝 OhISee I have taken " + lines + " lines of notes from you guys! That's " + Math.ceil(lines / 31) + " pages! 📝 OhISee"));
}

function onlineMessage() {
  twitch.say(("📝 OhISee I'm still in testing! Be nice! Now taking your notes...use '📝 OhISee' to take a note!"));
}

//setTimeout(statusUpdate, 10000);
setInterval(statusUpdate, 3000000);

twitch.on('message', chatter => {
  //if(chatter.display_name == "itsMichal" && false);
  //console.log(chatter);
  if(chatter.display_name == "itsMichal" && chatter.message.split(' ')[0].localeCompare("!joinchannel", 'en', {sensitivity:'base'}) ==0){
      var newchannel = chatter.message.split(' ')[1];
      try {
        twitch.say(("👋  OhISee I've been told to move over to " + newchannel + "'s channel, see you there!"));
      } catch (e) {
        console.log(e);
      }
      twitch.part(currentchannel);
      twitch.join(newchannel);
      currentchannel=newchannel;

  }

  if (chatter.message.split(' ')[0].localeCompare("!RandomNote", 'en', {
      sensitivity: 'base'
    }) ==0 &&
    chatter.display_name != "OhISeeBOT" &&
    (!onTimeout2 || chatter.display_name == "itsMichal")) {
    console.log("EVENT - Someone used !RandomNote".yellow);

    var manyNotes = 0;
    if (chatter.message.split(' ').length > 1 && !isNaN(chatter.message.split(' ')[1])) {
      //chatter gave number
      var number = parseInt(chatter.message.split(' ')[1]);
      if ((number <= 0 || number > 5) && chatter.display_name !== "itsMichal") { //oob
        try {
          twitch.say(("📝 OhISee Hmm, try a number from 1-5, " + chatter.display_name));
        } catch (e) {
          console.log(e);
        }
      } else {
        var fullstring = "";
        for (var i = 0; i < number; i++) {
          var randumbkeyspot = Math.floor(Math.random() * (Object.keys(emoteLog.OhISee).length));
          var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
          fullstring += filter.clean(randumb.text);
          if (i < number - 1) {
            fullstring += ", ";
          }
        }
        try {
          var finalstrng = ("📝 OhISee ☝️ Okay! Here's " + number + " notes: " + fullstring);
          if(finalstrng.length > 490){
            finalstrng = finalstrng.substring(0, 487) + "...";
          }
          twitch.say(finalstrng);
        } catch (e) {
          console.log(e);
        }
      }
    } else {
      var randumbkeyspot = Math.floor(Math.random() * (Object.keys(emoteLog.OhISee).length));
      var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
      try {
        var finalstrng = ("📝 OhISee ☝️ Okay! Here's a note from " + randumb.users[0] + ": " + filter.clean(randumb.text));
        if(finalstrng.length > 490){
          finalstrng = finalstrng.substring(0, 487) + "...";
        }
        twitch.say(finalstrng);
      } catch (e) {
        console.log(e);
      }
    }


    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  if (chatter.message.split(' ').length > 1 &&
    chatter.message.split(' ')[0].localeCompare("!Note", 'en', {
      sensitivity: 'base'
    }) ==0 &&
    !isNaN(chatter.message.split(' ')[1]) &&
    chatter.display_name != "OhISeeBOT" && (!onTimeout2 || chatter.display_name == "itsMichal")) {
    console.log("EVENT - Someone used !Note".yellow);
    var usernumber = parseInt(chatter.message.split(' ')[1]);
    if (usernumber <= 0 || usernumber > (Object.keys(emoteLog.OhISee).length)) {
      try {
        twitch.say(("📝 OhISee Hmm, try a number from 1-" + (Object.keys(emoteLog.OhISee).length) + ", " + chatter.display_name));
      } catch (e) {
        console.log(e);
      }
    } else {
      var randumbkeyspot = usernumber - 1;
      var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
      try {
        var finalstrng = ("📝 OhISee ☝️ Okay! Here's note "+usernumber+" from " + randumb.users[0] + ": " + filter.clean(randumb.text));
        if(finalstrng.length > 490){
          finalstrng = finalstrng.substring(0, 487) + "...";
        }
        twitch.say(finalstrng);
      } catch (e) {
        console.log(e);
      }
    }


    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  //!TopNotetakers
  if (chatter.message.split(' ')[0].localeCompare("!HonorRoll", 'en', {
      sensitivity: 'base'
    })==0 && chatter.display_name != "OhISeeBOT" && (!onTimeout2 || chatter.display_name == "itsMichal")) {

      console.log("EVENT - Someone used !HonorRoll".yellow);
      var list = [];
      var averagepp = emoteLog.totalcount / emoteLog.whispers.length;
      console.log(("DEBUG - Average Note Count Per Person - " + averagepp).gray);
      var topamt = 0;
      for (var ntkr in emoteLog.Notetakers) {
        if (emoteLog.Notetakers.hasOwnProperty(ntkr)) {
          list.push(ntkr);
          if (emoteLog.Notetakers[ntkr].notecount > topamt) {
            topamt = emoteLog.Notetakers[ntkr].notecount;
          }
        }

      }
      console.log(("DEBUG - Top Count - " + topamt).gray);
      list.sort(sortPeople);
      var cnt = emoteLog.Notetakers[list[0]].notecount;
      var score1 = (cnt / (averagepp)) * 50;
      if (score1 > 75) {
        score1 = 75;
      }
      score1 += (cnt / topamt) * 50;

      cnt = emoteLog.Notetakers[list[1]].notecount;
      var score2 = (cnt / (averagepp)) * 50;
      if (score2 > 75) {
        score2 = 75;
      }
      score2 += (cnt / topamt) * 50;

      cnt = emoteLog.Notetakers[list[2]].notecount;
      var score3 = (cnt / (averagepp)) * 50;
      if (score3 > 75) {
        score3 = 75;
      }
      score3 += (cnt / topamt) * 50;

      try {
        twitch.say(("📝 OhISee The top 3 students are " + list[0] + " (" +emoteLog.Notetakers[list[0]].notecount+" notes, "+score1.toFixed(1)+"%), " + list[1] + " (" +emoteLog.Notetakers[list[1]].notecount+" notes, "+score2.toFixed(1)+"%), and " + list[2] + " (" +emoteLog.Notetakers[list[2]].notecount+" notes, "+score3.toFixed(1)+"%)."));
      } catch (e) {
        console.log(e);
      }
      onTimeout2 = true;
      setTimeout(timeoutReset2, timeout2);
  }

  //!Grade
  if (chatter.message.split(' ')[0].localeCompare("!Grade", 'en', {
      sensitivity: 'base'
    })==0 && chatter.display_name != "OhISeeBOT" && (!onTimeout2 || chatter.display_name == "itsMichal")) {

    console.log("EVENT - Someone used !Grade".yellow);

    //Check if username specified
    if (chatter.message.split(' ').length > 1) {
      //Check if username is valid
      var username = chatter.message.split(' ')[1];
      if (emoteLog.Notetakers.hasOwnProperty(username)) {
        //Get top Notetakers
        var rank = 1;

        var averagepp = emoteLog.totalcount / emoteLog.whispers.length;
        console.log(("DEBUG - Average Note Count Per Person - " + averagepp).gray);

        var topamt = 0;
        var cnt = emoteLog.Notetakers[username].notecount;
        for (var ntkr in emoteLog.Notetakers) {
          if (emoteLog.Notetakers.hasOwnProperty(ntkr)) {
            var thing = emoteLog.Notetakers[ntkr];
            if (thing.notecount > topamt) {
              topamt = thing.notecount;
            }
            if (thing.notecount > cnt) {
              rank++;
            }
          }
        }
        console.log(("DEBUG - Rank - " + rank).gray);
        console.log(("DEBUG - Top Count - " + topamt).gray);

        //valid

        var score = (cnt / (averagepp)) * 50;
        if (score > 75) {
          score = 75;
        }
        score += (cnt / topamt) * 50;

        try {
          twitch.say(("📝 OhISee " + username + " has taken " + cnt + " notes. I think they'll get a " + score.toFixed(1) + "% on the test! That's the " + ordinal(rank) + " best score! Keep on taking notes to improve!"));
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          twitch.say(("📝 OhISee Hmm...I can't find that user in my notes, " + chatter.display_name));
        } catch (e) {
          console.log(e);
        }
      }

    } else {
      //Yourself
      //Check if username is valid
      var username = chatter.display_name;
      if (emoteLog.Notetakers.hasOwnProperty(username)) {
        //Get top Notetakers
        var rank = 1;

        var averagepp = emoteLog.totalcount / emoteLog.whispers.length;
        console.log(("DEBUG - Average Note Count Per Person - " + averagepp).gray);

        var topamt = 0;
        var cnt = emoteLog.Notetakers[username].notecount;
        for (var ntkr in emoteLog.Notetakers) {
          if (emoteLog.Notetakers.hasOwnProperty(ntkr)) {
            var thing = emoteLog.Notetakers[ntkr];
            if (thing.notecount > topamt) {
              topamt = thing.notecount;
            }
            if (thing.notecount > cnt) {
              rank++;
            }
          }
        }
        console.log(("DEBUG - Rank - " + rank).gray);
        console.log(("DEBUG - Top Count - " + topamt).gray);

        //valid

        var score = (cnt / (averagepp)) * 50;
        if (score > 75) {
          score = 75;
        }
        score += (cnt / topamt) * 50;

        try {
          twitch.say(("📝 OhISee " + username + ", you have taken " + cnt + " notes. I think you'll get a " + score.toFixed(1) + "% on the test! That's the " + ordinal(rank) + " best score! Keep on taking notes to improve!"));
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          twitch.say(("📝 OhISee Hmm...it seems like you haven't taken any notes yet, " + chatter.display_name + ". Taking notes is essential for a good grade!"));
        } catch (e) {
          console.log(e);
        }
      }
    }
    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  if (chatter.message.localeCompare("!Notebook", 'en', {
      sensitivity: 'base'
    })==0 && chatter.display_name != "OhISeeBOT" && (!onTimeout2 || chatter.display_name == "itsMichal")) {
    console.log("EVENT - Someone used !Notebook".yellow);
    try {
      statusUpdate();
      twitch.say("/w @" + chatter.display_name + " OhISee 📝 You can check out my entire 📝 at https://ohisee.herokuapp.com/. Thanks!");
    } catch (e) {
      console.log(e);
    }
    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  msgsp++;
  if (chatter.message.split(' ').length > 1 && chatter.message.split(' ')[0] === "📝" && chatter.message.split(' ')[1].indexOf("ISee") > -1) {
    console.log(("INFO - MSG - " + chatter.display_name + ": " + chatter.message).gray);
    //console.log("CONTAINS OHISEE".rainbow);


    var fullmsg = "";
    for (var i = 2; i < chatter.message.split(' ').length; i++) {
      fullmsg += chatter.message.split(' ')[i] + ' ';
    }
    fullmsg = sanitizeHtml(fullmsg, {
      allowedTags: ['']
    });
    console.log(("INFO - PARSED MSG - " + fullmsg).grey);

    emoteLog.totalcount += 1;

    //OhISee
    if (!emoteLog.OhISee.hasOwnProperty(fullmsg.toLowerCase())) {
      emoteLog.OhISee[fullmsg.toLowerCase()] = {
        "text": fullmsg,
        "times": 1,
        "users": [chatter.display_name]
      };
    } else {
      emoteLog.OhISee[fullmsg.toLowerCase()].times += 1;
      if (!emoteLog.OhISee[fullmsg.toLowerCase()].users.includes(chatter.display_name)) {
        emoteLog.OhISee[fullmsg.toLowerCase()].users.push(chatter.display_name);
      }
    }

    //Notetakers
    if (!emoteLog.Notetakers.hasOwnProperty(chatter.display_name)) {
      emoteLog.Notetakers[chatter.display_name] = {
        "notecount": 1,
        "noteids": [Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase())]
      };
    } else {
      emoteLog.Notetakers[chatter.display_name].notecount += 1;
      if (!emoteLog.Notetakers[chatter.display_name].noteids.includes(Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase()))) { //jesus
        emoteLog.Notetakers[chatter.display_name].noteids.push(Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase()));
      }
    }

    if (!onTimeout) {
      if (chatter.display_name != "OhISeeBOT") {
        twitch.say("📝 OhISee hmm okay, I've written that down in my notes, @" + chatter.display_name + "...cool!");
        if (!emoteLog.whispers.includes(chatter.display_name)) {
          twitch.say("/w @" + chatter.display_name + " OhISee 📝 check out my 📝 at https://ohisee.herokuapp.com/ ...this is a test, so please be gentle. You won't get any more whispers from me (hopefully!)");
          twitch.say("/w @itsMichal I just messaged " + chatter.display_name + " for the first time! POGGERS");
          emoteLog.whispers.push(chatter.display_name);
        } else {
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
    } else {
      if (!emoteLog.whispers.includes(chatter.display_name)) {
        twitch.say("/w @" + chatter.display_name + " OhISee 📝 hmm okay, I've written that down " + chatter.display_name + ", so check out my 📝 at https://ohisee.herokuapp.com/ ...this is a test, so please be gentle. You won't get any more whispers from me (hopefully!)");
        emoteLog.whispers.push(chatter.display_name);
        twitch.say("/w @itsMichal I just messaged " + chatter.display_name + " for the first time! POGGERS");
        console.log("STATUS - ON TIMEOUT, WHISPERED INFO".purple);
      } else {
        console.log("STATUS - COULD NOT WHISPER, ON LIST".red);
      }
      //twitch.say("/w @"+chatter.display_name+" 📝 OhISee hmm, I've written that down @" + chatter.display_name +"...check out my 📝: https://ohisee.herokuapp.com/");

      msgss++;
    }

    request({
      url: "https://api.myjson.com/bins/13l6lk",
      method: 'PUT',
      json: emoteLog
    }, function(err, resp, body) {
      if (err) {
        console.log("ERROR - Problem logging to myjson!".red);
        console.log(("DETAILS - " + err + " / " + resp + " / " + body).grey);
      }
    });



    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if (err) throw err;
      console.log("STATUS - JSON updated!".blue);
      console.log(("INFO - " + emoteLog.totalcount + " entries in JSON.").gray);
    });

  }
});

function timeoutReset() {
  onTimeout = false;
  console.log("STATUS - REPLY READY".green);
  console.log(("INFO - " + msgsp + " messages processed, and " + msgss + " messages sent.").gray);
}

function timeoutReset2() {
  onTimeout2 = false;
  console.log("STATUS - RANDOM MESSAGE READY".green);
  console.log(("INFO - " + msgsp + " messages processed, and " + msgss + " messages sent.").gray);
}

function sortPeople(a,b){
  return emoteLog.Notetakers[b].notecount - emoteLog.Notetakers[a].notecount;
}

//Website Section
var app = express();
app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(fs.readFileSync('index.html'));
});
app.get(['/ohIsee.json', '/ohIsee'], function(req, res) {
  res.setHeader('Content-Type', 'json');
  res.send(fs.readFileSync('ohIsee.json'));
});
app.listen((process.env.PORT || 8000), () => console.log("STATUS - Webserver started listening on 8000...".green));
