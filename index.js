var request = require('request');
var { repos } = require('./repos.json');
var date =  null;
var last_date = null;
require('dotenv').config();

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
    
       if(last_date !== date){
            console.log("test");
       }

       last_date = date;
       date = JSON.parse(response.body)[0].commit.committer.date;
       
     });
});


