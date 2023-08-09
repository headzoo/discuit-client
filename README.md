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
  await discuit.comment(post.id, 'Welcome to the community!');
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

  await discuit.comment(post.id, 'Welcome to the community!');
});
```

Attaching a logger.
```typescript
import { Discuit } from '@headz/discuit';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    defaultMeta: { service: 'discuit' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ],
});

const discuit = new Discuit();
discuit.logger = logger;
```
