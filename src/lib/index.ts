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
    const debug = process.argv.slice(2)[5] == 'debug' ? true : false;
    const jsonResultsFromSnykTest = fs
      .readFileSync(jsonResultsFilePath)
      .toString();

    const result = await getDelta(jsonResultsFromSnykTest,debug);
    const orgName = JSON.parse(jsonResultsFromSnykTest).org;
    const projectID = JSON.parse(jsonResultsFromSnykTest).projectId || '';

    let data: ghCommitStatus = {
        state: ghCommitStatusState.pending,
        target_url: `https://app.snyk.io/org/${orgName}/projects`,
        description: 'Could not find project ID. Verify org tested against',
        context: `Snyk Prevent (${orgName})`,
    }
    if(projectID != ''){
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
    return ghResponse.data
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
