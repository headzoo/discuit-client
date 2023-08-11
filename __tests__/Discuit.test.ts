import { describe } from 'node:test';
import { Discuit } from '../src/Discuit';
import { TestingFetch } from '../src/TestingFetch';

describe('Discuit', () => {
  it('should be able to login', async () => {
    const mock: Discuit = new Discuit(
      new TestingFetch('POST', '/_login', async (body: any) => {
        if (body.username !== 'xxxx' || body.password !== 'xxxx') {
          return Promise.resolve({
            statusCode: 401,
            data: {},
            headers: {},
          });
        }

        return Promise.resolve({
          statusCode: 200,
          data: {
            id: '1',
          },
          headers: {},
        });
      }),
    );

    const user = await mock.login('xxxx', 'xxxx');
    expect(user).toEqual({ id: '1' });
  });
});
