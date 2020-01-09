/*
* OhISee Twitch Bot 
* Built by Michal Bodzianowski
* Specifically for Trihex chat, no widespread support (as of yet)
* Runs during GamesDoneQuick event
*/

/*
* Roadmap
* -(LT) Remove myjson dependency
* -(LT) Clean up code
* -(LT) Multichannel support
* -(LT) Switch to MEAN stack
* -(ST) Add !quiz with basic quizzing
* -(ST) Add !randomnote (username) support
* -(ST) Live updates on website
* -(ST) 
*/


//Dependencies 
var TwitchBot = require("twitch-bot");
const nlp = require('compromise')
nlp.extend(require('compromise-sentences'))
var fs = require('fs');
var colors = require('colors');
var express = require('express');
var request = require('request');
var sanitizeHtml = require('sanitize-html');
var tapi = require('twitch-api-v5');

tapi.clientID = '***REMOVED***'; //TODO: Remove?

var Filter = require('bad-words'),
  filter = new Filter({
    placeHolder: '*'
  });
var ordinal = require('ordinal');
filter.removeWords("shit", "hell", "heck", "damn", "ass");

function filterString(initString){
  var finalstring = filter.clean(initString);
  finalstring = finalstring.replace(/[^\w\s]{10,}/g, '');
  return finalstring;
}


//Config 

var timeout = 960000;
var timeout2 = 19000;
var timeoutQ = 30000;
var quizlength = 60000;


//Twitch Section
var twitch = new TwitchBot({
  username: 'ohiseebot',
  oauth: '***REMOVED***', //TODO: Switch to env var
  channels: [process.env.CHANNEL]
});

//Basic Structure of the Log
var emoteLog = {
  "OhISee": {},
  "whispers": [],
  "Notetakers": {},
  "games": {},
  "questions": [],
  "totalcount": 0,
  "questioncount": 0,
  "iq":0
};

try {
  
  //emoteLog = JSON.parse(fs.readFileSync('ohIsee.json'));
  /*request({
    url: "https://www.jsonstore.io/***REMOVED***",
    method: 'PUT',
    json: emoteLog
  }, function(err, resp, body) {
    console.log(body);
    if (err) {
      console.log("ERROR - Problem logging to myjson!".red);
      console.log(("DETAILS - " + err + " / " + resp + " / " + body).grey);
    }
  });*/
  
  //Uncomment to use file
  //Historical Bins---
  //request.get("https://api.myjson.com/bins/9p6hk", function(err, resp, body){
  //request.get("https://api.myjson.com/bins/13l6lk", function(err, resp, body) {
  // request.get("https://api.myjson.com/bins/o9osd", function(err,resp,body){
  //---End of Legacy---

  //Get the JSON from Myjson because Heroku deletes locally.
  request.get(
    {url:"https://api.jsonbin.io/b/5e15c721b236b871b35e2ef9",
    headers:{'secret-key':'***REMOVED***'}
  }, function(err,resp,body){

    //Catch errors
    if (err)
      console.log(("ERROR - Something went wrong with getting file from myjson!").red);

    //Get JSON and Parse
    console.log("STATUS - Received JSON file from myjson...".green);

    //console.log(body);

    emoteLog = JSON.parse(body);

    //console.log(emoteLog);

    //Update the game's name
    updateGameName();

    //Write to the local file.
    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if (err) throw err;
      console.log("STATUS - Local JSON file updated!".blue);
      console.log(("INFO - " + emoteLog.totalcount + " entries in JSON.").gray);
    });

  });

} catch (e) {
  console.log(e);
  console.log(("STATUS - CREATING JSON FILE"));
}


//Setup Timeout Vars
var onTimeout = false;
var onTimeout2 = false;
var onTimeoutQ = false;
onTimeout = true;
setTimeout(timeoutReset, timeout);

//Set Quiz Vars
var choice1cnt = 0;
var choice2cnt = 0;
var choice3cnt = 0;
var choice4cnt = 0;
var rightanswer = 0;
var firstright = "";
var quizzers = [];
var quizQuestionIndex = 0;
//End Quiz Vars

//???
var msgsp = 0, 
  msgss = 0;

