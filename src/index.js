var request = require('request');
var { repos } = require('./repos.json');
var date =  null;

require('dotenv').config();

setInterval(function(){
    [date, repos] = getRepos(date, repos);
}, 5000);

function getRepos(date, repos){
    repos = repos.map(repo => {

        repo = generateUUID(repo);

        let { gitRequest, pipelineRunRequest } = getRequests(repo);

        request(gitRequest, function (error, response) {
            validate(error, response, process.env); 

            let new_date = getLastCommitter(response);

            if(new_date !== date){    
                request(pipelineRunRequest, function (error, response) { 
                    validate(error, response);
                });
                date = new_date;
            }

        });

        return repo;
    });

    return [ date, repos ];
}

function validate(error, response, env){
    if(env != null){
        if(!env.API_TOKEN) throw new Error("API TOKEN NOT FOUND AS ENV");
    }
    
    if (error) throw new Error(error);
    if (typeof response.body.message  == "string" ) return new Error(error);
    
}

function getLastCommitter(response){
    return JSON.parse(response.body)[0].commit.committer.date;
}

function getRequests(repo){
    var gitRequest = {
        headers : {
        'User-Agent': 'Nodejs-App',
        'Authorization': 'Bearer ' + process.env.API_TOKEN,
        'Content-Type' : 'application/json; charset=utf-8'
        },
        'method': 'GET',
        'url': repo.url + "?page=1&per_page=1"
    };

    var pipelineRunRequest = {
        'method': 'POST',
        'url': 'http://' + process.env.IP + ':' + process.env.PORT + '/proxy/apis/tekton.dev/v1alpha1/namespaces/' + repo.namespace + '/pipelineruns/',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"apiVersion":"tekton.dev/v1alpha1","kind":"PipelineRun","metadata":{"name": repo.pipeline + "-run-" + repo.uuid, "labels":{"tekton.dev/pipeline":"mypipeline","app":"tekton-app"}},"spec":{"pipelineRef":{"name":"mypipeline"},"resources":[],"params":[],"timeout":"60m"}})  
    };

    return { gitRequest, pipelineRunRequest };
}

function generateUUID(repo){
    if(!repo.uuid){
        repo.uuid = random(Math.pow(10, 12), Math.pow(10, 13));
    }

    return repo;
}

function random(min, max) { 
    // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}
