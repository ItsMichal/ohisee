# OhISee

A [Twitch.tv](https://www.twitch.tv/) Chatbot run during [Games Done Quick](https://gamesdonequick.com/). Takes notes from users, stores them, and can even quiz them using said notes! Was ran on heroku, however it is currently unmaintained.

It last ran for [AGDQ 2020](https://gamesdonequick.com/tracker/event/agdq2020), on [Trihex's "Poverty Chat"](https://www.twitch.tv/trihex) since the official Games Done Quick channel is subscriber mode only.

# Disclaimer for Employers

Please take the code written here not as an example of my ability to write code, but perhaps to make things work. Most of this code is years old, and I've gotten a lot better at writing in Node.js since. I would definitely use a proper database solution and better templating, scoring, and parsing if I were to re-write this. Additionally, this code is very unclean, and filled with terrible naming conventions and organization. It was never meant to be seen by another developer, and [I can definitely write better code](https://github.com/ItsMichal/CSCI-BShip) for you.

# Environment variables

Uses the following environment variables-
- **TWITCH_OAUTH**: Oauth key from Twitch.tv account
- **CHANNEL**: Twitch.tv channel to join (aka username of channel)
- **JSONBIN_SECRET**: Secret to access JSONBin store (will be deprecated with a true db solution)
- **TAPI_CLIENTID**: TwitchAPI Client ID
