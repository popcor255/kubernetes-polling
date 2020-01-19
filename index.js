var request = require('request');
var shortid = require('shortid');
var { repos } = require('./repos.json');
var date =  null;

require('dotenv').config();

setInterval(getRepos, 5000);

function getRepos(){

    var uuid = randomIntFromInterval(1, Math.pow(10, 10));
  
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

        var tektonRequest = {
            'method': 'POST',
            'url': 'http://localhost:9097/proxy/apis/tekton.dev/v1alpha1/namespaces/default/pipelineruns/',
            'headers': {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({"apiVersion":"tekton.dev/v1alpha1","kind":"PipelineRun","metadata":{"name":"mypipeline-run-" + uuid, "labels":{"tekton.dev/pipeline":"mypipeline","app":"tekton-app"}},"spec":{"pipelineRef":{"name":"mypipeline"},"resources":[],"params":[],"timeout":"60m"}})  
        };
        
        request(options, function (error, response) { 
            if (error) throw new Error(error);
            if (typeof response.body.message  == "string" ){
                return new Error(error);
            }

            let new_date = JSON.parse(response.body)[0].commit.committer.date;

            if(new_date !== date){    
                request(tektonRequest, function (error, response) { 
                    if (error) throw new Error(error);
                    console.log(response.body);
                });
                date = new_date;
            }

        });
    });
    
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }