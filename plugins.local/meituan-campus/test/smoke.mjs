import assert from 'node:assert';
import { parseMeituanCampusResponse } from '../index.mjs';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'meituan-campus');

// The list payload shape observed live: { data: { list: [...], page: { totalCount } } }.
const FIXTURE = [
  {
    jobUnionId: '4721378720',           // string id — must never be coerced through Number
    name: '商业分析实习生（大模型应用BP）',
    cityList: [{ name: '北京市' }],
    department: [{ name: '核心本地商业-美团平台' }],
    jobFamily: '商业分析类',
    workYear: null,
    projectName: '校招',
    jobDuty: '1、参与大模型服务质量标准的制定，产出相应数据并持续优化生产效率；',
    jobRequirement: '本科及以上学历，熟悉数据分析。',
    refreshTime: 1788951641000,
  },
  {
    jobUnionId: '4758327812',
    name: '【实习】Keeta-后台产品实习生',
    cityList: [{ name: '北京市' }, { name: '上海市' }],
    department: [{ name: 'Keeta' }],
    jobFamily: '产品类',
    workYear: null,
    projectName: '',
    jobDuty: '',
    jobRequirement: '',
    refreshTime: 1788946112000,
  },
];

// Capture the request the adapter issues (URL + POST body) to assert the deterministic
// request shape without touching the network.
let lastUrl = '';
let lastOpts = null;
const fetchJson = async (url, opts) => {
  lastUrl = url;
  lastOpts = opts;
  return { status: 0, data: { list: FIXTURE, page: { totalCount: 608 } } };
};

// 1. Field mapping: list payload → normalized Job[], detail URL built from jobUnionId.
const jobs = await providerHooks.provider.fetch(
  { name: '美团', api: 'https://zhaopin.meituan.com/api/official/job/getJobList' },
  { fetchJson },
);

assert.deepEqual(jobs, [
  {
    title: '商业分析实习生（大模型应用BP）',
    url: 'https://zhaopin.meituan.com/web/position/detail?jobUnionId=4721378720&highlightType=campus',
    company: '美团',
    location: '北京市',
    postedAt: 1788951641000,
    description: '部门: 核心本地商业-美团平台\n序列: 商业分析类\n项目: 校招\n1、参与大模型服务质量标准的制定，产出相应数据并持续优化生产效率；\n本科及以上学历，熟悉数据分析。',
  },
  {
    title: '【实习】Keeta-后台产品实习生',
    url: 'https://zhaopin.meituan.com/web/position/detail?jobUnionId=4758327812&highlightType=campus',
    company: '美团',
    location: '北京市/上海市',
    postedAt: 1788946112000,
    description: '部门: Keeta\n序列: 产品类',
  },
]);

// The long pure-digit id is preserved as a string, not coerced into a number.
assert.equal(jobs[0].url.includes('jobUnionId=4721378720'), true);
assert.equal(typeof jobs[0].url.split('jobUnionId=')[1].split('&')[0], 'string');

// 2. Request is a deterministic POST to the configured `api` with a JSON body.
assert.equal(lastUrl, 'https://zhaopin.meituan.com/api/official/job/getJobList');
assert.equal(lastOpts.method, 'POST');
assert.equal(lastOpts.headers['content-type'], 'application/json');
const body = JSON.parse(lastOpts.body);
assert.equal(body.page.pageNo, 1);
assert.equal(body.page.pageSize, 100);
assert.equal(body.jobShareType, '1');
assert.equal(body.keywords, '');
assert.deepEqual(body.jobType, [{ code: '1', subCode: [] }, { code: '2', subCode: [] }]);
assert.deepEqual(body.cityList, []);
assert.deepEqual(body.specialCode, []);

// 3. Empty result → no jobs, never a phantom row.
const empty = await providerHooks.provider.fetch(
  { name: '美团', api: 'https://zhaopin.meituan.com/api/official/job/getJobList' },
  { fetchJson: async () => ({ status: 0, data: { list: [], page: { totalCount: 0 } } }) },
);
assert.deepEqual(empty, []);

// 4. Missing list → no jobs, no throw.
const noList = await providerHooks.provider.fetch(
  { name: '美团', api: 'https://zhaopin.meituan.com/api/official/job/getJobList' },
  { fetchJson: async () => ({ status: 0, data: {} }) },
);
assert.deepEqual(noList, []);

// 5. Abnormal data → malformed rows are dropped, valid rows survive.
const abnormal = await providerHooks.provider.fetch(
  { name: '美团', api: 'https://zhaopin.meituan.com/api/official/job/getJobList' },
  {
    fetchJson: async () => ({
      status: 0,
      data: {
        list: [
          { jobUnionId: '1', name: '', cityList: [{ name: '北京' }] },          // no title → dropped
          { jobUnionId: '', name: '缺 id', cityList: [{ name: '上海' }] },       // no url-driving id → dropped
          { jobUnionId: null, name: 'null id', cityList: [{ name: '广州' }] },   // null id → dropped
          { name: '合法岗位', cityList: [{ name: '深圳' }], refreshTime: 1788951641000 },  // no id → dropped
          { jobUnionId: '789', name: '合法岗位', cityList: [{ name: '深圳' }], refreshTime: 1788951641000 }, // valid → kept
          null,                                                                 // null row → dropped
        ],
        page: { totalCount: 6 },
      },
    }),
  },
);
assert.deepEqual(abnormal, [
  {
    title: '合法岗位',
    url: 'https://zhaopin.meituan.com/web/position/detail?jobUnionId=789&highlightType=campus',
    company: '美团',
    location: '深圳',
    postedAt: 1788951641000,
    description: '',
  },
]);

// 6. Malformed payload (non-list) → no jobs, no throw.
const malformed = await providerHooks.provider.fetch(
  { name: '美团', api: 'https://zhaopin.meituan.com/api/official/job/getJobList' },
  { fetchJson: async () => ({ status: 0, data: { list: 'oops' } }) },
);
assert.deepEqual(malformed, []);

// 7. parseMeituanCampusResponse keeps the string id and reports total.
const parsed = parseMeituanCampusResponse(
  { data: { list: FIXTURE, page: { totalCount: 608 } } },
  '美团',
);
assert.equal(parsed.total, 608);
assert.equal(parsed.jobs.length, 2);
assert.equal(parsed.jobs[0].url, 'https://zhaopin.meituan.com/web/position/detail?jobUnionId=4721378720&highlightType=campus');

// 8. Non-list / null data → empty, no throw.
assert.deepEqual(parseMeituanCampusResponse({ data: null }, '美团'), { jobs: [], total: 0 });
assert.deepEqual(parseMeituanCampusResponse({}, '美团'), { jobs: [], total: 0 });

console.log('✓ meituan-campus provider fixture smoke ok');
