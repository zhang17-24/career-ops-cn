# 吉比特候选：只读路线发现，未完成开发验收

候选：company-243ef6bd-bafc-4c7c-8f96-fb93be905d21
核验时间：2026-09-12T09:54:06Z（北京时间17:54）

## 入口与证据

- 配置校招入口：https://campus.gbits.com/ ，Ego Lite 显示 ERR_CONNECTION_CLOSED。是连接失败，不是岗位关闭。
- 只进行一次 Bing「吉比特 官网 招聘」搜索，仅用于取得官网导航线索；未作为岗位证据。
- 读取三个官方/导航页面：https://www.g-bits.com/en/ → https://www.g-bits.com/en/join.html?page=2 → https://hr.g-bits.com/web/index.html#/home-web/home-index 。实际href与关系证据见 ROUTE_REVIEW.json。
- 官网英文正文列出公司全称、证券代码603444及雷霆子公司关系。招聘首页标题为「吉比特&雷霆游戏校园招聘」，页脚列出厦门吉比特网络技术股份有限公司；页面显示2027秋季校招说明。页面存在登录按钮，但公开首页可读，未出现强制登录或验证码。
- 首页实际XHR包括 joinserverfast.g-bits.com 下 humanResource/recruitmentExtranet/ExtrannetHomePage/queryHomePage、queryProjectList、queryQqInfo，以及 humanResource/recruitmentExtranet/postManage/queryExternalGameProject。仅观察资源URL，没有重放请求、保存完整响应或读取凭证；尚未确定岗位列表接口、请求方法和字段映射。
- 另观察到 https://pt.g-bits.com:8444/adm/din/record/getServerTime；未纳入申请，非标准端口不满足SOP范围，也无证据证明它是岗位数据必要依赖。

## 开发与离线验证

因入口和域名变化须先审核，未修改生成的生产解析器或测试。模板fixture通过只能说明模板运行，不证明真实字段映射、长编号、分页或错误处理已完成。待审核后实现固定解析器及要求的零网络用例。检查结果见下方追加记录。

## 真实岗位验证

实际岗位列表请求：未执行。真实详情：0/3，未访问详情；没有可报告的岗位名称、字符串ID、描述样本。分页上限与详情路由待批准后观察。本轮只读发现到新域名后停止，未测试公共ATS兼容性。

## 激活及页面验收

未启用、未绑定、未改信任或旧版。未运行扫描、AI评估、投递或平台接口。平台独立验收尚未执行。BLOCKED.md 仍有效，本候选不可安装；审核路线后应续接开发。

检查结果（均退出码0）：
- `node plugin-audit.mjs plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21`：audit clean。
- `node plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/test/smoke.mjs`：原始模板fixture通过，无网络；不计为新适配器完成。
- `node --check` 分别检查本候选 index.mjs 与 test/smoke.mjs：通过。

本轮仅新增路线申请、阻塞和验收记录，未改代码、清单、绑定或权限。日后完成的运行时目标是确定性HTTP与解析、零模型Token；本轮Agent发现使用开发Token。

## 原候选续接：2026-09-12T10:54:53.472447+00:00

平台已于2026-09-12T10:50:52.088Z批准原路线。本轮未重新搜索官网，直接打开已批准首页；原 ROUTE_REVIEW.json 保持不变，未增加生产域名权限。旧路线阻塞归档于 BLOCKED-route-history.md，当前阻塞以 BLOCKED.md 为准。

### 实时页面与最小公开样本

