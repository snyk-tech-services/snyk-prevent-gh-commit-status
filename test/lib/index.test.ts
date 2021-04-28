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
        case '/api/v1/org/Playground/projects':
          return fs.readFileSync(
            fixturesFolderPath + 'api-response-projects-all-projects.json',
          );
        case '/api/v1/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786/issues':
          return fs.readFileSync(fixturesFolderPath + 'apitest-gomod.json');
        case '/api/v1/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272787/issues':
          return fs.readFileSync(fixturesFolderPath + 'apitest-gomod.json');
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
        default:
          throw new Error('unexpected status POSTing to Github');
      }
    });
});

describe('Testing behaviors', () => {
  test('Is it working?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
      },
    ]);
  });

  test('Is it working with displayTargetFile?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
      },
    ]);
  });

  test('Is it working with --all-projects?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
      },
      {
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272787',
      },
    ]);
  });

  test('Is it working in debug?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
      },
    ]);
    delete process.env.SNYK_DEBUG;
  });

  test('Is it working with --all-projects and unmonitored projects?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url: 'https://job123',
      },
      {
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url: 'https://job123',
      },
      {
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url: 'https://job123',
      },
    ]);
  });

  test('Is it working with --all-projects and unmonitored projects without job link?', async () => {
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
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786',
      },
      {
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272787',
      },
      {
        context: 'Snyk Prevent (Playground - go.mod)',
        description: 'No new issue found',
        state: 'success',
        // eslint-disable-next-line
        target_url:
          'https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272788',
      },
    ]);
  });
});
