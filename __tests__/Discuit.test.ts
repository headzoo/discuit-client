import { describe } from 'node:test';
import { Discuit } from '../src/Discuit';
import { TestingFetch } from '../src/TestingFetch';
import { User } from '../src';

describe('Discuit', () => {
  /**
   *
   */
  it('login', async () => {
    const fetcher = new TestingFetch('POST', '/_login', async (req) => {
      if (req.body.username !== 'xxxx' || req.body.password !== 'xxxx') {
        throw new Error('Invalid username or password');
      }

      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    const user = await mock.login('xxxx', 'xxxx');
    expect(user).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('getMe', async () => {
    const fetcher = new TestingFetch('GET', '/_user', async () => {
      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    const user = await mock.getMe();
    expect(user).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('getComment', async () => {
    const fetcher = new TestingFetch('GET', '/comments/1', async () => {
      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    const comment = await mock.getComment('1');
    expect(comment).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('postComment', async () => {
    const fetcher = new TestingFetch('POST', '/posts/1/comments?userGroup=normal', async () => {
      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    mock.user = { id: '1' } as User;
    const comment = await mock.postComment('1', 'This is a test.');
    expect(comment).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('deleteComment', async () => {
    const fetcher = new TestingFetch('DELETE', '/posts/1/comments/1?deleteAs=normal', async () => {
      return true;
    });

    const mock: Discuit = new Discuit(fetcher);
    mock.user = { id: '1' } as User;
    const comment = await mock.deleteComment('1', '1');
    expect(comment).toEqual(true);
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('updateComment', async () => {
    const fetcher = new TestingFetch('PUT', '/posts/1/comments/1', async () => {
      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    mock.user = { id: '1' } as User;
    const comment = await mock.updateComment('1', '1', 'This is a test.');
    expect(comment).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('voteComment', async () => {
    const fetcher = new TestingFetch('POST', '/_commentVote', async (req) => {
      if (req.body.commentId !== '1' || req.body.up !== true) {
        throw new Error('Invalid commentId or vote');
      }

      return true;
    });

    const mock: Discuit = new Discuit(fetcher);
    mock.user = { id: '1' } as User;
    const comment = await mock.voteComment('1', true);
    expect(comment).toEqual(true);
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('getPost', async () => {
    const fetcher = new TestingFetch('GET', '/posts/1', async () => {
      return {
        id: '1',
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    const post = await mock.getPost('1');
    expect(post).toEqual({ id: '1' });
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('votePost', async () => {
    const fetcher = new TestingFetch('POST', '/_postVote', async (req) => {
      if (req.body.postId !== '1' || req.body.up !== true) {
        throw new Error('Invalid postId or vote');
      }

      return true;
    });

    const mock: Discuit = new Discuit(fetcher);
    mock.user = { id: '1' } as User;
    const post = await mock.votePost('1', true);
    expect(post).toEqual(true);
    expect(fetcher.requestCount).toEqual(1);
  });

  /**
   *
   */
  it('getPosts', async () => {
    const fetcher = new TestingFetch('GET', '/posts?sort=activity&limit=25', async () => {
      return {
        posts: [
          {
            id: '1',
          },
        ],
      };
    });

    const mock: Discuit = new Discuit(fetcher);
    const posts = await mock.getPosts('activity', 25);
    expect(fetcher.requestCount).toEqual(1);
    expect(posts).toEqual([
      {
        id: '1',
      },
    ]);
  });

  /**
   *
   */
  it('getPostComments', async () => {
    let fetcher = new TestingFetch('GET', '/posts/1/comments', async () => {
      return {
        comments: [
          {
            id: '1',
          },
        ],
      };
    });

    let mock: Discuit = new Discuit(fetcher);
    let comments = await mock.getPostComments('1');
    expect(fetcher.requestCount).toEqual(1);
    expect(comments).toEqual({
      comments: [
        {
          id: '1',
        },
      ],
    });

    fetcher = new TestingFetch('GET', '/posts/1/comments?next=2', async () => {
      return {
        comments: [
          {
            id: '1',
          },
        ],
      };
    });

    mock = new Discuit(fetcher);
    comments = await mock.getPostComments('1', '2');
    expect(fetcher.requestCount).toEqual(1);
    expect(comments).toEqual({
      comments: [
        {
          id: '1',
        },
      ],
    });

    fetcher = new TestingFetch('GET', '/posts/1/comments?next=2&parentId=3', async () => {
      return {
        comments: [
          {
            id: '1',
          },
        ],
      };
    });

    mock = new Discuit(fetcher);
    comments = await mock.getPostComments('1', '2', '3');
    expect(fetcher.requestCount).toEqual(1);
    expect(comments).toEqual({
      comments: [
        {
          id: '1',
        },
      ],
    });
  });
});
