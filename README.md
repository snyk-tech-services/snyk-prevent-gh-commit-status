[![Known Vulnerabilities](https://snyk.io/test/github/snyk-tech-services/snyk-prevent-gh-commit-status/badge.svg)](https://snyk.io/test/github/snyk-tech-services/snyk-prevent-gh-commit-status)
[![CircleCI](https://circleci.com/gh/snyk-tech-services/snyk-prevent-gh-commit-status.svg?style=svg)](https://circleci.com/gh/snyk-tech-services/snyk-prevent-gh-commit-status)
[![Not Maintained](https://img.shields.io/badge/Maintenance%20Level-Not%20Maintained-yellow.svg)](https://gist.github.com/cheerfulstoic/d107229326a01ff0f333a1d3476e068d)

**This repository is not in active development and critical bug fixes only will be considered.**

## snyk-prevent-gh-commit-status
Little module to POST commit status of a PR the result of [snyk-delta](https://github.com/snyk-tech-services/snyk-delta) executed in the CI.

![](https://storage.googleapis.com/snyk-technical-services.appspot.com/gh_commit_status.png)

## Installation
- `npm i -g snyk-prevent-gh-commit-status`\
OR
- Don't install anything and use npx (if you're in Node ecosystem already)\
OR
- Download [release binaries for your system](https://github.com/snyk-tech-services/snyk-prevent-gh-commit-status/releases)

## Usage
1. In your CI pipeline, run the SNYK CLI or Orb or plugin with the option to export the json result into a file (`--json-file-output=snykTestResults.json`).

2. Call snyk-prevent-gh-commit-status module or binary with the following arguments:

The link to CI Job is strongly recommended as it guides developers to the result set in the CI job.
Enhancements are coming up to improve visibility and clarity on the issues findings.

```
snyk-prevent-gh-commit-status-linux
 /path/to/snykTestResults.json
 <GITHUB_TOKEN>
 <GH_ORG_NAME>
 <GH_REPO_NAME>
 <GH_COMMIT_SHA1>
 <GH_PR_NUMBER>
 <LINK_TO_CI_JOB - optional>
 <keepHistory - optional - if set the tool will post a new comment at each run otherwise it will update the existing comment>
```
### Snyk CLI in bash
```
> snyk test --json-file-output=snykTestResults.json || true
> ./snyk-prevent-gh-commit-status-linux
    ./snykTestResults.json
    <GITHUB_TOKEN>
    <GH_ORG_NAME>
    <GH_REPO_NAME>
    <CIRCLE_SHA1>
    <GH_PR_NUMBER>
    <LINK_TO_CI_JOB - optional>
    <keepHistory - optional>
```

### Snyk CLI in bash using npx
```
> snyk test --json-file-output=snykTestResults.json || true
> npx snyk-prevent-gh-commit-status
    ./snykTestResults.json
    <GITHUB_TOKEN>
    <GH_ORG_NAME>
    <GH_REPO_NAME>
    <CIRCLE_SHA1>
    <GH_PR_NUMBER>
    <LINK_TO_CI_JOB - optional>
    <keepHistory - optional>
```

### Circle CI
Example in CircleCI using an Orb for a Go Modules project [example PR](https://github.com/snyk-tech-services/jira-tickets-for-new-vulns/pull/29/files)
```
    - checkout
    - run: go test -v
    - snyk/scan:
        fail-on-issues: false
        monitor-on-build: false
        token-variable: SNYK_TOKEN
        additional-arguments: --json-file-output=snykTestResults.json
    - run: ./snyk-prevent-gh-commit-status-linux ./snykTestResults.json ${GITHUB_TOKEN} ${CIRCLE_PROJECT_USERNAME} ${CIRCLE_PROJECT_REPONAME} ${CIRCLE_SHA1} ${CIRCLE_PULL_REQUEST} ${CIRCLE_BUILD_URL}
```
>   CIRCLE_PULL_REQUEST will be a randomly selected PR if you have more than one. Be careful selecting the value



More CI examples soon

### Point to GHE
export GH_API='https://ghe-hostname/apiendpoint'

#### Additional option to enable snykDelta Debug
```
export SNYK_DEBUG=true
./snyk-prevent-gh-commit-status-linux
    ./snykTestResults.json
    <GITHUB_TOKEN>
    <GH_ORG_NAME>
    <GH_REPO_NAME>
    <CIRCLE_SHA1>
    <GH_PR_NUMBER>
    <LINK_TO_CI_JOB - optional>
    <keepHistory - optional>
    <setPassIfNoBaselineFlag - optional>
```

#### No baseline
In case of an unmonitored project, it is possible to force the snyk-delta result so snyk-prevent-gh-commit-status will not fail.
If some vulnerabilities are found comment listing the vulnerabilities will still be the post on the PR.

#### Debug
use DEBUG=snyk* to enable snyk-prevent-gh-commit-status
```
DEBUG=snyk* ./snyk-prevent-gh-commit-status-linux
    ./snykTestResults.json
    <GITHUB_TOKEN>
    <GH_ORG_NAME>
    <GH_REPO_NAME>
    <CIRCLE_SHA1>
    <GH_PR_NUMBER>
    <LINK_TO_CI_JOB - optional>
    <keepHistory - optional>
    <setPassIfNoBaselineFlag - optional>
```

or to enable both snykDelta and snyk-prevent-gh-commit-status debug

```
export SNYK_DEBUG=true
DEBUG=snyk* ./snyk-prevent-gh-commit-status-linux
    ./snykTestResults.json
    <GITHUB_TOKEN>
    <GH_ORG_NAME>
    <GH_REPO_NAME>
    <CIRCLE_SHA1>
    <GH_PR_NUMBER>
    <LINK_TO_CI_JOB - optional>
    <keepHistory - optional>
    <setPassIfNoBaselineFlag - optional>
```