//Default Game NAME
var gameName = "N/a";

//Update Game Name every X seconds
setInterval(updateGameName, 60000); //TODO: Make this a config setting

//Checks the official GamesDoneQuick channel for the game name.
function updateGameName(){
  //Client ID used with twitch API
  tapi.clientID = '***REMOVED***';

  //Get data on twitch.tv/GamesDoneQuick
  tapi.channels.channelByID({channelID:22510310}, (err, resp)=>{
    //Catch error
    if(err){
      console.log(err);
    }else{
      //Update the game name
      console.log("INFO - Updated Game".gray);
      var gameNameInit = resp.status;
      
      //Luckily, GDQ uses a consitent title format so we can get the game name from the title
      //Here, we take the part after the hyphen in the title, and use it as our game name.
      gameName = gameNameInit.slice(gameNameInit.indexOf("-")+2, gameNameInit.length);


      //If its a new game (not in JSON)
      //TODO: Update logic to be more friendly to new GDQs
      if(!emoteLog.games.hasOwnProperty(gameName)){
        
        //Create abbreviation for the game name. Some fancy regex that basically
        //takes the first letters from the words of the game's title + numbers
        var abbrev = gameName.replace( /\B[a-zA-Z'-]+/g, '' );
        abbrev = abbrev.replace(/[\s]/g,'');
        
        //Add the game to the JSON
        emoteLog.games[gameName]={name:gameName, id:Object.keys(emoteLog.games).length, short:abbrev};

        //Log Event
        console.log("EVENT - New game detected! - "+gameName+" ("+abbrev+")");
      }

    }
  });
}

//Handle channel join event
twitch.on('join', channel => {
  console.log(("STATUS - Successfully joined channel " + channel + "...").green);
  onlineMessage();
});

//Handle channel leave event
twitch.on('part', channel => {
  console.log(("STATUS - Successfully left channel " + channel + "...").green);
});

//Status Log Message
console.log("STATUS - OhISee Bot Started...".green);

//Set a delay on the initial online message to give time to connect to server, etc.
setTimeout(onlineMessage, 5000);

//The current channel
var currentchannel = '';

//Status Update message
function statusUpdate() {
  var lines = Object.keys(emoteLog.OhISee).length;
  //Average lines per page is 31
  twotchSay(("📝 OhISee I have taken " + lines + " lines of notes from you guys! That's " + Math.ceil(lines / 31) + " pages! 📝 OhISee"));
}

//Online Message
function onlineMessage() {
  twotchSay(("📝 OhISee I'm still in testing! Be nice! Now taking your notes...use '📝 OhISee' to take a note!"));
}

//Update the status every 50 minutes...
setInterval(statusUpdate, 3000000);

//On a twitch message...
twitch.on('message', chatter => {

  //!noterchannel
  //Switches the channel that OhISee operates in.
  if((chatter.display_name == "itsMichal" || chatter.mod) && chatter.message.split(' ')[0].localeCompare("!noterchannel", 'en', {sensitivity:'base'}) ==0){
    console.log("EVENT - Someone used !NoterChannel".yellow);  
    
    var newchannel = chatter.message.split(' ')[1];
      try {
        twotchSay(("👋  OhISee I've been told to move over to " + newchannel + "'s channel, see you there!"));
      } catch (e) {
        console.log(e);
      }
      twitch.part(currentchannel);
      twitch.join(newchannel);
      currentchannel=newchannel;
  }

  //!RandomNote
  if (chatter.message.split(' ')[0].localeCompare("!RandomNote", 'en', {
      sensitivity: 'base'
    }) ==0 &&
    chatter.display_name != "OhISeeBOT" &&
    (!onTimeout2 || chatter.display_name == "itsMichal")) {
    
      //Log Event
      console.log("EVENT - Someone used !RandomNote".yellow);

    var manyNotes = 0; //??
    
    //If Number was given...
    if (chatter.message.split(' ').length > 1 && !isNaN(chatter.message.split(' ')[1])) {
      //Get that number
      var number = parseInt(chatter.message.split(' ')[1]);

      //Check if number is between bounds. Exception for Me.
      if ((number <= 0 || number > 5) && chatter.display_name !== "itsMichal") { //oob
        try {
          twotchSay(("📝 OhISee Hmm, try a number from 1-5, " + chatter.display_name));
        } catch (e) {
          console.log(e);
        }
      } else {
        //If it is inbounds

        var fullstring = "";//Final string to be returned

        //Loop and find x random messages, ensuring there is no repeat. < actually don't know if I do that.
        for (var i = 0; i < number; i++) {
          var randumbkeyspot = Math.floor(Math.random() * (Object.keys(emoteLog.OhISee).length));
          var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
          fullstring += filterString(randumb.text);
          if (i < number - 1) {
            fullstring += ", ";
          }
        }
        try {
          var finalstrng = ("📝 OhISee ☝️ Okay! Here's " + number + " notes: " + fullstring);
          if(finalstrng.length > 490){
            finalstrng = finalstrng.substring(0, 487) + "...";
          }
          twotchSay(finalstrng);
        } catch (e) {
          console.log(e);
        }
      }
    //Random messages from user
    } else if(chatter.message.split(' ').length > 1) {
      //Check if username specified
      if (chatter.message.split(' ').length > 1) {
        //Check if username is valid
        var username = chatter.message.split(' ')[1];
        if (emoteLog.Notetakers.hasOwnProperty(username)) {
          //Get a random note from user
          var randumbnoteidspot = Math.floor(Math.random() * (emoteLog.Notetakers[username].notecount));
          var randumbnoteid = emoteLog.Notetakers[username].noteids[randumbnoteidspot];
          var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbnoteid]];
          try {
            var finalstrng = ("📝 OhISee ☝️ Okay! Here's a note from " + username + ": " + filterString(randumb.text));
            if(finalstrng.length > 490){
              finalstrng = finalstrng.substring(0, 487) + "...";
            }
            twotchSay(finalstrng);
          } catch (e) {
            console.log(e);
          }
        }else{
          //Invalid username
          twotchSay("📝 OhISee ☝️ Sorry, I can't find anyone here with that username!");
        }
      }
  
    } else {
      //Just get 1 random note
      var randumbkeyspot = Math.floor(Math.random() * (Object.keys(emoteLog.OhISee).length));
      var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
      try {
        var finalstrng = ("📝 OhISee ☝️ Okay! Here's a note from " + randumb.users[0] + ": " + filterString(randumb.text));
        if(finalstrng.length > 490){
          finalstrng = finalstrng.substring(0, 487) + "...";
        }
        twotchSay(finalstrng);
      } catch (e) {
        console.log(e);
      }
    }


    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  //!Note
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
        twotchSay(("📝 OhISee Hmm, try a number from 1-" + (Object.keys(emoteLog.OhISee).length) + ", " + chatter.display_name));
      } catch (e) {
        console.log(e);
      }
    } else {
      var randumbkeyspot = usernumber - 1;
      var randumb = emoteLog.OhISee[Object.keys(emoteLog.OhISee)[randumbkeyspot]];
      try {
        var finalstrng = ("📝 OhISee ☝️ Okay! Here's note "+usernumber+" from " + randumb.users[0] + ": " + filterString(randumb.text));
        if(finalstrng.length > 490){
          finalstrng = finalstrng.substring(0, 487) + "...";
        }
        twotchSay(finalstrng);
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
        twotchSay(("📝 OhISee The top 3 students are " + list[0] + " (" +emoteLog.Notetakers[list[0]].notecount+" notes, "+score1.toFixed(1)+"%), " + list[1] + " (" +emoteLog.Notetakers[list[1]].notecount+" notes, "+score2.toFixed(1)+"%), and " + list[2] + " (" +emoteLog.Notetakers[list[2]].notecount+" notes, "+score3.toFixed(1)+"%)."));
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
          twotchSay(("📝 OhISee " + username + " has taken " + cnt + " notes. I think they'll get a " + score.toFixed(1) + "% on the test! That's the " + ordinal(rank) + " best score! Keep on taking notes to improve!"));
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          twotchSay(("📝 OhISee Hmm...I can't find that user in my notes, " + chatter.display_name));
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
          twotchSay(("📝 OhISee " + username + ", you have taken " + cnt + " notes. I think you'll get a " + score.toFixed(1) + "% on the test! That's the " + ordinal(rank) + " best score! Keep on taking notes to improve!"));
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          twotchSay(("📝 OhISee Hmm...it seems like you haven't taken any notes yet, " + chatter.display_name + ". Taking notes is essential for a good grade!"));
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
      twotchSay("/w @" + chatter.display_name + " OhISee 📝 You can check out my entire 📝 at https://ohisee.herokuapp.com/. Thanks!");
    } catch (e) {
      console.log(e);
    }
    onTimeout2 = true;
    setTimeout(timeoutReset2, timeout2);
  }

  msgsp++;

  

  //QUIZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
  if(chatter.message.localeCompare("!Quiz", 'en', {
    sensitivity: 'base'
  })==0 && chatter.display_name != "OhISeeBOT" && (!onTimeout2)){
    if(!onTimeoutQ){
      onTimeout2 = true;
      console.log("EVENT - QUIZ STARTED".magenta);

     

      //Start Quiz!
      setTimeout(quizEnd, quizlength);
      setTimeout(quizWarning, quizlength-10000);

      //Draw 4 Random Questions, pick 1 randomly, keep answers from other 4.
      var qanswers = [];

      //Pick initial question
      var randumbindex = Math.floor(Math.random() * emoteLog.questions.length);
      var quizQuestionJSON = emoteLog.questions[randumbindex];
      var qquestion = emoteLog.questions[randumbindex].question;
      quizQuestionIndex = randumbindex;

      console.log(("QUESTION - "+qquestion).magenta);
      console.log(("ANSWER   - "+quizQuestionJSON.answer).magenta);


      //Pick 3 random answers
      while(true){
        //Limit to 3
        if(qanswers.length == 2){
          break;
        }

        var randumbindex2 = Math.floor(Math.random() * emoteLog.questions.length);
        //Remove closely related answers, if possible.
        if(
          !(emoteLog.questions[randumbindex2].answer.localeCompare(quizQuestionJSON.answer, 'en', {sensitivity: 'base'}) == 0) 
          && randumbindex2 != randumbindex
          ){
            qanswers.push(emoteLog.questions[randumbindex2].answer);
          }

      }

      //Chose correct answer slot.
      rightanswer = Math.floor(Math.random() * 3);

      //Put correct answer in appropriate spot
      qanswers.splice(rightanswer,0,quizQuestionJSON.answer);

      //Update index with usage
      emoteLog.questions[quizQuestionIndex].usage += 1;

      //Send message to chat
      twotchSay((`📝 OhISee 💭 ` + chatter.display_name + ` says its QUIZ TIME! Type " OhISee [Number] " to participate!`));
      try{
        setTimeout(()=>{twotchSay(`OhISee QUESTION: ` + qquestion + ` -|- ANSWERS: 1) ` + qanswers[0] + `2) `+ qanswers[1]+ `3) `+qanswers[2])}, 3000);
      }catch(e){
        setTimeout(()=>{twotchSay(`OhISee QUESTION: ` + qquestion + ` -|- ANSWERS: 1) ` + qanswers[0] + `2) `+ qanswers[1]+ `3) `+qanswers[2])}, 7000);
      }
      
      //setTimeout(()=>{twotchSay(`)}, 2000);
      //+`4)`+qanswers[3]));
      
      //Set timeout
      onTimeoutQ = true;
      //start timer for quiz
      setTimeout(timeoutResetQ, quizlength);
    }else{
      //Give error message
      twotchSay(("📝 OhISee We are in the middle of a quiz!"));
    }
  }

  //Quiz Data Collection
  if(chatter.message.split(' ').length > 1 
  && (
    chatter.message.split(' ')[1] == "1"
    || chatter.message.split(' ')[1] == "2"
    || chatter.message.split(' ')[1] == "3"
    || chatter.message.split(' ')[1] == "3"
  )
  && chatter.message.split(' ')[0].indexOf("ISee") > -1
  && onTimeoutQ){

    

    //Get user
    var quizzer = chatter.display_name;

    

    //If not already in quizzers

    if(!quizzers.includes(quizzer)){
      //Add them to quizzzers
      quizzers.push(quizzer);

      
      var choice = 3
      //Update count
      if(chatter.message.split(' ')[1] == "1"){
        choice = 0;
        choice1cnt += 1;
      }else if(chatter.message.split(' ')[1] == "2"){
        choice = 0;
        choice2cnt += 1;
      }else if(chatter.message.split(' ')[1] == "3"){
        choice = 0;
        choice3cnt += 1;
      }else{
        choice4cnt += 1;
      }

      //Check if right
      if(choice == rightanswer){
        emoteLog.questions[quizQuestionIndex].cor += 1;
        console.log(("QUIZ - PARSED RESPONSE!").green);
        //Correct
        if(firstright == ""){
          //First
          firstright = quizzer;
        }

        //Check if exists as notetaker
        if (!emoteLog.Notetakers.hasOwnProperty(quizzer)){
          //No create
          emoteLog.Notetakers[quizzer] = {
            "notecount": 1,
            "noteids": [],
            "games": [],
            "qcor": 1,
            "qfal": 0
          };
        }else{

          //Legacy check to see if qcor or qfal exist
          if(!emoteLog.Notetakers[quizzer].hasOwnProperty("qcor") || !emoteLog.Notetakers[quizzer].hasOwnProperty("qfal")){
            //Don't exist 
            emoteLog.Notetakers[quizzer].qcor = 1;
            emoteLog.Notetakers[quizzer].qfal = 0;

          }else{
            emoteLog.Notetakers[quizzer].qcor += 1;
          }

        }

      }else{
        //Datapoint
        emoteLog.questions[quizQuestionIndex].fal += 1;

        //Wrong
        console.log(("QUIZ - PARSED RESPONSE!").red);
        //Check if exists as Notetaker
        if (!emoteLog.Notetakers.hasOwnProperty(quizzer)){
          //No create
          emoteLog.Notetakers[quizzer] = {
            "notecount": 1,
            "noteids": [],
            "games": [],
            "qcor": 0,
            "qfal": 1
          };
        }else{

          //Legacy check to see if qcor or qfal exist
          if(!emoteLog.Notetakers[quizzer].hasOwnProperty("qcor") || !emoteLog.Notetakers[quizzer].hasOwnProperty("qfal")){
            //Don't exist 
            emoteLog.Notetakers[quizzer].qcor = 0;
            emoteLog.Notetakers[quizzer].qfal = 1;

          }else{
            emoteLog.Notetakers[quizzer].qfal += 1;
          }

        }
      }

    }



  }
  //Quiz finish
  function quizEnd(){
    var num_correct = 0;
    //Get correct
    if(rightanswer == 0){
      num_correct = choice1cnt;
    }else if(rightanswer == 1){
      num_correct = choice2cnt;
    }else if(rightanswer == 2){
      num_correct = choice3cnt;
    }else{
      num_correct = choice4cnt;
    }

    

    console.log("QUIZ- Quiz is over!".red);
    //Announce results, start timer until next quiz can be given.
    var percent_correct = Math.floor((num_correct / (choice1cnt+choice2cnt+choice3cnt+choice4cnt))*10000)/100;

    var newiq = (1+((percent_correct-60)/200))*emoteLog.iq;

    if(firstright == ""){
      firstright = "no one"
    }
    //while(onTimeout2)
    if(percent_correct >= 99.99){
      //Pass 
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + " 🎉 SPECTACULAR! (S) 🎉 Everyone got it right! And " + "someone" + " was the first to do so! Chat's IQ is now " + Math.floor(newiq) + "Q (+"+Math.floor(newiq-emoteLog.iq)+")."));

    }else if(percent_correct > 90){
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + "🎓 ASTOUNDING! (A) 🎓 The class got an A! And " + "someone" + " was the first to get it right! Chat's IQ is now " + Math.floor(newiq) + "Q (+"+Math.floor(newiq-emoteLog.iq)+")."));
    }else if(percent_correct > 80){
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + "✅ BEAUTIFUL (B) ✅ The class got a B! And " + "someone" + " was the first to get it right! Chat's IQ is now " + Math.floor(newiq) + "Q (+"+Math.floor(newiq-emoteLog.iq)+")."));
    }else if(percent_correct > 70){
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + " 👍 CORRECT (C) 👍 The class got a C! And " + "someone" + " was the first to get it right! Chat's IQ is now " + Math.floor(newiq) + "Q (+"+Math.floor(newiq-emoteLog.iq)+")."));
    }else if(percent_correct > 60){
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + " ➖ DEPRESSING (D) ➖ The class got a D. But " + "someone" + " was the first to get it right! Chat's IQ is now " + Math.floor(newiq) + "Q (+"+Math.floor(newiq-emoteLog.iq)+")."));
    }else{
      twotchSay(("📝 OhISee QUIZ IS OVER! - Answer: "+emoteLog.questions[quizQuestionIndex].answer + " ❌ FAILURE (F) ❌ The class failed. But " + "someone" + " was the first to get it right! Chat's IQ is now " + Math.floor(newiq) + "Q ("+Math.floor(newiq-emoteLog.iq)+")."));
    }

    emoteLog.iq = newiq;

     //Reset quiz vars
     choice1cnt = 0;
     choice2cnt = 0;
     choice3cnt = 0;
     choice4cnt = 0;
     rightanswer = 0;
     firstright = "";
     quizzers = [];
     quizQuestionIndex = 0;

    setTimeout(timeoutReset2, timeout2);
  }

  function quizWarning(){
    console.log("QUIZ - Warning given!".yellow);
    twotchSay(("📝 OhISee 👉 ⏰ 10 seconds remaining in the quiz! Get your tests in!"), [process.env.CHANNEL], err => {
      console.log(err);
    });
  }


  //Detect 
  if (chatter.message.split(' ').length > 1 && chatter.message.split(' ')[0] === "📝" && chatter.message.split(' ')[1].indexOf("ISee") > -1) {

    //Log Message Event
    console.log(("INFO - MSG - " + chatter.display_name + ": " + chatter.message).gray);

    //Sanitize the Input
    var fullmsg = "";
    for (var i = 2; i < chatter.message.split(' ').length; i++) {
      fullmsg += chatter.message.split(' ')[i] + ' ';
    }
    fullmsg = sanitizeHtml(fullmsg, {
      allowedTags: ['']
    });
    console.log(("INFO - PARSED MSG - " + fullmsg).grey);

    //Increase the
    emoteLog.totalcount += 1;

    //OhISee
    if (!emoteLog.OhISee.hasOwnProperty(fullmsg.toLowerCase())) {
      //New Message
      var msg = fullmsg;
      //NLP for Quiz
      var questionadded = false;
      try {
        if(msg.match(/(.*[a-z]){3}/i).length > 0 && nlp(msg).sentences().length > 0){
          //Strict Question
          if(nlp(msg).sentences().length > 0 
          && nlp(msg).sentences().isQuestion().out('array').length > 0 
          && nlp(msg).sentences().isStatement().out('array').length > 0
          && nlp(msg).sentences().isQuestion().out('array')[0] +" "+ nlp(msg).sentences().isStatement().out('array')[0] + " " == msg
          ){
            console.log(("INFO - STRICT QUESTION FOUND").magenta);

            var question = nlp(msg).sentences().isQuestion().out('array')[0];
            var answer = nlp(msg).sentences().isStatement().out('array')[0];
            var qjson = {"question":"", "answer":"", "cor":0, "fal":0, "gameid":0, "user":0, "usage":0, "msg":""};
            qjson.question = question;
            qjson.answer = answer;
            qjson.user = chatter.display_name;
            qjson.gameid = emoteLog.games[gameName].id;
            qjson.msg = msg; 
            emoteLog.questions.push(qjson);
            emoteLog.questioncount += 1;

            questionadded = true;
          }else{
            //Soft Question Check

            var textjson = nlp(msg).sentences().json();
            //console.log(textjson);
            for(var sent in textjson){
                var outjson = {"question":"", "answer":"", "cor":0, "fal":0, "gameid":0, "user":0, "usage":0, "msg":msg}
                var spli = 0;
                var isans = false;
                var question = "";
                var answer = "";
              
                if(nlp(textjson[sent].text).sentences().isQuestion().out('array').length == 0)
                for(var term in (textjson[sent].terms)){
                    
                    var notis = true;

                    for(var tag in textjson[sent].terms[term].tags){
                        
                        //console.log("HEY");
                        if(textjson[sent].terms[term].tags[tag] == "Copula" 
                        && (textjson[sent].subject === undefined
                        || textjson[sent].subject.text.toLowerCase().indexOf('i') == -1) 
                        && textjson[sent].text.toLowerCase().indexOf(' he') == -1
                        && textjson[sent].text.toLowerCase().indexOf(' she') == -1
                        && textjson[sent].text.toLowerCase().indexOf('they') == -1
                        
                        ){
                            isans =true;
                            notis = false;
                            //console.log(textjson[sent].terms);
                            
                            question = nlp(question).sentences().append(textjson[sent].terms[term].text).out('text');
                            break;
                        }
                    }
                    if(notis){
                        if(isans){
                            answer += textjson[sent].terms[term].text + " ";
                        }else{
                            question += textjson[sent].terms[term].text + " ";
                        } 
                    }
                }
                if(isans){
                    
                    question = nlp(question).sentences().prepend("In " +emoteLog.games[gameName].name + ", ").out('text');
                    if(question.length < 100 && answer.length < 60 ){
                        //console.log("================================================");
                        //console.log(msg);
                        //console.log("------------------------------------------------");
                        
                        //console.log(question);
                        //console.log(answer);

                        outjson.question = question
                        outjson.answer = answer
                        outjson.gameid = emoteLog.games[gameName].id;
                        outjson.user = chatter.display_name;
                        outjson.msg = msg;
                        emoteLog.questions.push(outjson);
                        emoteLog.questioncount += 1;
                        console.log(("INFO - SOFT QUESTION ADDED").magenta);

                        questionadded = true;
                    }
                }
            }

          }
        }
      }catch(e){
        console.log("ERROR - Parsing msg for question.".red);
      }
      emoteLog.OhISee[fullmsg.toLowerCase()] = {
        "text": fullmsg,
        "times": 1,
        "users": [chatter.display_name],
        "games": [emoteLog.games[gameName].id]
      };

      if(questionadded){
        emoteLog.OhISee[fullmsg.toLowerCase()].qid = emoteLog.questions.length - 1;
      }


    } else {
      emoteLog.OhISee[fullmsg.toLowerCase()].times += 1;
      if (!emoteLog.OhISee[fullmsg.toLowerCase()].users.includes(chatter.display_name)) {
        emoteLog.OhISee[fullmsg.toLowerCase()].users.push(chatter.display_name);
      }
      if (!emoteLog.OhISee[fullmsg.toLowerCase()].games.includes(emoteLog.games[gameName].id)) {
        emoteLog.OhISee[fullmsg.toLowerCase()].games.push(emoteLog.games[gameName].id);
      }
    }

    //Notetakers
    if (!emoteLog.Notetakers.hasOwnProperty(chatter.display_name)) {
      emoteLog.Notetakers[chatter.display_name] = {
        "notecount": 1,
        "noteids": [Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase())],
        "games": [emoteLog.games[gameName].id],
        "qcor": 0,
        "qfal": 0
      };
    } else {
      emoteLog.Notetakers[chatter.display_name].notecount += 1;
      if (!emoteLog.Notetakers[chatter.display_name].noteids.includes(Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase()))) { //jesus
        emoteLog.Notetakers[chatter.display_name].noteids.push(Object.keys(emoteLog.OhISee).indexOf(fullmsg.toLowerCase()));
      }
      if (!emoteLog.Notetakers[chatter.display_name].games.includes(emoteLog.games[gameName].id)) { //jesus
        emoteLog.Notetakers[chatter.display_name].games.push(emoteLog.games[gameName].id);
      }
    }

    //Generic Flavor Message

    if (!onTimeout) {
      if (chatter.display_name != "OhISeeBOT") {
        twotchSay("📝 OhISee hmm okay, I've written that down in my notes, @" + chatter.display_name + "...cool!");

        //Whisper 
        if (!emoteLog.whispers.includes(chatter.display_name)) {
          twotchSay("/w @" + chatter.display_name + " OhISee 📝 check out the notebook at https://ohisee.herokuapp.com/ ...report bugs to @itsMichal! You won't get any more whispers from me.");
          twotchSay("/w @itsMichal I just messaged " + chatter.display_name + " for the first time! POGGERS");
          emoteLog.whispers.push(chatter.display_name);
        } else {
          console.log("STATUS - COULD NOT WHISPER, ON LIST".red);
        }

        console.log("STATUS - REPLIED, NOW ON TIMEOUT".yellow);
        msgss++;
        onTimeout = true;
        setTimeout(timeoutReset, timeout);
      }
    } else {
      if (!emoteLog.whispers.includes(chatter.display_name)) {
        twotchSay("/w @" + chatter.display_name + " OhISee 📝 hmm okay, I've written that down " + chatter.display_name + ", so check out my 📝 at https://ohisee.herokuapp.com/ ...this is a test, so please be gentle. You won't get any more whispers from me (hopefully!)");
        emoteLog.whispers.push(chatter.display_name);
        twotchSay("/w @itsMichal I just messaged " + chatter.display_name + " for the first time! POGGERS");
        console.log("STATUS - ON TIMEOUT, WHISPERED INFO".magenta);
      } else {
        console.log("STATUS - COULD NOT WHISPER, ON LIST".red);
      }

      
      //Increment Messages
      msgss++;
    }

    jsonStoreBackup();

    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if (err) throw err;
      console.log("STATUS - JSON updated!".blue);
      console.log(("INFO - " + emoteLog.totalcount + " entries in JSON.").gray);
    });

  }
});

