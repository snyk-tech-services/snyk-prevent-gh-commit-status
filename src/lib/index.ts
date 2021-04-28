#!/usr/bin/env node
import 'source-map-support/register';

import { getDelta } from 'snyk-delta';
import * as fs from 'fs';
import axios from 'axios';

interface ghCommitStatus {
  state: ghCommitStatusState;
  target_url: string;
  description: string;
  context: string;
}

enum ghCommitStatusState {
  'error' = 'error',
  'failure' = 'failure',
  'pending' = 'pending',
  'success' = 'success',
}
const main = async () => {
  try {
    if (process.argv.length < 7) {
      console.log('error missing argument');
      process.exit(2);
    }
    const jsonResultsFilePath = process.argv.slice(2)[0];
    const ghToken = process.argv.slice(2)[1];
    const ghOrg = process.argv.slice(2)[2];
    const ghRepo = process.argv.slice(2)[3];
    const ghSha = process.argv.slice(2)[4];
    const detailsLink = process.argv.slice(2)[5] || '';
    const debug = process.env.SNYK_DEBUG ? true : false// process.argv.slice(2)[6] == 'debug' ? true : false;
    const jsonResultsFromSnykTest = fs
      .readFileSync(jsonResultsFilePath)
      .toString();

    let jsonResultsArray:Array<any> = []
    // Handle --all-projects json array
    if(jsonResultsFromSnykTest.startsWith('[')){
      const parsedJSON = JSON.parse(jsonResultsFromSnykTest) as Array<JSON>
      jsonResultsArray = parsedJSON.map(x=> {return JSON.stringify(x)})
    } else {
      jsonResultsArray.push(jsonResultsFromSnykTest)
    }
    const responseArray = []
    for(let i=0;i<jsonResultsArray.length;i++){
      const currentResults = jsonResultsArray[i]
      const result = await getDelta(currentResults,debug);
      const parsedCurrentResults = JSON.parse(currentResults)
      const orgName = parsedCurrentResults.org;
      const projectID = parsedCurrentResults.projectId || '';
      const targetFile = parsedCurrentResults.targetFile || parsedCurrentResults.displayTargetFile || 'TargetFile not found';
  
      let data: ghCommitStatus = {
          state: ghCommitStatusState.pending,
          target_url: `https://app.snyk.io/org/${orgName}/projects`,
          description: 'Could not find project ID. Verify org tested against',
          context: `Snyk Prevent (${orgName} - ${targetFile})`,
      }
      if(detailsLink != ''){
        data.target_url = detailsLink
      } else if(projectID != ''){
        data.target_url = `https://app.snyk.io/org/${orgName}/project/${projectID}`
      }
  
      switch (result) {
        case 0:
          data.state = ghCommitStatusState.success;
          data.description = 'No new issue found';
          break;
        case 1:
          data.state = ghCommitStatusState.failure;
          data.description = 'New issue(s) found';
          break;
        case 2:
          data.state = ghCommitStatusState.error;
          data.description = 'Error while checking new issues';
      }
  
      const baseUrl = process.env.GH_API || 'https://api.github.com'
  
      const requestHeaders: Object = {
        'Content-Type': 'application/json',
        Authorization: `token ${ghToken}`,
      };
      const ghClient = axios.create({
        baseURL: baseUrl,
        responseType: 'json',
        headers: { ...requestHeaders },
      });
  
      const ghResponse = await ghClient.post(
        `/repos/${ghOrg}/${ghRepo}/statuses/${ghSha}`,
        JSON.stringify(data),
      );

      responseArray.push(ghResponse.data)
    }

    
    return responseArray
  } catch (err) {
    throw new Error(err)
  }
};

if(!module.parent){
  main()
} 

export {
  main
}
