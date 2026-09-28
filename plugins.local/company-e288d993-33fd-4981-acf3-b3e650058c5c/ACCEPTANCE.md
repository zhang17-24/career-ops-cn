# 理想汽车：开发验证完成，候选保持禁用

- 候选：`company-e288d993-33fd-4981-acf3-b3e650058c5c`。
- 续接核验：2026-09-13 15:46–15:51 UTC（北京时间 23:46–23:51）；匿名 HTTP 解析完成时间 `2026-09-13T15:50:50.915Z`。
- 仅本企业，校招与实习入口：`https://www.lixiang.com/employ/campus/list.html?fromJob=1`。
- 平台本轮提供的批准时间：`2026-09-13T15:45:55.769Z`，域名 `www.lixiang.com`、`api-web.lixiang.com`。原 ROUTE_REVIEW.json 保持原字节；其中“待审核”为历史证据文字，不代表当前仍未批准。
- 原路线审核记录保存在 ACCEPTANCE-route-history.md。没有历史 BLOCKED.md，也没有未解决开发阻塞。未修改旧版、绑定、信任、锁文件或其他企业。

## 方法、证据与结果

1. 技能中心返回 `[]`；按用户明确指定的项目适配技能、完整 SOP、Ego Browser 与 Ponytail full 操作。旧空间 59 已不存在，创建独立 Ego Lite 空间 64，不操作常驻用户页。
2. 已批准入口正常展示理想汽车品牌、“校园招聘与实习”和第一页十条岗位。页面有“登录”入口，但列表与三条详情均未强制登录、未出现验证码。初始异步空壳等待后正常显示。
3. 公开列表请求为 GET `https://api-web.lixiang.com/osd-hr-recruitment-website/v1/recruit/school/job-page?page=1&page_size=10`。此前已观察首屏 XHR，故选择 document-start preload；先 Page.enable，精确限定 documentUrl 与 endpoint，无忽略参数。首次本地辅助模块导入因 Ego 工作目录 URL 无效失败，尚未注册或导航；改成实际绝对 file URL 后正常。注册后重导航同一第一页，确实捕获 HTTP 200、业务 code=0 的 JSON；finally 删除预加载注册并停止内存捕获。未调用 getResponseBody、未重放捕获请求或读取请求头、Cookie、账户数据。
4. 最小结构：顶层 `data/code/message/trace_id`；data 为 `page/total_pages/items/total_count/page_size`。本次 page=1、page_size=10、total_pages=104、total_count=1031。trace_id 值不保存。items 公开岗位字段包括 `id/code/title/location_title/job_mode_name/hire_mode/first_job_function_title/second_job_function_title`，无详情 URL、描述或发布日期。
5. 岗位 DOM 为 `li.search-item`，没有职位 anchor。DOMDebugger 在标题上未发现直接事件；实际 DOM 的 React 公开事件属性显示卡片处理函数（仅查看该卡片局部导航，不遍历 bundle）：

   `function(){var e=t.id||t.job_id;window.open("".concat(window.location.origin,"/employ/detail/").concat(e,".html?jobCode=").concat(t.code))}`

   React searchItem 的前三项 id/code/title/location 与 JSON 首样本及列表一致。三个卡片各自滚入视口、等待布局，验证 bounding rectangle 在视口内且 elementFromPoint 命中后正常点击。每次检查 pageInfo 和 listTabs，切换新标签等页面加载；初始空白弹窗未当作站点失败。最终三条地址均在上述路由后由官网添加 `&fromJob=1`，解析器使用已实测的最终形式。每条读取完关闭详情标签。
6. 选择自建 API 固定 JSON 解析：接口和页面证据均指向理想自建招聘服务，没有公共 ATS 证据。无需 browserListing、inlineDetails 或访问 CDN 源码；已加载脚本域名未加入生产权限，生产不运行浏览器。不需要重复入口搜索或产品主页反向链。
7. Ego serverFetch 无请求头、凭证或初始化，对同一公开 endpoint 匿名 GET：先确认返回 JSON 字符串，再同页请求传给最终 parseJobs 进行完整映射校验，得到10条及下列前三项。没有分页或其他列表筛选请求。完整响应只在临时进程内存，不落盘。

## 三个真实详情

|字符串 ID / code|列表及详情名称|地点|实际点击后的详情 URL|可见描述核对|
|---|---|---|---|---|
|18450 / A250382|高速选址运营实习生|北京|https://www.lixiang.com/employ/detail/18450.html?jobCode=A250382&fromJob=1|可读；高速选址上会文档、流程及会议纪要，自建站数据库与竞对分析；要求数据处理、Excel/PPT。|
|18451 / A01544|充电网络工程供应管理实习生|上海|https://www.lixiang.com/employ/detail/18451.html?jobCode=A01544&fromJob=1|可读；甲供设备采购、备料、物流与订单管理，数据分析；要求供应链相关研究生、至少三个月实习。|
|18452 / A75376|电力大客户实习生|北京|https://www.lixiang.com/employ/detail/18452.html?jobCode=A75376&fromJob=1|可读；电费清分对账、结算、台账、地方电网关系维护；本科在读、电气专业优先。|

三条均显示对应标题、地点、职位描述与职位要求，无关闭/404/登录墙；ID 从列表数据与实际 URL 对照，code 与 URL jobCode 对照。详情 UI 没有单独显示数字 ID，不声称有独立可见编号标签。列表 API 无 description，故没有虚构 API/DOM 描述逐字比对；生产也不返回描述。仅三条抽样，不保证其他七条或所有1031条岗位仍可投递，未点击申请。

## 固定解析和边界

- `data.items[].id` → 字符串 id；小整数经安全整数校验后转为字符串，长 ID 必须是原始字符串，拒绝不安全 Number、重复编号、缺字段。
- title → title；location_title → location；company 固定为本企业；code 与 id 用已观察且三次点击确认的导航映射生成 URL。
- 不补日期、描述、其他字段；不按 entry.api 切换企业或主机。
- 硬上限第一页10条；即使 entry.max_pages=3 也只请求一次。不声称完整覆盖；分页元数据与条数不符报错。
- code 非0、异常响应、结构变化、网络错误均抛出；仅明确合法零总数空结果返回空数组，绝无 fixture/mock 兜底。

## 分阶段验证

- **离线测试：通过。** `node plugins.local/company-e288d993-33fd-4981-acf3-b3e650058c5c/test/smoke.mjs`。覆盖映射、字符串长编号、同名不同 ID、重复/不安全编号、空响应、结构和分页异常、网络失败传播及单页调用上限。fixture 只在测试文件，无网络。
- **静态检查：通过。** `node plugin-audit.mjs plugins.local/company-e288d993-33fd-4981-acf3-b3e650058c5c`；`node --check` 检查 index.mjs 与 test/smoke.mjs 均通过。
- **开发侧真实验证：通过上述一页列表与三条详情。** 匿名 HTTP 得到真实10条，并由最终固定解析器处理。该验证不等于平台独立验收。
- **启用及页面验收：未执行，待平台。** 候选保持禁用，未安装、未绑定、未运行 scan.mjs、verify-portals.mjs、批量扫描、AI 评估或投递。平台结束后独立验收，失败应保留旧绑定。
- 日常解析确定性、零模型 Token；本次 Agent 开发消耗开发 Token。未保存完整响应、凭证或个人资料。浏览器取证结束，任务空间按要求关闭。
