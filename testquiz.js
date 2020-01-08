var fs = require('fs');
const nlp = require('compromise')
nlp.extend(require('compromise-sentences'))
const { EmoteFetcher, EmoteParser } = require('twitch-emoticons');
const fetcher = new EmoteFetcher();
const parser = new EmoteParser(fetcher, {
    type: 'markdown',
    match: /:(.+?):/g
});
//Read json
var gamesarray = [];
var json = JSON.parse(fs.readFileSync('ohIsee.json'));
//fetcher.fetchTwitchEmotes().then(()=>{
    for(var msgid in json.OhISee){
        var subjson = json.OhISee[msgid];
    
        var msg = subjson.text;
        
        try{
            if(nlp(msg).sentences().length > 0 && nlp(msg).sentences().isQuestion().out('text').length > 0 
            && nlp(msg).sentences().isStatement().out('text').length > 0
            && nlp(msg).sentences().isQuestion().out('text') +" "+ nlp(msg).sentences().isStatement().out('text') + " " == msg && false
            ){
                //console.log(nlp(msg).sentences().isQuestion().out('array')[0] + " " + nlp(msg).sentences().isStatement().out('array')[0] + "/");
                //console.log(msg + "/")
               
                    //if(nlp(msg).sentences().isStatement().out('array')[0].split(" ")[0] == parser.parse(nlp(msg).sentences().isStatement().out('array')[0].split(" ")[0])){
                        console.log("================================================");
                        console.log(msg);
                        console.log("------------------------------------------------");
                        console.log(nlp(msg).sentences().isQuestion().out('array')[0]);
                        console.log(nlp(msg).sentences().isStatement().out('array')[0]);
                    //} 
                    
                
                
            }

            if(nlp(msg).sentences().length > 0
            ){
                

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
                            && textjson[sent].subject.text.toLowerCase().indexOf('i') == -1 
                            && textjson[sent].text.toLowerCase().indexOf('he') == -1
                            && textjson[sent].text.toLowerCase().indexOf('she') == -1
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
                        
                        question = nlp(question).sentences().prepend("In " + Object.keys(json.games)[subjson.games[0]]+ ", ").out('text');
                        if(question.length < 100 && answer.length < 60 ){
                            console.log("================================================");
                            console.log(msg);
                            console.log("------------------------------------------------");
                            
                            console.log(question);
                            console.log(answer);

                            outjson.question = question
                            outjson.answer = answer
                            outjson.gameid = subjson.games[0];
                            outjson.user = subjson.users[0];
                            json.OhISee[msgid].qid = gamesarray.length;
                            gamesarray.push(outjson);
                            
                        }
                    }
                }
                
                //console.log(nlp(msg).sentences().isStatement().out('array')[0])
            }
    
            
        }catch(e){
            
        }
        
    }
//});
console.log(gamesarray);
json.questions = gamesarray;
json.questioncount = gamesarray.length;

fs.writeFile('ohIsee_test2.json', JSON.stringify(json), 'utf8', err => {});