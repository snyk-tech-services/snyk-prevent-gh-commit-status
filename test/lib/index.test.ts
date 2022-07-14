import * as nock from 'nock';
import * as fs from 'fs';
import { main } from '../../src/lib/index';
import * as path from 'path';
import axios from 'axios';

const fixturesFolderPath = path.resolve(__dirname, '..') + '/fixtures/';

beforeAll(() => {
  return nock('https://snyk.io')
    .persist()
    .post(/^(?!.*xyz).*$/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/api/v1/org/playground/projects':
          return fs.readFileSync(
            fixturesFolderPath + 'api-response-projects-all-projects.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786/aggregated-issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apitest-gomod-aggregated.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787/aggregated-issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apitest-gomod-aggregated.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/aggregated-issues':
          return fs.readFileSync(
            fixturesFolderPath +
              '/api-response/test-goof-aggregated-one-vuln-one-license.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272790/aggregated-issues':
          return fs.readFileSync(
            fixturesFolderPath +
              '/api-response/test-goof-aggregated-one-vuln-one-license.json',
          );
        default:
      }
    })
    .get(/^(?!.*xyz).*$/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272788/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272790/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/dep-graph':
          return fs.readFileSync(
            fixturesFolderPath + 'goof-depgraph-from-api.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/issue/snyk:lic:npm:goof:GPL-2.0/paths?perPage=100&page=1':
          return fs.readFileSync(
            fixturesFolderPath + 'snyk-lic-npm-goof-GPL-2-0-issue-paths.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/issue/SNYK-JS-PACRESOLVER-1564857/paths?perPage=100&page=1':
          return fs.readFileSync(
            fixturesFolderPath + 'SNYK-JS-PACRESOLVER-1564857-issue-paths.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/issue/SNYK-JS-DOTPROP-543489/paths?perPage=100&page=1':
          return fs.readFileSync(
            fixturesFolderPath +
              'SNYK-JS-DOTPROP-543489-issue-paths-page1.json',
          );
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/issue/SNYK-JS-ACORN-559469/paths?perPage=100&page=1':
          return fs.readFileSync(
            fixturesFolderPath + 'SNYK-JS-ACORN-559469-issue-paths.json',
          );
        default:
      }
    });
});

const responseWithOneOtherComment = [
  {
    id: 1,
    body: '### Anything but a vulnerability summary *******',
    url: 'https://api.github.com/repos/124/124/issues/124/comments/1',
  },
];

const responseAfterComment = [
  {
    id: 1,
    body: '### ******* Vulnerabilities report for commit number 123 *******',
    url: 'https://api.github.com/repos/123/123/issues/123/comments/1',
  },
];
const responseBeforeComment: unknown[] = [];
let responseForComment = responseBeforeComment;
let firstPost = true;

beforeAll(() => {
  return nock('https://api.github.com')
    .persist()
    .get(/^(?!.*xyz).*$/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/repos/123/123/issues/123/comments':
          return responseForComment;
        case '/repos/124/124/issues/124/comments':
          return responseWithOneOtherComment;
        default:
          throw new Error('unexpected status GETing to Github');
      }
    })
    .post(/^(?!.*xyz).*$/)
    .reply(200, (uri, requestBody) => {
      switch (uri) {
        case '/repos/123/123/statuses/123':
          return requestBody;
        case '/repos/124/124/statuses/124':
          return requestBody;
        case '/repos/123/123/issues/123/comments':
          responseForComment = responseAfterComment;
          return requestBody;
        case '/repos/123/123/issues/123/comments/1':
          return requestBody;
        case '/repos/124/124/issues/124/comments':
          return requestBody;
        case '/repos/124/124/issues/124/comments/1':
          if (firstPost) {
            responseForComment = responseWithOneOtherComment;
            firstPost = false;
          }
          return requestBody;
        default:
          throw new Error('unexpected status POSTing to Github');
      }
    })
    .patch(/^(?!.*xyz).*$/)
    .reply(200, (uri, requestBody) => {
      switch (uri) {
        case '/repos/123/123/issues/123/comments/1':
          return requestBody;
        case '/repos/124/124/issues/124/comments/1':
          return requestBody;
        default:
          throw new Error('unexpected status PATCHing to Github');
      }
    })
    .delete(/^(?!.*xyz).*$/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/repos/123/123/issues/123/comments/1':
          responseForComment = responseBeforeComment;
          return;
        default:
          throw new Error('unexpected status DELETing to Github');
      }
    });
});

