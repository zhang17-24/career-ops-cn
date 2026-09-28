import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'tenxun');

// Capture the request the adapter issues (URL + POST body) so we can assert the
// deterministic request shape without touching the network.
let lastUrl = '';
let lastOpts = null;
const fetchJson = async (url, opts) => {
  lastUrl = url;
  lastOpts = opts;
  return { status: 0, data: { positionList: FIXTURE } };
};

// 1. Field mapping: list payload → normalized Job[], jobdesc URL built from postId.
const FIXTURE = [
  {
    positionTitle: 'AI全栈工程师',
    workCities: '深圳总部 北京 上海 广州 成都 杭州 ',
    positionUrl: null,
    postId: '1282707398326592512',
    projectName: '应届毕业生',
  },
  {
    positionTitle: '直链岗位',
    workCities: '上海',
    positionUrl: 'https://join.qq.com/post.html?postId=9',
    postId: 'any',
  },
];

const jobs = await providerHooks.provider.fetch(
  { api: 'https://join.qq.com/api/v1/position/searchPosition', keyword: '' },
  { fetchJson },
);

assert.deepEqual(jobs, [
  {
    title: 'AI全栈工程师',
    url: 'https://join.qq.com/post_detail.html?postid=1282707398326592512',
    company: '腾讯',
    location: '深圳总部 北京 上海 广州 成都 杭州',
  },
  {
    title: '直链岗位',
    url: 'https://join.qq.com/post.html?postId=9',
    company: '腾讯',
    location: '上海',
  },
]);

// Request is a deterministic POST to the configured `api` with a JSON body.
assert.equal(lastUrl, 'https://join.qq.com/api/v1/position/searchPosition');
assert.equal(lastOpts.method, 'POST');
assert.equal(lastOpts.headers['Content-Type'], 'application/json');
const body = JSON.parse(lastOpts.body);
assert.equal(body.pageIndex, 1);
assert.equal(body.pageSize, 100);
assert.equal(body.keyword, '');
assert.equal(body.workCountryType, 1);

// 2. Empty result → no jobs, never a phantom row.
const empty = await providerHooks.provider.fetch(
  { api: 'https://join.qq.com/api/v1/position/searchPosition' },
  { fetchJson: async () => ({ status: 0, data: { positionList: [] } }) },
);
assert.deepEqual(empty, []);
const noData = await providerHooks.provider.fetch(
  { api: 'https://join.qq.com/api/v1/position/searchPosition' },
  { fetchJson: async () => ({ status: 0 }) },
);
assert.deepEqual(noData, []);

// 3. Abnormal data → malformed rows are dropped, valid rows survive.
const abnormal = await providerHooks.provider.fetch(
  { api: 'https://join.qq.com/api/v1/position/searchPosition' },
  {
    fetchJson: async () => ({
      status: 0,
      data: {
        positionList: [
          { positionTitle: '缺 postId', workCities: '北京', postId: '' },   // no URL → dropped
          { positionTitle: '', workCities: '上海', postId: '123' },          // no title → dropped
          { title: 'no positionTitle', workCities: '广州', postId: '456' },  // wrong key → dropped
          { positionTitle: '合法岗位', workCities: '深圳 ', postId: '789' },  // valid → kept
          null,                                                              // null row → dropped
        ],
      },
    }),
  },
);
assert.deepEqual(abnormal, [
  { title: '合法岗位', url: 'https://join.qq.com/post_detail.html?postid=789', company: '腾讯', location: '深圳' },
]);

// 4. Malformed payload (non-list) → no jobs, no throw.
const malformed = await providerHooks.provider.fetch(
  { api: 'https://join.qq.com/api/v1/position/searchPosition' },
  { fetchJson: async () => ({ status: 0, data: { positionList: 'oops' } }) },
);
assert.deepEqual(malformed, []);

console.log('✓ provider fixture smoke ok');
