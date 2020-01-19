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

        var tektonRequest = {
            'method': 'POST',
            'url': 'http://localhost:9097/proxy/apis/tekton.dev/v1alpha1/namespaces/tekton-pipelines/pipelineruns/',
            'headers': {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({"apiVersion":"tekton.dev/v1alpha1","kind":"PipelineRun","metadata":{"name":"mypipeline-run-1579400761634","labels":{"tekton.dev/pipeline":"mypipeline","app":"tekton-app"}},"spec":{"pipelineRef":{"name":"mypipeline"},"resources":[],"params":[],"timeout":"60m"}})  
        };
        
        request(options, function (error, response) { 
            if (error) throw new Error(error);
            if (typeof response.body.message  == "string"){
                return new Error(error);
            }

            let new_date = JSON.parse(response.body)[0].commit.committer.date;

            if(new_date !== date && date != null){    
                request(tektonRequest, function (error, response) { 
                    if (error) throw new Error(error);
                    console.log(response.body);
                });
                date = new_date;
            }

        });

          


    });
}

