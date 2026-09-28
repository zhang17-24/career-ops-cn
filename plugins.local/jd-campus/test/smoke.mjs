import assert from 'node:assert';
import { parseJdCampusPage } from '../index.mjs';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'jd-campus');

// The list payload shape observed live: { success: true, body: { totalNumber, pageCount, items: [...] } }.
// Each item carries the full JD (workContent + qualification) and requirementVoList[] with workCity "province-city".
const FIXTURE = [
  {
    publishId: 9329,           // number id — must be preserved as a string, never coerced through Number
    reqId: 2464,
    positionName: '销售拓展',
    jobDirection: '一线销售方向',
    publishTime: 1786938503000, // epoch ms
    workContent: '1.负责相应业务的销售拓展工作。\n2.对内跨部门协调。',
    qualification: '2026年10月1日至2027年9月30日期间毕业，统招大专及以上学历。',
    requirementVoList: [
      { workCity: '上海市-上海市', positionBg: '京东物流', interviewCity: '远程面试' },
      { workCity: '北京市-北京市', positionBg: '京东物流' },
      { workCity: '陕西省-西安市', positionBg: '京东物流' },
      { workCity: '上海市-上海市', positionBg: '京东物流' }, // duplicate city → dedup
    ],
  },
  {
    publishId: 9253,
    reqId: 2411,
    positionName: '医师（医美方向）',
    jobDirection: '临床技术方向',
    publishTime: 1786938503000,
    workContent: '1.负责医疗美容方向的诊疗工作。',
    qualification: '硕士及以上学历。',
    requirementVoList: [
      { workCity: '北京市-北京市', positionBg: '京东健康' },
    ],
  },
];

// Capture the request the adapter issues (URL + method + POST body) to assert the deterministic
// request shape without touching the network.
let lastUrl = '';
let lastOpts = null;
const fetchJson = async (url, opts) => {
  lastUrl = url;
  lastOpts = opts;
  return { success: true, body: { totalNumber: 126, pageCount: 0, items: FIXTURE } };
};

// 1. Field mapping: list payload → normalized Job[]; detail URL built from publishId.
const jobs = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  { fetchJson },
);

assert.deepEqual(jobs, [
  {
    title: '销售拓展',
    url: 'https://campus.jd.com/#/details?id=9329',
    company: '京东',
    location: '上海市/北京市/陕西省',
    postedAt: 1786938503000,
    description: '方向: 一线销售方向\n业务: 京东物流\n1.负责相应业务的销售拓展工作。\n2.对内跨部门协调。\n任职要求:\n2026年10月1日至2027年9月30日期间毕业，统招大专及以上学历。',
  },
  {
    title: '医师（医美方向）',
    url: 'https://campus.jd.com/#/details?id=9253',
    company: '京东',
    location: '北京市',
    postedAt: 1786938503000,
    description: '方向: 临床技术方向\n业务: 京东健康\n1.负责医疗美容方向的诊疗工作。\n任职要求:\n硕士及以上学历。',
  },
]);

// The numeric publishId is preserved as a string in the detail URL, not coerced into a number.
assert.equal(jobs[0].url.includes('details?id=9329'), true);
assert.equal(typeof jobs[0].url.split('id=')[1], 'string');

// 2. Request is a deterministic POST to the configured `api` with ?type=present and a JSON body.
assert.equal(lastUrl, 'https://campus.jd.com/api/wx/position/page?type=present');
assert.equal(lastOpts.method, 'POST');
assert.equal(lastOpts.headers['content-type'], 'application/json');
const body = JSON.parse(lastOpts.body);
assert.equal(body.pageSize, 10);
assert.equal(body.pageIndex, 0);
assert.deepEqual(body.parameter, {
  positionName: '',
  planIdList: [],
  jobDirectionCodeList: [],
  workCityCodeList: [],
  positionDeptList: [],
});

// 3. Empty result → no jobs, never a phantom row.
const empty = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  { fetchJson: async () => ({ success: true, body: { totalNumber: 0, pageCount: 0, items: [] } }) },
);
assert.deepEqual(empty, []);

// 4. Missing body/items → no jobs, no throw.
const noBody = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  { fetchJson: async () => ({ success: true, body: {} }) },
);
assert.deepEqual(noBody, []);

const noItems = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  { fetchJson: async () => ({ success: true }) },
);
assert.deepEqual(noItems, []);

// 5. Abnormal data → malformed rows are dropped, valid rows survive.
const abnormal = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  {
    fetchJson: async () => ({
      success: true,
      body: {
        totalNumber: 6,
        pageCount: 0,
        items: [
          { publishId: 1, positionName: '', requirementVoList: [{ workCity: '北京市-北京市' }] },   // no title → dropped
          { publishId: '', positionName: '缺 id', requirementVoList: [] },                          // no url-driving id → dropped
          { publishId: null, positionName: 'null id', requirementVoList: [] },                      // null id → dropped
          { positionName: '缺 publishId', requirementVoList: [] },                                  // no publishId → dropped
          { publishId: 789, positionName: '合法岗位', publishTime: 1786938503000, requirementVoList: [{ workCity: '广东省-深圳市' }] }, // valid → kept
          null,                                                                                     // null row → dropped
        ],
      },
    }),
  },
);
assert.deepEqual(abnormal, [
  {
    title: '合法岗位',
    url: 'https://campus.jd.com/#/details?id=789',
    company: '京东',
    location: '广东省',
    postedAt: 1786938503000,
    description: '',
  },
]);

// 6. parseJdCampusPage keeps the string id and reports total / location dedup.
const parsed = parseJdCampusPage(
  { success: true, body: { totalNumber: 126, pageCount: 0, items: FIXTURE } },
  '京东',
);
assert.equal(parsed.total, 126);
assert.equal(parsed.jobs.length, 2);
assert.equal(parsed.jobs[0].url, 'https://campus.jd.com/#/details?id=9329');
assert.equal(parsed.jobs[0].location, '上海市/北京市/陕西省');
assert.equal(typeof parsed.jobs[0].url.split('id=')[1], 'string');

// 7. Non-list / null body → empty, no throw.
assert.deepEqual(parseJdCampusPage({ success: true, body: null }, '京东'), { jobs: [], total: 0 });
assert.deepEqual(parseJdCampusPage({}, '京东'), { jobs: [], total: 0 });
assert.deepEqual(parseJdCampusPage(null, '京东'), { jobs: [], total: 0 });

// 8. Malformed items (non-array) → no jobs, no throw.
const malformed = await providerHooks.provider.fetch(
  { name: '京东', api: 'https://campus.jd.com/api/wx/position/page' },
  { fetchJson: async () => ({ success: true, body: { totalNumber: 3, items: 'oops' } }) },
);
assert.deepEqual(malformed, []);

console.log('✓ jd-campus provider fixture smoke ok');
