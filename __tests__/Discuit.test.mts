import { describe } from 'node:test';
import MockAdapter from 'axios-mock-adapter';
import { Discuit, axiosInstance } from '../src/Discuit.ts';

describe('Discuit', () => {
  let mock = new MockAdapter(axiosInstance, { onNoMatch: "passthrough" });

  beforeEach(() => {
    const mock = new MockAdapter(axiosInstance);
    mock.onGet('/_initial').reply(200, {}, {
      'csrf-token': 'xxxxxxxxxxxx',
    });
  });

  it('should be able to get a token', async () => {
    const client = new Discuit();
    const token = await client.getToken();
    expect(token).toBe('xxxxxxxxxxxx');
  });

  it('should be able to login', async () => {
    mock.onPost('/_login', { username: 'xxxx', password: 'xxxx' }).reply(200, {
      id: 1, name: "John Smith",
    });

    const client = new Discuit();
    client.debugging = true;
    const user = await client.login('xxxx', 'xxxx');
    expect(user).toBe('xxxxxxxxxxxx');
  });
});
