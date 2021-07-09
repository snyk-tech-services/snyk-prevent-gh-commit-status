import axios from 'axios';
import { snykProjectDetails } from "../types";
import { ghDetails, ghCommitStatusState, ghCommitStatus } from "./types"

  
  

export const sendCommitStatus = async (snykDeltaBinaryResult: number, snykProjectDetails: snykProjectDetails, ghDetails: ghDetails, issueFoundNoBaseline: boolean ): Promise<ghCommitStatus> => {

    let data: ghCommitStatus = {
        state: ghCommitStatusState.pending,
        target_url: `https://app.snyk.io/org/${snykProjectDetails.orgName}/projects`,
        description: 'Could not find project ID. Verify org tested against',
        context: `Snyk Prevent (${snykProjectDetails.orgName} - ${snykProjectDetails.targetFile})`,
    }
    
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
            data.description = 'Skipping check - New issue(s) found for unmonitored project';
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
  
      const requestHeaders: Object = {
        'Content-Type': 'application/json',
        Authorization: `token ${ghDetails.token}`,
      };
      const ghClient = axios.create({
        baseURL: baseUrl,
        responseType: 'json',
        headers: { ...requestHeaders },
      });


      const ghResponse = await ghClient.post(
        `/repos/${ghDetails.orgName}/${ghDetails.repoName}/statuses/${ghDetails.commitSha}`,
        JSON.stringify(data),
      );


      return ghResponse.data as ghCommitStatus
}