describe('Testing behaviors without issue', () => {
  test('[snyk-delta module] Is it working?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working with displayTargetFile?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-gomod-displayTargetFile.json',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working with --all-projects?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-gomod-all-projects.json',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working in debug?', async () => {
    process.env.SNYK_DEBUG = 'true';
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
      '',
      'keepHistory',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);
    delete process.env.SNYK_DEBUG;
  });

  test('[snyk-delta module] Is it working with --all-projects and unmonitored projects?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-gomod-all-projects-with-unmonitored-project.json',
      '123',
      '123',
      '123',
      '123',
      'https://job123',
      'keepHistory',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272788',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working with --all-projects and unmonitored projects without job link?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-gomod-all-projects-with-unmonitored-project.json',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272788',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working with unmonitored project and no vuln?', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-gomod-unmonitored.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      'setPassIfNoBaselineFlag',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        prComment: {},
      },
    ]);
  });
});

describe('Testing behaviors with issue(s)', () => {
  test('[snyk-delta module] Is it working with 1 issue without PR number', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-goof-with-one-more-vuln.json',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        prComment: {},
      },
    ]);
  });

  test('[snyk-delta module] Is it working with 2 issues with PR number', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with --all-projects with PR number and mixed results', async () => {
    // 2 projects, 1 without new issue and 1 with a new issue so we can verify that one commit status fails while the other one passes

    process.env.SNYK_DEBUG = 'true';
    const logConsoleStream = fs.createWriteStream('./logConsoleFile.log', {
      flags: 'a',
    });
    process.stderr._write = function(chunk, encoding, callback) {
      logConsoleStream.write(chunk, encoding, callback);
    };

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-all-projects-with-one-more-vuln-for-one-project-only.json',
      '123',
      '123',
      '123',
      '123',
      '123',
    ];
    const response = await main();

    delete process.env.SNYK_DEBUG;
    process.stderr.unpipe;

    try {
      const data = fs.readFileSync('./logConsoleFile.log', 'utf8');
      expect(data.includes('Deleting comments on PR')).toEqual(false);
    } catch (err) {
      console.error(err);
    }

    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - subfolder/package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272790',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issue Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => express-fileupload@0.0.5 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with --all-projects with PR number and mixed results and keepHistory', async () => {
    // 2 projects, 1 without new issue and 1 with a new issue so we can verify that one commit status fails while the other one passes

    process.env.SNYK_DEBUG = 'true';
    const logConsoleStream = fs.createWriteStream('./logConsoleFile.log', {
      flags: 'a',
    });
    process.stderr._write = function(chunk, encoding, callback) {
      logConsoleStream.write(chunk, encoding, callback);
    };

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-all-projects-with-one-more-vuln-for-one-project-only.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      'keepHistory',
    ];
    const response = await main();

    delete process.env.SNYK_DEBUG;
    process.stderr.unpipe;

    try {
      const data = fs.readFileSync('./logConsoleFile.log', 'utf8');
      expect(data.includes('Deleting comments on PR')).toEqual(false);
    } catch (err) {
      console.error(err);
    }

    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        prComment: {},
      },
      {
        status: {
          context: 'Snyk Prevent (playground - subfolder/package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272790',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issue Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => express-fileupload@0.0.5 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with 1 issue without PR number and update comment', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-goof-with-one-more-vuln.json',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    let response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        prComment: {},
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-goof-with-one-more-vuln-and-one-more-license2.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => express-fileupload@0.0.5 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with 1 issue and 1 previous non vulnerability summary comment', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '124',
      '124',
      '124',
      '124',
      '124',
    ];
    const response = await main();

    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 124 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working unmonitored project with vulnerabilities and option setPassIfNoBaselineFlag at true', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-goof-with-one-more-vuln-unmonitored.json',
      '124',
      '124',
      '124',
      '124',
      '124',
      'setPassIfNoBaselineFlag',
    ];
    const response = await main();

    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description:
            'Passing check as project is unmonitored - For information: issue(s) found for unmonitored project',
          state: 'success',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* INFORMATION ONLY *******
####  project is unmonitored (no baseline) ####
see https://github.com/snyk-tech-services/snyk-prevent-gh-commit-status#additional-option---debug for more information
### ******* Vulnerabilities report for commit number 124 *******
New Issue Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with monitored and unmonitored projects (--all-project) with vulnerabilities and option setPassIfNoBaselineFlag at true', async () => {
    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snyktest-all-projects-with-one-more-vuln-for-one-project-and-unmonitored.json',
      '124',
      '124',
      '124',
      '124',
      '124',
      'setPassIfNoBaselineFlag',
    ];
    const response = await main();

    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 124 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => express-fileupload@0.0.5 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description:
            'Passing check as project is unmonitored - For information: issue(s) found for unmonitored project',
          state: 'success',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* INFORMATION ONLY *******
