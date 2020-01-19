var request = require('request');
var shortid = require('shortid');
var { repos } = require('./repos.json');
var date =  null;

require('dotenv').config();

setInterval(getRepos, 5000);

function getRepos(){

    var token = process.env.API_TOKEN;
    var uuid = random(Math.pow(10, 12), Math.pow(10, 13));
    
  
    repos.forEach(repo => {

        var { gitRequest, pipelineRunRequest, pipelineRerunRequest } = getRequests(repo, uuid);

        
        request(gitRequest, function (error, response) {
            validate(token, error, response); 

            let new_date = getLastCommitter(response);

            if(new_date !== date){    
                if(isFirstRequest(date)){
                    request(pipelineRunRequest, function (error, response) { 
                        validate(token, error, response);
                        console.log(response);
                    });
                }
                else{
                    
                }

                date = new_date;
            }

        });
    });
    
}

function random(min, max) { 
    // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function validate(token, error, response){
    if(!token) throw new Error("API TOKEN NOT FOUND AS ENV");
    if (error) throw new Error(error);
    if (typeof response.body.message  == "string" ){
        return new Error(error);
    }
}

function isFirstRequest(){
    return date === null;
}

function getLastCommitter(response){
    return JSON.parse(response.body)[0].commit.committer.date;
}


function getRequests(repo, uuid){
    var gitRequest = {
        headers : {
        'User-Agent': 'Nodejs-App',
        'Authorization': 'Bearer ' + process.env.API_TOKEN,
        'Content-Type' : 'application/json; charset=utf-8'
        },
        'method': 'GET',
        'url': repo + "?page=1&per_page=1"
    };

    var pipelineRunRequest = {
        'method': 'POST',
        'url': 'http://localhost:9097/proxy/apis/tekton.dev/v1alpha1/namespaces/default/pipelineruns/',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"apiVersion":"tekton.dev/v1alpha1","kind":"PipelineRun","metadata":{"name":"mypipeline-run-" + uuid, "labels":{"tekton.dev/pipeline":"mypipeline","app":"tekton-app"}},"spec":{"pipelineRef":{"name":"mypipeline"},"resources":[],"params":[],"timeout":"60m"}})  
    };

    var pipelineRerunRequest = {

    };

    return { gitRequest, pipelineRunRequest, pipelineRerunRequest };
}
