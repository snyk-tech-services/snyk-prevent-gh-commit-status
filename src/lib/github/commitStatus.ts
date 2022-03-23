import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { snykProjectDetails } from "../types";
import { ghDetails, ghCommitStatusState, ghCommitStatus } from "./types"
import * as debugLib from 'debug';
const debug = debugLib('snyk:generate-data-script');
  

export const sendCommitStatus = async (snykDeltaBinaryResult: number, snykProjectDetails: snykProjectDetails, ghDetails: ghDetails, issueFoundNoBaseline: boolean ): Promise<ghCommitStatus> => {
    
    const data: ghCommitStatus = {
        state: ghCommitStatusState.pending,
        target_url: `https://app.snyk.io/org/${snykProjectDetails.orgName}/projects`,
        description: 'Could not find project ID. Verify org tested against',
        context: `Snyk Prevent (${snykProjectDetails.orgName} - ${snykProjectDetails.targetFile})`,
    }

    debug(`Send commit status for ${data.target_url} with status: ${data.state}`)
    
    if(snykProjectDetails.detailsLink != ''){
      data.target_url = snykProjectDetails.detailsLink
    } else if(snykProjectDetails.projectID != ''){
      data.target_url = `https://app.snyk.io/org/${snykProjectDetails.orgName}/project/${snykProjectDetails.projectID}`
    }

    switch (snykDeltaBinaryResult) {
        case 0:
          data.state = ghCommitStatusState.success;
          data.description = 'No new issue found';
          if (issueFoundNoBaseline)
          {
            data.description = 'Passing check as project is unmonitored - For information: issue(s) found for unmonitored project';
          } 
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
  
      const requestHeaders: AxiosRequestHeaders = {
        'Content-Type': 'application/json',
        Authorization: `token ${ghDetails.token}`,
      };
      const config: AxiosRequestConfig = {
        baseURL: baseUrl,
        responseType: 'json',
        headers: { ...requestHeaders },
      }
      const ghClient = axios.create(config);

      const ghResponse = await ghClient.post(
        `/repos/${ghDetails.orgName}/${ghDetails.repoName}/statuses/${ghDetails.commitSha}`,
        JSON.stringify(data),
      );


      return ghResponse.data as ghCommitStatus
}