- Ego Lite 独立任务空间28；首页正常公开加载，点击实际「职位」元素，先滚动、等待布局并验证视口及命中。
- 实际列表地址：https://hr.g-bits.com/web/index.html#/post-web/post-list/ 。这是批准入口内的正常职位导航，不是替换招聘入口。页面显示「共37条/0-20」，仅打开第一页，没有翻页。
- 2026-09-12T10:53:30Z 左右正常页面产生 POST https://joinserverfast.g-bits.com/humanResource/recruitmentExtranet/ExtrannetCampusPost/queryRecuitPost ，观察到HTTP 200，未保存完整响应、Cookie或凭证到候选文件。请求body及响应字段未成功提取；200本身不算解析验收。
- 首项「客户端开发工程师」，深圳，发行中心，2027届秋季校园招聘。点击前视口命中检查通过；点击后在同页展开。职责片段：「负责客户端 APP 基础功能迭代、联调与版本交付」；要求包含计算机、人工智能、软件工程等相关专业及大模型接口调用、SDK集成实践。列表名称与展开内容相关，但字符串ID及独立详情URL未核实。pageInfo与listTabs均确认停留列表页且仅一个标签。
- 正文抽查1项；完整名称+字符串ID+详情URL核对0/3。其余岗位未核验。没有强制登录、短信或验证码，不需要用户代登录。
- 页面同时加载loft.g-bits.com的静态资源；未主动读取或纳入生产依赖。未取得可复用公共ATS证据，不能判定兼容某个ATS。

### 开发、离线与激活分开结论

真实解析器未完成。原通用模板替换为明确报错的失败关闭占位实现，测试仅验证不发网络请求、不返回伪岗位或空成功；不能替代字段映射、长ID、分页fixture验收。实际公开响应恢复失败后停止，未重复列表请求。

未运行scan、verify-portals、批量扫描、AI评估、申请或平台配置接口。未启用、未绑定、未改信任、锁文件、旧版或其他企业。平台独立列表/三个详情与激活页面验收均未执行。本次开发使用Agent Token；候选运行时不调用模型，但当前只能报未完成错误，不能读取岗位。

本次交接检查（均退出码0）：
- `node plugin-audit.mjs plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21`：audit clean。
- `node plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/test/smoke.mjs`：失败关闭、零网络检查通过；真实解析fixture尚缺失。
- `node --check plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/index.mjs`：通过。
- `node --check plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/test/smoke.mjs`：通过。
- ROUTE_REVIEW.json SHA256仍为 `966c1ddcaac4e457015bd9e5c950801a2ba84ee32c3ac946728c8ed5eb992948`，与平台批准digest一致。

## 原候选续接：2026-09-12T13:27:48.913Z

### 本次实时取证（覆盖此前响应与DOM编号未知结论）

原任务空间已不存在，新建 Ego Lite 独立空间30，直接打开平台批准首页，不重新发现入口。ROUTE_REVIEW.json 未改；未增加域名、未读取旧版或其他企业文件。

在首页安装开发辅助 publicCaptureScript，限定此前观察过且属批准域名的一个端点，随后点击真实 div.tab-item「职位」。已 scrollIntoView、等待0.5秒，视口命中=true，点击中心(577.765625,30)。pageInfo 与 listTabs 确认列表地址与一个标签。首个2秒观察仍在加载，继续等待正常响应，没有重放。辅助模块首次导入因URL格式失败，一次改用绝对 file URL 成功；这不是官网故障。

- 列表地址：https://hr.g-bits.com/web/index.html#/post-web/post-list/
- 实际请求：POST https://joinserverfast.g-bits.com/humanResource/recruitmentExtranet/ExtrannetCampusPost/queryRecuitPost
- 公开请求体：`{"currentPage":1,"pageSize":20,"recruitsType":"CAMPUS_RECRUITING","recruitProjectId":"","recruitmentType":null,"workPlace":null,"postTypes":null}`
- 响应HTTP 200；业务status=10010，success=true；data.count=37，data.list共20项。仅第一页，未翻页、未直接HTTP重放，未做匿名初始化。
- 所需真实字段：id:string、postName:string、description:string（HTML）、workCity:{name,id,desc}、jobStatus:string、recruitProjectName:string、postType:string。岗位发布时间字段未观察到。没有可复用公共ATS证据，当前是企业自建接口。
- DOM实际结构：`tbody.js-duty[data-post-id]` 包含 `tr.duty-info`，标题为 `td:first-child`；正文为 `div.dsp-wrap`，外层 `tr.duty-cont-box`。未声明可用 inlineDetails，因为同名检查已经失败。表格没有 a 详情链接。不点击投递按钮。

