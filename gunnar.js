var tapi = require('twitch-api-v5');
//22510310
tapi.clientID = '***REMOVED***';
var TwitchBot = require("twitch-bot");
var fs = require('fs');
var colors = require('colors');
var express = require('express');
var request = require('request');
var sanitizeHtml = require('sanitize-html');
var tapi = require('twitch-api-v5');
var Filter = require('bad-words'),
  filter = new Filter({
    placeHolder: '*'
  });
var ordinal = require('ordinal');
filter.removeWords("shit", "hell", "heck", "damn");


var gameName = "N/a";



var emoteLog = {
  "OhISee": {},
  "whispers": [],
  "Notetakers": {}
};
try {
  //emoteLog = JSON.parse(fs.readFileSync('ohIsee.json'));
  //request.get("https://api.myjson.com/bins/9p6hk", function(err, resp, body){
  //request.get("https://api.myjson.com/bins/13l6lk", function(err, resp, body) {
  request.get("https://api.myjson.com/bins/g60sd", function(err,resp,body){
    if (err)
      console.log(("ERROR - Something went wrong with getting file from myjson!").red);

    console.log("STATUS - Received JSON file from myjson...".green);
    emoteLog = JSON.parse(body);
    emoteLog.games = {"pre":{name:"Pre-Show", id:0, short:"N/A"},"Spyro Reignited Trilogy: Spyro the Dragon":{name:"Spyro Reignited Trilogy: Spyro the Dragon", id:1, short:"SRT:StD"},"Portal 2":{name:"Portal 2", id:2,short:"P2"},"Teenage Mutant Ninja Turtles III: The Manhattan Project":{name:"Teenage Mutant Ninja Turtles III: The Manhattan Project", id:3, short:"TMNT3:TMP"},"Super Mario Bros. 2":{name:"Super Mario Bros. 2", id:4, short:"SMB2"},"Donkey Kong Country 2: Diddy's Kong Quest":{name:"Donkey Kong Country 2: Diddy's Kong Quest", id:5, short:"DKC2:DKQ"}};
    //JSON.stringify(emoteLog.games);

    var curgameID = 1;
    for (var i = 0; i < Object.keys(emoteLog.OhISee).length; i++){
        var key = Object.keys(emoteLog.OhISee)[i];
        var value = emoteLog.OhISee[key];
        //for (var key in obj){
            var attrName = key;
            var attrValue = value;

            attrValue.games = [curgameID];
            attrValue.times = [1561309200000];

            for(var j = 0; j < attrValue.users.length; j++){
              console.log(attrValue.users[j]);
              if(emoteLog.Notetakers[attrValue.users[j]].hasOwnProperty("games") ){
                if(!emoteLog.Notetakers[attrValue.users[j]].games.includes(curgameID)){
                  emoteLog.Notetakers[attrValue.users[j]].games.push(curgameID);
                }

              }else{
                emoteLog.Notetakers[attrValue.users[j]].games = [curgameID];
              }
            }

            if(attrValue.text == "They love us " || (attrValue.text == "imGlitch ADS ") || attrValue.text == "Ninjas explode when they die " || attrValue.text =="really tough stages later on " || attrValue.text == "HAIL HYDRA "){
              curgameID++;
              console.log(attrValue);
            }


            emoteLog.OhISee[attrName] = attrValue;
            //console.log(emoteLog.OhISee[attrName]);
        //}
    }


    fs.writeFile('ohIsee.json', JSON.stringify(emoteLog), 'utf8', err => {
      if (err) throw err;
      console.log("STATUS - Local JSON file updated!".blue);
      console.log(("INFO - " + emoteLog.totalcount + " entries in JSON.").gray);

    });
    updateGameName();
    setInterval(updateGameName, 5000);
  });



  //emoteLog.whispers.includes(chatter.display_name);
} catch (e) {
  console.log(("STATUS - CREATING JSON FILE"));
}

//retcon


function updateGameName(){
  tapi.channels.channelByID({channelID:22510310}, (err, resp)=>{
    if(err){
      console.log(err);
    }else{
      console.log("STATUS - Updated Game");
      var gameNameInit = resp.status;
      gameName = gameNameInit.slice(gameNameInit.indexOf("-")+2, gameNameInit.length);

      if(!emoteLog.games.hasOwnProperty(gameName)){

        var abbrev = gameName.replace( /\B[a-zA-Z'-]+/g, '' );
        abbrev = abbrev.replace(/[\s]/g,'');
        console.log(abbrev);
        //add game
        emoteLog.games[gameName]={name:gameName, id:Object.keys(emoteLog.games).length, short:abbrev};
      }
      console.log("EVENT - New game detected! - "+gameName+" ("+abbrev+")");
    }

    request({
      url: "https://api.myjson.com/bins/o9osd",
      method: 'PUT',
      json: emoteLog
    }, function(err, resp, body) {
      if (err) {
        console.log("ERROR - Problem logging to myjson!".red);
        console.log(("DETAILS - " + err + " / " + resp + " / " + body).grey);
      }
    });
  });
}


console.log(gameName);
