import * as nock from 'nock';
import * as fs from 'fs';
import { main } from '../../src/lib/index';
import * as path from 'path';

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
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272786/issues':
          return fs.readFileSync(fixturesFolderPath + 'apitest-gomod.json');
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272787/issues':
          return fs.readFileSync(fixturesFolderPath + 'apitest-gomod.json');
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789/issues':
          return fs.readFileSync(fixturesFolderPath + 'api-response-goof.json');
        case '/api/v1/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272790/issues':
          return fs.readFileSync(fixturesFolderPath + 'api-response-goof.json');
        default:
      }
    });
});

beforeAll(() => {
  return nock('https://api.github.com')
    .persist()
    .post(/^(?!.*xyz).*$/)
    .reply(200, (uri, requestBody) => {
      switch (uri) {
        case '/repos/123/123/statuses/123':
          return requestBody;
        case '/repos/123/123/issues/123/comments':
          return requestBody;
        case '/repos/123/123/issues/123/comments/1':
          return requestBody;
        default:
          throw new Error('unexpected status POSTing to Github');
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
        '/fixtures/snyktest-goof-with-one-more-vuln-and-one-more-license.json',
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
          target_url:
            'https://app.snyk.io/org/playground/project/09235fa4-c241-42c6-8c63-c053bd272789',
        },
        /* eslint-disable no-useless-escape */
        prComment: {
          body: `## Security
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

  test('[snyk-delta module] Is it working with --all-projects with PR number and mixed results', async () => {
    // 2 projects, 1 without new issue and 1 with a new issue so we can verify that one commit status fails while the other one passes
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
          body: `## Security
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
});
