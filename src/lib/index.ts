#!/usr/bin/env node
import 'source-map-support/register';

import { getDelta, SnykDeltaOutput } from 'snyk-delta';
import { sendCommitStatus } from './github/commitStatus';
import { createPrComment } from './github/prComments';
import { ghActivity, ghDetails } from './github/types';
import { snykProjectDetails } from './types';
import * as fs from 'fs';

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
    const ghPRNumber = process.argv.slice(2)[5] || '';
    const detailsLink = process.argv.slice(2)[6] || '';

    const debug = process.env.SNYK_DEBUG ? true : false; // process.argv.slice(2)[6] == 'debug' ? true : false;
    const jsonResultsFromSnykTest = fs
      .readFileSync(jsonResultsFilePath)
      .toString();

    let jsonResultsArray: Array<any> = [];
    // Handle --all-projects json array
    if (jsonResultsFromSnykTest.startsWith('[')) {
      const parsedJSON = JSON.parse(jsonResultsFromSnykTest) as Array<JSON>;
      jsonResultsArray = parsedJSON.map((x) => {
        return JSON.stringify(x);
      });
    } else {
      jsonResultsArray.push(jsonResultsFromSnykTest);
    }

    const responseArray: Array<ghActivity> = [];

    for (let i = 0; i < jsonResultsArray.length; i++) {
      const currentResults = jsonResultsArray[i];
      const snykDeltaResults = (await getDelta(
        currentResults,
        debug,
      )) as SnykDeltaOutput;
      
      const parsedCurrentResults = JSON.parse(currentResults);
      const orgName = parsedCurrentResults.org;
      const projectID = parsedCurrentResults.projectId || '';
      const targetFile =
        parsedCurrentResults.targetFile ||
        parsedCurrentResults.displayTargetFile ||
        'TargetFile not found';

      const snykProjectDetails: snykProjectDetails = {
        orgName: orgName,
        projectID: projectID,
        targetFile: targetFile,
        detailsLink: detailsLink,
      };

      const githubDetails: ghDetails = {
        orgName: ghOrg,
        repoName: ghRepo,
        commitSha: ghSha,
        prNumber: ghPRNumber,
        token: ghToken,
      };

      if (typeof snykDeltaResults.result !== 'undefined') {
        try {
          const ghCommitStatusUpdateResponse = await sendCommitStatus(
            snykDeltaResults.result,
            snykProjectDetails,
            githubDetails,
          );

          let shouldCommentPr = false;
          if (snykDeltaResults.result > 0 && ghPRNumber) {
            shouldCommentPr = true;
          }

          const ghPrCommentsCreateResponse = shouldCommentPr
            ? await createPrComment(snykDeltaResults, githubDetails)
            : {};

          responseArray.push({
            status: ghCommitStatusUpdateResponse,
            prComment: ghPrCommentsCreateResponse,
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        throw new Error(`Unexpected error - undefined snyk delta result`);
      }
    }

    return responseArray;
  } catch (err) {
    throw new Error(err);
  }
};

if (!module.parent) {
  main();
}

export { main };
