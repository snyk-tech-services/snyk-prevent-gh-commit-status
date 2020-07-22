[![Known Vulnerabilities](https://snyk.io/test/github/snyk-tech-services/snyk-prevent-gh-commit-status/badge.svg)](https://snyk.io/test/github/snyk-tech-services/snyk-prevent-gh-commit-status)


## snyk-prevent-gh-commit-status
Little module to POST commit status of a PR the result of [snyk-delta](https://github.com/snyk-tech-services/snyk-delta) executed in the CI.

![](https://storage.googleapis.com/snyk-technical-services.appspot.com/gh_commit_status.png)

## Usage
1. In your CI pipeline, run the SNYK CLI or Orb or plugin with the option to export the json result into a file (`--json-output-file=snykTestResults.json`).

2. Call snyk-prevent-gh-commit-status module or binary with the following arguments:

```
snyk-prevent-gh-commit-status-linux
 /path/to/snykTestResults.json 
 <GITHUB_TOKEN> 
 <GH_ORG_NAME> 
 <GH_REPO_NAME> 
 <GH_COMMIT_SHA1>
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
    - run: ./snyk-prevent-gh-commit-status-linux ./snykTestResults.json ${GITHUB_TOKEN} ${CIRCLE_PROJECT_USERNAME} ${CIRCLE_PROJECT_REPONAME} ${CIRCLE_SHA1}
```

More CI examples soon


#### Additional option - Debug
```
./snyk-prevent-gh-commit-status-linux 
    ./snykTestResults.json 
    <GITHUB_TOKEN> 
    <GH_ORG_NAME> 
    <GH_REPO_NAME> 
    <CIRCLE_SHA1>
    debug
```