var request = require('request');
var { repos } = require('./repos.json');
var date =  null;

require('dotenv').config();

setInterval(getRepos, 5000);

function getRepos(){
    repos.forEach(repo => {
        var options = {
            headers : {
            'User-Agent': 'Nodejs-App',
            'Authorization': 'Bearer ' + process.env.API_TOKEN,
            'Content-Type' : 'application/json; charset=utf-8'
            },
        'method': 'GET',
        'url': repo + "?page=1&per_page=1"
        };
        
        request(options, function (error, response) { 
            if (error) throw new Error(error);
            if (typeof response.body.message  == "string"){
                return new Error(error);
            }
            
            let new_date = JSON.parse(response.body)[0].commit.committer.date;

            if(new_date !== date){    
                console.log("test");
                date = new_date;
            }
        });
    });
}