最小公开样本（字符串编号/API与DOM标题编号均匹配）：

|名称|id|地点|API描述最小片段|
|---|---|---|---|
|客户端开发工程师|8a82ac07a065e0c601a07ac8a3b52f44|深圳|投递本岗位，你将有机会加入公司核心中台技术团队|
|财务专员|8a82ac07a061e74b01a0625b68af00c2|厦门|投递这个岗位，你将有机会加入公共职能部门—财务部|
|财务专员|8a82ac07a061e74b01a062599f3600c1|深圳|投递这个岗位，你将有机会加入公共职能部门—财务部|

20项编号无重复，但“财务专员”重复2次，浏览器标准标题文本定位无法唯一指向。依SOP停止，不构造任何详情URL、不删除同名记录、不继续点击三个详情。捕获完成已 stop 清除内存响应；未保存完整响应、凭证或个人数据。

### 分阶段结果与限制

- **离线测试**：当前仅失败关闭、零网络测试；尚无可交付的字段解析fixture，不算适配器开发完成。
- **真实详情抽查**：本轮0/3。仅核对API与列表DOM的三个名称及字符串编号，未执行展开正文完整对比，不能计入详情验收。历史正文抽查也不代替本轮验收。
- **启用及页面验收**：未执行；候选未启用、未绑定、未改信任配置，平台独立验收待定。未运行scan、verify-portals、批量扫描、AI评估、申请或平台配置接口。

旧响应取证阻塞归档于 BLOCKED-response-history.md；当前 BLOCKED.md 保留同名展开岗位阻塞。候选仅更新报错原因，不返回任何伪岗位。运行时不调用模型；本次Agent开发使用Token。

本轮交接检查均退出码0：`node plugin-audit.mjs plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21`（audit clean）；`node plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/test/smoke.mjs`（失败关闭、零网络）；`node --check`分别检查 index.mjs 与 test/smoke.mjs（通过）。这不是解析fixture或在线验收通过。批准路线SHA256复核为 `966c1ddcaac4e457015bd9e5c950801a2ba84ee32c3ac946728c8ed5eb992948`，与平台批准值一致。


## 续接完成开发：2026-09-12T13:33:31.676Z

本节为当前结论，前述同名岗位阻塞已被当前平台 ID 元数据契约及本轮真实验证解决。旧记录原文归档 BLOCKED-duplicate-title-history.md，无活动 BLOCKED.md。批准路线文件逐字保留，SHA256仍为966c1ddcaac4e457015bd9e5c950801a2ba84ee32c3ac946728c8ed5eb992948。未重新发现入口或扩大生产域名。

### 本轮真实公开证据

旧任务空间已不存在，仅有无关常驻空间，故新建独立 Ego Lite 空间31。直接打开已批准首页，在正常 SPA 职位导航之前安装 publicCaptureScript，仅观察一个历史已知且已批准主机上的公开列表端点。职位控件为 div.tab-item，raw href=null，无绝对href；滚动、等待0.5秒并验证 elementFromPoint 命中后点击(577.765625,30)。pageInfo和listTabs确认同页进入列表且只有一个标签。

- 校招列表：https://hr.g-bits.com/web/index.html#/post-web/post-list/
- 正常页面请求：POST https://joinserverfast.g-bits.com/humanResource/recruitmentExtranet/ExtrannetCampusPost/queryRecuitPost
- 请求体：`{"currentPage":1,"pageSize":20,"recruitsType":"CAMPUS_RECRUITING","recruitProjectId":"","recruitmentType":null,"workPlace":null,"postTypes":null}`
- HTTP 200；success=true、status=10010、data.count=37、data.list.length=20；20个真实字符串ID互不重复。无翻页、无重放、无初始化。完成后调用stop清除了内存响应；不保存完整响应、userName、凭证或个人数据。
- 固定字段：id→id，postName→title，workCity.desc→location，description→description，company固定为本企业；jobStatus要求“正常”。实际本页description均为纯文本，无HTML标签或实体（纠正历史HTML推断）；无已核实发布时间，故省略postedAt。
- 企业自建接口，没有证据表明是可复用公共ATS。清单仅声明运行及验收必要的 hr.g-bits.com、joinserverfast.g-bits.com，均在批准范围。官网关系链见保留的ROUTE_REVIEW.json。