setInterval(jsonStoreBackup,120000);

function jsonStoreBackup(){
  console.log("BACKUP - BACKED UP TO REMOTE".blue);
  request({
    url: "https://api.jsonbin.io/b/5e15c721b236b871b35e2ef9",
    method: 'PUT',
    json: emoteLog,
    headers:{'secret-key':'***REMOVED***', 'versioning':'false'}
  }, function(err, resp, body) {
    //console.log(body);
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

function timeoutResetQ() {
  onTimeoutQ = false;
  console.log("STATUS - NEW QUIZ READY".green);
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
app.get('/agdq19', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(fs.readFileSync('agdq19.html'));
});
app.get('/sgdq19', function(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(fs.readFileSync('sgdq19.html'));
});
app.get(['/ohIsee.json', '/ohIsee'], function(req, res) {
  res.setHeader('Content-Type', 'json');
  res.send(fs.readFileSync('ohIsee.json'));
});
app.get(['/AGDQ2019.json'], function(req, res) {
  res.setHeader('Content-Type', 'json');
  res.send(fs.readFileSync('AGDQ2019.json'));
});
app.get(['/SGDQ2019.json'], function(req, res) {
  res.setHeader('Content-Type', 'json');
  res.send(fs.readFileSync('AGDQ2019.json'));
});
app.listen((process.env.PORT || 8000), () => console.log("STATUS - Webserver started listening on 8000...".green));

twitch.on('error', err => {
  //console.log(err.hasOwnProperty("message"));
  //console.log(err.message == "Your message was not sent because you are sending messages too quickly");
  //console.log(lastsentmessage);
  if(err.hasOwnProperty("message") && err.message == "Your message was not sent because you are sending messages too quickly"){
    msgqueue.push(lastsentmessage);
    //console.log(msgqueue);
    if(msgqueue.length == 1){
      setTimeout(twotchQueue, 4000);
    }
  }
});

var lastsentmessage = "";
function twotchSay(message){
  //console.log("ok")
  try{
    twitch.say(message);
    lastsentmessage = message;
  }catch(e){
    console.log(e);
  }
}

var msgqueue = [];
function twotchQueue(){
  console.log("HOLY MOLY");
  console.log(msgqueue[0]);
  try{
    twitch.say(msgqueue[0]);
    msgqueue.splice(0,1);
    if(msgqueue.length!=0){
      setTimeout(twotchQueue, 4000);
    }
  }catch(e){
    console.log(e);
  }
}