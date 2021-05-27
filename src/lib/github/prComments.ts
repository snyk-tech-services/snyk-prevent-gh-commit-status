import { SnykDeltaOutput } from 'snyk-delta';
import { ghDetails, ghPrCommentsStatus } from './types';
import axios from 'axios';
import * as _ from 'lodash';

export const createPrComment = async (
  snykDeltaResults: SnykDeltaOutput,
  ghDetails: ghDetails,
): Promise<ghPrCommentsStatus> => {
  const data = {body: `${formatPRComment(snykDeltaResults)}`};

  const requestHeaders: Object = {
    'Content-Type': 'application/json',
    Authorization: `token ${ghDetails.token}`,
  };

  const baseUrl = process.env.GH_API || 'https://api.github.com';

  const ghClient = axios.create({
    baseURL: baseUrl,
    responseType: 'json',
    headers: { ...requestHeaders },
  });

  const ghResponse = await ghClient.post(
    `/repos/${ghDetails.orgName}/${ghDetails.repoName}/issues/${ghDetails.prNumber}/comments`,
    JSON.stringify(data),
  );

  return ghResponse.data as ghPrCommentsStatus
};

const formatPRComment = (snykDeltaResults: SnykDeltaOutput): string => {
  const newVulns = snykDeltaResults.newVulns || [];
  const newLicenseIssues = snykDeltaResults.newLicenseIssues || [];


  let allIssuesToDisplay = '';
  let vulnerabilityLine = '';
  let licenseLine = '';

  if (newVulns.length + newLicenseIssues.length > 1) {
    allIssuesToDisplay = '#New Issues Introduced\n';
  } else {
    allIssuesToDisplay = '#New Issue Introduced\n';
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

      let paths = vuln.from as Array<string>;

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

      let paths = issue.from as Array<string>;

      licenseLine += `\t+ Via: ${paths.join(' => ')}\n`;
    });
  }

  allIssuesToDisplay = vulnerabilityLine + licenseLine;

  return allIssuesToDisplay;
};
