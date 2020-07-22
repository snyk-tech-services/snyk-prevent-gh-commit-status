import * as nock from 'nock';
import * as fs from 'fs';
import {main} from '../../src/lib/index'
import { request } from 'http';

const fixturesFolderPath = '/home/antoine/Documents/SnykTSDev/snyk-prevent-gh-commit-status/test/fixtures/';

beforeAll(() => {
  return nock('https://snyk.io')
    .persist()
    .post(/^(?!.*xyz).*$/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/api/v1/org/Playground/projects':
          return fs.readFileSync(
            fixturesFolderPath + 'api-response-projects.json',
          );
        case '/api/v1/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786/issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apitest-gomod.json',
          );
        default:
      }
    });
});

beforeAll(() => {
  return nock('https://api.github.com')
    .persist()
    .post(/^(?!.*xyz).*$/)
    .reply(200, (uri, requestBody) => {
      switch(uri){
        case '/repos/123/123/statuses/123':
          return requestBody
        default:
          throw new Error('unexpected status POSTing to Github')
      }
    });
});


describe('Testing behaviors', () => {
  test('Is it working?', async () => {
    process.argv = ['','','/home/antoine/Documents/SnykTSDev/snyk-prevent-gh-commit-status/test/fixtures/snyktest-gomod.json','123','123','123','123']
    const response = await main()
    expect(response).toEqual({
                              "context": "Snyk Prevent (Playground)",
                             "description": "No new issue found", 
                             "state": "success", 
                             "target_url": "https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786"
    })
  });
  
  test('Is it working in debug?', async () => {
    process.argv = ['','','/home/antoine/Documents/SnykTSDev/snyk-prevent-gh-commit-status/test/fixtures/snyktest-gomod.json','123','123','123','123','debug']
    const response = await main()
    expect(response).toEqual({
                              "context": "Snyk Prevent (Playground)",
                             "description": "No new issue found", 
                             "state": "success", 
                             "target_url": "https://app.snyk.io/org/Playground/project/09235fa4-c241-42c6-8c63-c053bd272786"
    })
  });
})

