import { SnykDeltaOutput } from 'snyk-delta';
import { ghDetails, ghPrCommentsStatus } from './types';
import axios from 'axios';
import * as _ from 'lodash';
import * as debugLib from 'debug';
const debug = debugLib('snyk:generate-data-script');

const formatPRComment = (snykDeltaResults: SnykDeltaOutput, commitNb: string): string => {
  const newVulns = snykDeltaResults.newVulns || [];
  const newLicenseIssues = snykDeltaResults.newLicenseIssues || [];


  let allIssuesToDisplay = '';
  let vulnerabilityLine = '';
  let licenseLine = '';

  if (snykDeltaResults.passIfNoBaseline && snykDeltaResults.noBaseline)
  {
    allIssuesToDisplay = `### ******* INFORMATION ONLY *******\n`
    allIssuesToDisplay += `####  project is unmonitored (no baseline) ####\n`
    allIssuesToDisplay += `see https://github.com/snyk-tech-services/snyk-prevent-gh-commit-status#additional-option---debug for more information\n`
  } 

  allIssuesToDisplay += `### ******* Vulnerabilities report for commit number ${commitNb} *******\n`

  if (newVulns.length + newLicenseIssues.length > 1) {
    allIssuesToDisplay += 'New Issues Introduced!\n';
  } else {
    allIssuesToDisplay += 'New Issue Introduced!\n';
  }

  // New Vulnerability
  if (newVulns.length > 0) {
    vulnerabilityLine += '## Security\n';
    vulnerabilityLine += `${newVulns.length} issue${
      newVulns.length > 1 ? 's' : ''
    } found \n`;

    newVulns.forEach((vuln, index) => {
      vulnerabilityLine += `* ${index + 1}/${newVulns.length}: ${
        vuln.title
      } [${_.capitalize(vuln.severity)} Severity]\n`;

      const paths = vuln.from as Array<string>;

      vulnerabilityLine += `\t+ Via:   ${paths.join(' => ')}\n`;

      if (vuln.fixedIn) {
        vulnerabilityLine += `\t+ Fixed in: ${
          vuln.packageName
        }, ${vuln.fixedIn.join(', ')}\n`;

        if (vuln.isUpgradable) {
          const upgradePaths = vuln.upgradePath;
          if (upgradePaths && !upgradePaths[0]) {
            upgradePaths.shift();
          }
          const filteredUpgradedPath = upgradePaths? upgradePaths.join('=>'):'';
          vulnerabilityLine += `\t+ Fixable by upgrade: ${filteredUpgradedPath}\n`;
        }
        if (vuln.isPatchable) {
          //const patchLink = '[patch](https://support.snyk.io/hc/en-us/articles/360003891078-Snyk-patches-to-fix)'
        //   const patchId = vulns.patches.map((patch) => patch.id).join(', ');

          vulnerabilityLine += `\t+ Fixable by patch\n`;// ${patchLink}: ${patchId}\n`;
        }
      }
    });
  }

  // New license issues
  if (newLicenseIssues.length > 0) 
  {
    licenseLine += '## License\n';
    licenseLine += `${newLicenseIssues.length} issue${
      newLicenseIssues.length > 1 ? 's' : ''
    } found \n`;


    newLicenseIssues.forEach((issue, index) => {
      licenseLine += `  ${index + 1}/${newLicenseIssues.length}: 
      ${issue.title} 
      [${_.capitalize(issue.severity)} Severity]\n`;

      const paths = issue.from as Array<string>;

      licenseLine += `\t+ Via: ${paths.join(' => ')}\n`;
    });
  }

  allIssuesToDisplay += vulnerabilityLine + licenseLine;

  return allIssuesToDisplay;
};


export const createPrComment = async (
  snykDeltaResults: SnykDeltaOutput,
  ghDetails: ghDetails, 
  keepHistory: boolean
): Promise<ghPrCommentsStatus> => {

  const data = {body: `${formatPRComment(snykDeltaResults, (ghDetails.commitSha ? ghDetails.commitSha : ''))}`};

  const requestHeaders: Record<string, any> = {
    'Content-Type': 'application/json',
    Authorization: `token ${ghDetails.token}`,
  };

  const baseUrl = process.env.GH_API || 'https://api.github.com';

  const ghClient = axios.create({
    baseURL: baseUrl,
    responseType: 'json',
    headers: { ...requestHeaders },
  });

  let ghResponse;
  let firstComment = true;
  let commentUrl = `/repos/${ghDetails.orgName}/${ghDetails.repoName}/issues/${ghDetails.prNumber}/comments`;

  ghResponse = await ghClient.get(
    commentUrl
  );

  if ((ghResponse.data.length != 0) && !keepHistory) {
    ghResponse.data.map((comments: any) => {
      if (comments.body.includes('******* Vulnerabilities report for commit')) 
      {
        commentUrl = comments.url
        firstComment = false
      }
    }) 
  }

  debug(`Creating PR comment with url: ${commentUrl} keepHistory: ${keepHistory}`)
  debug(`first Snyk comment : ${firstComment}`)
  
  if (keepHistory == true || firstComment == true)
  {
    ghResponse = await ghClient.post(
      commentUrl,
      JSON.stringify(data),);
  } else {
    ghResponse = await ghClient.patch(
      commentUrl,
      JSON.stringify(data),);
  }

  return ghResponse.data as ghPrCommentsStatus
};

export const deletePrComment = async (
  ghDetails: ghDetails
) : Promise<ghPrCommentsStatus> => {

  const baseUrl = process.env.GH_API || 'https://api.github.com';
  const commentUrl = `/repos/${ghDetails.orgName}/${ghDetails.repoName}/issues/${ghDetails.prNumber}/comments`;
  let ghResponse;
  const commentUrlList: string[] = []

  const requestHeaders: Record<string, any> = {
    'Content-Type': 'application/json',
    Authorization: `token ${ghDetails.token}`,
  };

  const ghClient = axios.create({
    baseURL: baseUrl,
    responseType: 'json',
    headers: { ...requestHeaders },
  });

  ghResponse = await ghClient.get(
    commentUrl
  );

  // Need to get only the snyk comments
  if ((ghResponse.data.length != 0)) {
    ghResponse.data.map((comments: any) => {
      if (comments.body.includes('******* Vulnerabilities report for commit')) 
      {
        commentUrlList.push(comments.url)
      }
    }) 
  }

  // Delete them
  commentUrlList.forEach(async url => {
    debug(`Delete comment at url: ${url}`)
    ghResponse = await ghClient.delete(
      url);
  });

  return ghResponse.data as ghPrCommentsStatus
}