### 三个展开详情：本轮通过

每个控件点击前scrollIntoView居中，等待0.5秒，核验边界及elementFromPoint；按公开data-post-id确定真实元素，不点击投递控件。实际tbody.js-duty容器、tr.duty-info控件、控件相对td:first-child标题、容器相对div.dsp-wrap正文与清单一致。每项都核对API ID与DOM ID、标题、可见正文；API和DOM正文去空白后完全一致。每次点击后pageInfo/listTabs均确认同一列表地址及1个标签，没有意外导航或新增详情页。

|UTC时间|真实名称|字符串ID|地点|DOM正文长度|结果|
|---|---|---|---|---|---|
|2026-09-12T13:33:27.548Z|客户端开发工程师|8a82ac07a065e0c601a07ac8a3b52f44|深圳|982|标题/ID/完整正文一致|
|2026-09-12T13:33:29.601Z|财务专员|8a82ac07a061e74b01a0625b68af00c2|厦门|434|标题/ID/完整正文一致|
|2026-09-12T13:33:31.676Z|财务专员|8a82ac07a061e74b01a062599f3600c1|深圳|434|标题/ID/完整正文一致|

最小正文样本：客户端为“投递本岗位，你将有机会加入公司核心中台技术团队”；两条财务岗位均为“投递这个岗位，你将有机会加入公共职能部门—财务部”，分别对应上表不同ID和城市。同名但不同ID是合法岗位，不合并、不删减、不伪造标题。

无独立详情路由；三个实际展开地址均为上面的listUrl。输出URL严格使用平台契约：listUrl + ':~:text=' + encodeURIComponent(title).replace(/-/g,'%2D') + '&careerops-id=' + encodeURIComponent(id)。careerops-id仅为fragment元数据，不发给官网。必须提示“打开官网后点击同名岗位展开”，不保证浏览器自动定位或展开。本轮未出现强制登录、验证码或关闭页；其余17项未检查正文，也不承诺全部岗位当前可投递。

### 离线测试及代码检查：通过

- node plugin-audit.mjs plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21：audit clean，退出0。
- node plugins.local/company-243ef6bd-bafc-4c7c-8f96-fb93be905d21/test/smoke.mjs：退出0；零网络合成内存fixture覆盖字段映射、长字符串ID、同名不同ID、重复ID拒绝、空数据、异常结构/业务状态/正文/城市、失败传播及count=37时只请求第一页20条。
- node --check 分别检查index.mjs与test/smoke.mjs：均退出0。
- 生产模块不导入fixture，不回退伪岗位。请求失败与响应结构变化抛错；只有明确count=0/list=[]才返回空列表。描述出现新HTML格式或异常岗位状态时失败关闭，需重新核验。

### 启用及页面验收：待平台独立执行

开发代码与三条浏览器详情证据已完成。浏览器正常请求成功不证明全新匿名HTTP运行已通过，本轮不重复请求列表；平台需独立运行HTTP provider、核验一页与三个DOM展开详情及配置完整性，再决定安装绑定。候选保持禁用；未改绑定、信任、锁文件、旧版、其他企业或平台接口，未运行扫描、AI评估和投递。

运行时固定为一次POST、第一页最多20条；不因entry.max_pages扩大读取，37条总数不意味着已读取全部。实际HTTP验收未完成不是已知HTTP失败。日常运行零模型Token，本轮Agent开发使用Token。不得将本文件视为已启用或页面验收通过。