####  project is unmonitored (no baseline) ####
see https://github.com/snyk-tech-services/snyk-prevent-gh-commit-status#additional-option---debug for more information
### ******* Vulnerabilities report for commit number 124 *******
New Issue Introduced!
## Security
1 issue found 
* 1/1: Regular Expression Denial of Service (ReDoS) [High Severity]
\t+ Via:   goof@0.0.3 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3
\t+ Fixed in: acorn, 5.7.4, 6.4.1, 7.1.1
\t+ Fixable by upgrade: @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);
  });

  test('[snyk-delta module] Is it working with remove PR comment and PR number', async () => {
    let response;

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);

    const requestHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: `token 123`,
    };

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      responseType: 'json',
      headers: { ...requestHeaders },
    });

    const commentUrl = `/repos/123/123/issues/123/comments`;

    const ghResponse = await ghClient.get(commentUrl);

    expect(ghResponse.data).toEqual([]);
  });

  test('[snyk-delta module] Is it working with remove PR comment without PR number', async () => {
    let response;

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      '',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);

    const requestHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: `token 123`,
    };

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      responseType: 'json',
      headers: { ...requestHeaders },
    });

    const commentUrl = `/repos/123/123/issues/123/comments`;

    const ghResponse = await ghClient.get(commentUrl);

    expect(ghResponse.data).toEqual([
      {
        id: 1,
        body:
          '### ******* Vulnerabilities report for commit number 123 *******',
        url: 'https://api.github.com/repos/123/123/issues/123/comments/1',
      },
    ]);
  });

  test('[snyk-delta module] Is it working with passing with failOn upgradable', async () => {
    let response;

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      'upgradable',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);

    const requestHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: `token 123`,
    };

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      responseType: 'json',
      headers: { ...requestHeaders },
    });

    const commentUrl = `/repos/123/123/issues/123/comments`;

    const ghResponse = await ghClient.get(commentUrl);

    expect(ghResponse.data).toEqual([
      {
        id: 1,
        body:
          '### ******* Vulnerabilities report for commit number 123 *******',
        url: 'https://api.github.com/repos/123/123/issues/123/comments/1',
      },
    ]);
  });
  test('[snyk-delta module] Is it working with failing with failOn patchable', async () => {
    let response;

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      'patchable',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {},
        /* eslint-enable no-useless-escape */
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);

    const requestHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: `token 123`,
    };

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      responseType: 'json',
      headers: { ...requestHeaders },
    });

    const commentUrl = `/repos/123/123/issues/123/comments`;

    const ghResponse = await ghClient.get(commentUrl);

    expect(ghResponse.data).toEqual([]);
  });

  test('[snyk-delta module] Is it working with passing with failOn all', async () => {
    let response;

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') +
        '/fixtures/snykTestOutput/test-goof-two-vuln-two-license.json',
      '123',
      '123',
      '123',
      '123',
      '123',
      'all',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - package-lock.json)',
          description: 'New issue(s) found',
          state: 'failure',
          // eslint-disable-next-line
          target_url: 'https://app.snyk.io/org/playground/projects',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `### ******* Vulnerabilities report for commit number 123 *******
New Issues Introduced!
## Security
1 issue found 
* 1/1: Prototype Pollution [Medium Severity]
\t+ Via:   goof@0.0.3 => snyk@1.228.3 => configstore@3.1.2 => dot-prop@4.2.0
\t+ Fixed in: dot-prop, 5.1.1
\t+ Fixable by upgrade: snyk@1.290.1
## License
1 issue found 
  1/1: 
      Artistic-2.0 license 
      [Medium Severity]
\t+ Via: goof@1.0.1 => npm@7.12.0
`,
        },
        /* eslint-enable no-useless-escape */
      },
    ]);

    process.argv = [
      '',
      '',
      path.resolve(__dirname, '..') + '/fixtures/snyktest-gomod.json',
      '123',
      '123',
      '123',
      '123',
    ];
    response = await main();
    expect(response).toEqual([
      {
        status: {
          context: 'Snyk Prevent (playground - go.mod)',
          description: 'No new issue found',
          state: 'success',
          // eslint-disable-next-line
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
        },
        prComment: {},
      },
    ]);

    const requestHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
      Authorization: `token 123`,
    };

    const ghClient = axios.create({
      baseURL: 'https://api.github.com',
      responseType: 'json',
      headers: { ...requestHeaders },
    });

    const commentUrl = `/repos/123/123/issues/123/comments`;

    const ghResponse = await ghClient.get(commentUrl);

    expect(ghResponse.data).toEqual([
      {
        id: 1,
        body:
          '### ******* Vulnerabilities report for commit number 123 *******',
        url: 'https://api.github.com/repos/123/123/issues/123/comments/1',
      },
    ]);
  });
});
