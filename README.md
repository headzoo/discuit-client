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

// Get the user's notifications.
const notifications = await discuit.getNotifications();
console.log(notifications);

for (let i = 0; i < notifications.length; i++) {
  const notification = notifications[i];
  await discuit.markNotificationAsSeen(notification.id);
  await discuit.deleteNotification(notification.id);
}

await discuit.deleteAllNotifications();
```

Using the watch method.
```typescript
import { Discuit } from '@headz/discuit';

const communities = ['news', 'politics', 'sports'];

const discuit = new Discuit();
await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);

// Watch for new posts in the communities.
discuit.watchPosts(communities, async (community, post) => {
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

## Methods
The library is still in development, so the API is subject to change.

### login(username: string, password: string): Promise<void>

```typescript
import { Discuit } from '@headz/discuit';

const discuit = new Discuit();
await discuit.login('DISCUIT_USERNAME', 'DISCUIT_PASSWORD');
```

### getMe(): Promise<User | null>

```typescript
const user = await discuit.getMe();
```

### getCommunities(): Promise<Community[]>

```typescript
const communities = await discuit.getCommunities();
```

### getPosts(sort: string, limit: number): Promise<Post[]>

```typescript
const posts = await discuit.getPosts('latest', 50);
```

### getPost(publicId: string): Promise<Post | null>

```typescript
const post = await discuit.getPost('12345');
```

### getNotifications(): Promise<Notification[]>

```typescript
const notifications = await discuit.getNotifications();
```

### markNotificationAsSeen(id: number): Promise<void>

```typescript
await discuit.markNotificationAsSeen(80155);
```

### deleteNotification(id: number): Promise<void>

```typescript
await discuit.deleteNotification(80155);
```

### deleteAllNotifications(): Promise<void>

```typescript
await discuit.deleteAllNotifications();
```

### getComment(id: string): Promise<Comment | null>

```typescript
const comment = await discuit.getComment('12345');
```

### postComment(publicId: number, content: string): Promise<Comment>

```typescript
const comment = await discuit.postComment(12345, 'Welcome to the community!');
```

### updateComment(publicId: string, commentId: string, content: string): Promise<Comment>

```typescript
const comment = await discuit.updateComment('12345', '67890', 'Welcome to the community!');
```

### deleteComment(postId: number, commentId: number): Promise<void>

```typescript
await discuit.deleteComment(12345, 67890);
```

### watchPosts(communities: string[], callback: (community: string, post: Post) => void): Promise<void>

```typescript
discuit.watchPosts(['news', 'politics', 'sports'], async (community, post) => {
  console.log(community, post);

  const comment = await discuit.postComment(post.id, 'Welcome to the community!');
  await discuit.deleteComment(comment.postId, comment.id);
});
```

### voteComment(commentId: string, up: boolean): Promise<boolean>

```typescript
await discuit.voteComment('12345', true);
```
