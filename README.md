Discuit Client
==============

## Install
```
yarn add @headz/discuit
```

## Usage
```typescript
import { Discuit } from '@headz/discuit';

const discuit = new Discuit();
await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);

// Get the latest posts.
const posts = await discuit.getPosts('latest', 50);
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
}
```

Using the watch method.
```typescript
import { Discuit } from '@headz/discuit';

const communities = ['news', 'politics', 'sports'];

const discuit = new Discuit();
await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);

// Watch for new posts in the communities.
discuit.watch(communities, async (community, post) => {
  console.log(community, post);

  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
});
```

Configuration
```typescript
import { Discuit } from '@headz/discuit';
import winston from 'winston';

const discuit = new Discuit();

// Attach a logger.
discuit.logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    defaultMeta: { service: 'discuit' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ],
});

// Configure how often the watch() command checks for new posts.
// Don't set this too low or discuit will rate limit the bot.
discuit.watchInterval = 1000 * 60 * 10 // 10 minutes

// How long to wait between callbacks in the watch loop.
discuit.sleepPeriod = 5000;
```
