#!/usr/bin/env node
import 'source-map-support/register';
import { getDelta, SnykDeltaOutput } from 'snyk-delta';
import { sendCommitStatus } from './github/commitStatus';
import { createPrComment, deletePrComment } from './github/prComments';
import { ghActivity, ghDetails, ghPrCommentsStatus } from './github/types';
import { snykProjectDetails } from './types';
import * as fs from 'fs';
import * as debugLib from 'debug';
const debug = debugLib('snyk:generate-data-script'); 

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
    let keepHistory = false;
    let setPassIfNoBaselineFlag = false;
    let detailsLink = '';
    let failOn = undefined

    const options = process.argv.slice(8)

    options.forEach(option => {
      if (option === 'keepHistory') {
        keepHistory = true
      } else if (option === 'setPassIfNoBaselineFlag') {
        setPassIfNoBaselineFlag = true
      } else if(option === 'upgradable' || option === 'patchable' || option === 'all') {
        failOn = option
      } else {
        detailsLink = option || ''
      }
    })

    debug(`running snyk-prevent-gh-commit-status with org: ${ghOrg} repo: ${ghRepo} commit: ${ghSha} PRNumber: ${ghPRNumber} keepHistory: ${keepHistory} setPassIfNoBaselineFlag: ${setPassIfNoBaselineFlag} detailsLink: ${detailsLink} failOn: ${failOn}`)

    const snykDeltaDebug = process.env.SNYK_DEBUG ? true : false; // process.argv.slice(2)[6] == 'debug' ? true : false;
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
      debug(`Running snyk delta for ${i}`)
      const snykDeltaResults = (await getDelta(
        currentResults,
        snykDeltaDebug,
        setPassIfNoBaselineFlag,
        failOn,
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
          let shouldCommentPr = false;
          let noBaseline = false;
          
          if (snykDeltaResults.result === 1 && ghPRNumber) {
            shouldCommentPr = true;
          }

          if((snykDeltaResults.passIfNoBaseline && snykDeltaResults.noBaseline) === true && snykDeltaResults.result === 0)
          {
            if (((snykDeltaResults.newVulns) && (snykDeltaResults.newVulns.length > 0)) || 
            ((snykDeltaResults.newLicenseIssues) && (snykDeltaResults.newLicenseIssues.length > 0))) 
            {
              shouldCommentPr = true;
              noBaseline = true
            }
          }

          const ghCommitStatusUpdateResponse = await sendCommitStatus(
            snykDeltaResults.result,
            snykProjectDetails,
            githubDetails, 
            noBaseline,
          );

          let ghPrCommentsCreateResponse: ghPrCommentsStatus
          const allProjectPost = (i > 0) ? true : false

          if (ghPRNumber)
          {
            if (snykDeltaResults.result === 0 && !keepHistory && !allProjectPost) {
              debug('Deleting comments on PR')
              ghPrCommentsCreateResponse = await deletePrComment(githubDetails)
            }
          }

          debug(`shouldCommentPr = ${shouldCommentPr}`)

          ghPrCommentsCreateResponse = shouldCommentPr 
            ? await createPrComment(snykDeltaResults, githubDetails, keepHistory)
            : {};

          responseArray.push({
            status: ghCommitStatusUpdateResponse,
            prComment: ghPrCommentsCreateResponse,
          });
        } catch (err: any) {
          console.error(err.message);
        }
      } else {
        throw new Error(`Unexpected error - undefined snyk delta result`);
      }
    }

    return responseArray;
  } catch (err: any) {
    throw new Error(err.message);
  }
};

if (!module.parent) {
  main();
}

export { main };
