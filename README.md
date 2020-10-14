![OhISee Logo](https://i.imgur.com/IJFVg00.png)

# OhISee (Twitch.tv's Friendly Chat/Quiz/Notebot)

A [Twitch.tv](https://www.twitch.tv/) Chatbot run during [Games Done Quick](https://gamesdonequick.com/). Takes notes from users, stores them, and can even quiz them using said notes! Was ran on heroku, however it is currently unmaintained.

It last ran for [AGDQ 2020](https://gamesdonequick.com/tracker/event/agdq2020), on [Trihex's "Poverty Chat"](https://www.twitch.tv/trihex) since the official Games Done Quick channel is subscriber mode only.

## Disclaimer for Employers

Please take the code written here not as an example of my ability to write code, but perhaps to make things work. Most of this code is years old, and I've gotten a lot better at writing in Node.js since. I would definitely use a proper database solution and better templating, scoring, and parsing if I were to re-write this. Additionally, this code is very unclean, and filled with terrible naming conventions and organization. It was never meant to be seen by another developer, and [I can definitely write better code](https://github.com/ItsMichal/CSCI-BShip) for you.


## Features

- Parse through chat and store every "note" (denoted by starting the message with "📝 ![OhISee](https://cdn.frankerfacez.com/emoticon/230001/1)", with the latter emoji being the [FrankerFaceZ Emoji "OhISee"](https://www.frankerfacez.com/emoticon/230001-OhISee) 
- Parse commands in chat such as
  - !noterchannel - switches the channel the bot is in
  - !RandomNote #(1-5) - posts a # number of random notes in the chat
  - !Note # - posts the #th note in the chat
  - !NoteRoll - gives the top 3 notetakers by quantity
  - !HonorRoll - gives the top 3 quiz scorers
  - !NoteCount - gives the current number of notes taken
  - !Notebook - PMs a link to the OhISee website/notebook to the user who ran the command
  - !Grade (username OPTIONAL) - Gives the users grade, can specify a username optionally
  - !Quiz - Starts a multiple-choice quiz in the chat, with questions automatically generated using Natural Language Processing. 
  - Automatically responds to users in chat, without spamming it
  - Can visit [a website (might currently be offline)](ohisee.herokuapp.com) to view notes and a list of top notetakers/quiz scorers.
  - View past notes from previous events at said website
  - Automatically tracks live game data from the [Games Done Quick](https://twitch.tv/GamesDoneQuick) stream and attaches it to each note taken.
  - Simple queue for high-volume chat handling
  
## Technologies Used

- Node.js
  - Twitch-Bot
  - JSON
  - Express
- Heroku
- Twitch.tv API

## Environment variables

Uses the following environment variables-
- **TWITCH_OAUTH**: Oauth key from Twitch.tv account
- **CHANNEL**: Twitch.tv channel to join (aka username of channel)
- **JSONBIN_SECRET**: Secret to access JSONBin store (will be deprecated with a true db solution)
- **TAPI_CLIENTID**: TwitchAPI Client ID
