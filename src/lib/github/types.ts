
export interface ghDetails {
    orgName: string,
    repoName: string,
    commitSha?: string,
    prNumber?: string,
    token: string
}

export enum ghCommitStatusState {
    'error' = 'error',
    'failure' = 'failure',
    'pending' = 'pending',
    'success' = 'success',
  }

export interface ghCommitStatus {
    state: ghCommitStatusState;
    target_url: string;
    description: string;
    context: string;
}

export interface ghPrCommentsStatus {

}

export interface ghActivity {
    status: ghCommitStatus,
    prComment: ghPrCommentsStatus
}

