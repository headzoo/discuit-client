Discuit Client
==============

## Install
```
yarn add @headz/discuit
```

## Usage
```js
import { Discuit } from '@headz/discuit';

const discuit = new Discuit();
const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
const posts = await discuit.getPosts('latest', 50);
```
