# 博世中国：开发完成，候选停用，等待平台独立验收

候选：`company-c7f40d34-6850-4ff1-a459-e98e5a98eab2`。
本轮核验：2026-09-13T15:55:06Z—15:56:14Z（UTC）。
批准时间：2026-09-13T15:52:11.325Z；批准 digest：b6a346c31cc915ba30f9ae45fd56eecb7a480b5e79dc37bf02ae9369b0ead088。
ROUTE_REVIEW.json 保持原样，批准来自本轮平台提示；未写授权、信任、绑定或启用配置。

## 本轮方法与结果

先读原候选代码和历史阻塞。旧空间65已不存在，新建 Ego Lite 独立空间67，仅本企业一页列表和三个详情，结束关闭空间。
直接使用已批准的列表入口，无重复发现。现有 POST 响应封装证据足以选择平台 browserListing，无须重复 HTTP 捕获或逆向。复用平台固定 DOM reader，不另建 Moka 网络解析库；运行时不使用 Ego 或模型。

入口（2027 校招人工智能方向）：https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/jobs?zhineng%5B0%5D=204853
官方链与实际列表 POST 请求、公开参数见下方历史及 ROUTE_REVIEW.json；本轮没有重放 API。标题仍为「2027 博世中国校园招聘」，身份一致，无登录/短信/CAPTCHA 门槛。

新鲜 DOM 证据：通用卡片选择器有38条，后8条属于「最新职位」侧栏，不能计入筛选结果。实际主列表祖先为 `.jobs-AkItzswt6b`；manifest 限定 `.jobs-AkItzswt6b a.link-txmgVOCVz9[href]`，得到30条、30个独立URL。名称 `.title-u2qk9xX9Ie`；地点 `.info-tPG_0QGbhl .sd-foundation-body-secondary-v3EXx:last-child .no-adaptive-tooltip`，读取可见地点，避开隐藏排版副本。2026-09-13T15:56:14Z 在同一列表标签执行平台 extractBrowserListing 原函数，30条均通过可见性、身份与字段检查。

字段：title/location/url 由平台读取官方真实 anchor；company 由平台绑定企业提供；id 为实际 #/job/ 路由最后一段原始字符串。生产不返回未经逐项读取的 description 或 postedAt，不导入 fixture。重复ID、无列表、超限或 reader 错误均失败，不返回mock。

分页：页面32结果，30行/页；只读取第一页，无翻页，无侧栏，未核实其余27条详情。不代表全校招、社招或实习覆盖。平台 reader 上限100，本站当前一页30。

## 真实详情抽查：3条

三个URL既是历史观察线索，也是本轮主列表鲜读 anchor 的 raw/resolved href。直接打开第一条并复用同一详情标签访问后两条；无拼接或猜路由，无冗余popup点击。详情URL保留同一字符串ID，标题与本轮列表逐项相同；公开描述及公司信息可读，未见关闭/404或验证门槛。未点击「申请职位」。

| 标题 | 字符串ID | 列表地点 | 详情正文核对 |
|---|---|---|---|
| 端到端算法工程师（XC） | 153e145f-3516-467b-93e2-aabe30ac8c5b | 江苏·苏州市 上海市 | 端到端模型设计、BEV/Occupancy、轨迹预测、模型训练及车端部署；公司为博世（中国）投资有限公司 |
| AI大模型开发工程师（车辆运动控制）（VM） | 5cdcec19-5328-4fe5-b61e-d610d76c2f36 | 江苏·苏州市 | 深度学习/NLP、模型微调、部署与业务场景；VM部门相符 |
| AI 软件工程平台工程师（XC） | 1c48f059-aafa-445d-80e5-02b76008cfaf | 江苏·苏州市 上海市 | AI研发工具、Agent、RAG与研发流程集成；XC部门相符 |

实际详情地址：
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/153e145f-3516-467b-93e2-aabe30ac8c5b
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/5cdcec19-5328-4fe5-b61e-d610d76c2f36
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/1c48f059-aafa-445d-80e5-02b76008cfaf

## 离线测试与限制

- `node plugins.local/company-c7f40d34-6850-4ff1-a459-e98e5a98eab2/test/smoke.mjs`：PASS。零网络最小DOM对象fixture，测试平台提取契约、字段映射、长字符串ID、空/异常数据、重复ID、单页上限及失败传播；不是完整浏览器CSS引擎模拟。选择器的真实可用性另由上述 Ego 鲜读验证。
- `node plugin-audit.mjs plugins.local/company-c7f40d34-6850-4ff1-a459-e98e5a98eab2`：audit clean。
- `node --check` 分别检查候选 index.mjs 与 test/smoke.mjs：均通过。

## 启用及页面验收：尚未执行

候选开发无未解决阻塞，旧授权阻塞已由平台批准和本轮实现/鲜读解决，原文归档至 BLOCKED.resolved-history.md。未自行启用或绑定，未扫描、未调用AI评估、未提交申请，未改其他目录、旧版或锁文件。
平台尚须以独立匿名 Chromium 在批准域名约束下读取列表、核验三个详情并检查完整性。Ego可读不等同匿名运行已验收；必要脚本被限制或DOM变更时应失败并保留旧版。日常固定读取零模型Token，但需要浏览器运行资源；本次Agent开发消耗Token。

---
# 历史记录（下文未批准/未实现状态已由上文本轮结果取代）

# 博世中国：等待路线审核，未完成适配

- 候选：`company-c7f40d34-6850-4ff1-a459-e98e5a98eab2`
- 取证时间：2026-09-13T15:31:47Z（UTC）。
- 当前批准生产域名：仅 `www.bosch.com.cn`。
- 状态：保持禁用；未安装、未绑定、未修改信任或旧版。唯一待处理事项为 ROUTE_REVIEW.json 的入口及域名审核；没有额外发现阻塞。

## 现有证据与方法

开始时候选仅有生成模板、manifest、说明和 smoke 测试，无既有 ACCEPTANCE、BLOCKED 或路线申请。技能中心返回空目录；完整阅读用户指定适配技能和 SOP，按显式任务执行。

使用 Ego Lite 独立任务空间 60 打开 portals.yml 中的实际配置地址 `https://www.bosch.com.cn/careers/`。pageInfo 返回同一 URL，标题「加入博世 | 博世在中国」，页面正文显示「博世在中国」「Work #LikeABosch」「2027届博世中国校园招聘」。入口加载成功，无身份冲突；出现普通 Cookie 选择面板，未出现登录或验证码阻塞。

方法：语义快照确认身份，再读取真实 anchor 的原始 href 与解析后 href。结果：「2027届博世中国校园招聘／了解详情」两者均为 `https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/`。该官网直接链接已形成有效官方招聘服务路线，记录于 ROUTE_REVIEW.json。没有搜索、猜测 URL、重复点击或寻找产品主页反向链接。

招聘范围选择当前官网明确标注的 2027 校园招聘入口。官网另有社会招聘导航及其他校招入口，本次未展开；不声称覆盖社招或实习。

## 方法选择与待续接事项

真实官网链接指向 Moka 公共 ATS，批准后优先评估可复用 Moka 固定解析。新入口域名 `app.mokahr.com` 未获生产批准，按 SOP 在有效路线申请处停止开发。未导航该 ATS、未观察或猜测其 API，因此没有列表请求、响应 schema、岗位样本、字符串 ID、详情 URL 或分页参数可用于实现。

公开 JSON/HTML、SPA 捕获、document-start preload、inlineDetails 和 browserListing 均应在批准入口后根据真实证据选择。当前缺口是入口及域名授权，不是 HTTP 或浏览器能力失败；切换读取方法不能解决授权缺口，因此不做无证据的额外尝试。无需新增无关发现阻塞。

续接时读取平台提供的批准入口和精确域名，保持申请 JSON 原样，只补真实一页列表、最多三个详情、固定解析和测试。若实际必要 API 或资源出现其他域名，需补充可连接的真实证据并重新审核，不自动放行。

## 离线检查（仅原始模板，不代表适配完成）

- `node plugin-audit.mjs plugins.local/company-c7f40d34-6850-4ff1-a459-e98e5a98eab2`：通过，audit clean。
- `node plugins.local/company-c7f40d34-6850-4ff1-a459-e98e5a98eab2/test/smoke.mjs`：原始模板 fixture 通过，无网络。示例不是博世真实岗位证据。
- `node --check plugins.local/company-c7f40d34-6850-4ff1-a459-e98e5a98eab2/index.mjs`：通过。

本阶段按路线边界未开发生产解析器；index.mjs、manifest.json 与模板测试保持原样。模板的字段、空列表及异常行为尚未按真实 API 验证，不能提交安装。开发续接时测试必须改用 `import { strict as assert } from 'node:assert'`，覆盖真实 schema、长字符串 ID、空结果、异常及单页限制。

## 真实详情与平台验收

- 真实列表：未读取；仅核实官网导航页。
- 真实详情抽查：0 条；标题、字符串 ID、职责均未核对，不声称岗位有效。
- 启用及页面验收：未执行，交平台在开发完成后独立执行。
- 未运行 scan、verify-portals、批量扫描、AI 评估或投递；未保存凭证、个人数据或完整生产响应。


## 原候选续接：2026-09-13T15:49:34Z

上文为前次历史。本轮平台已批准 app.mokahr.com 和 www.bosch.com.cn，批准时间 2026-09-13T15:46:07.512Z。先读已有模板、测试和证据，未重建候选。旧申请逐字节保存在 ROUTE_REVIEW.approved-history.json；ROUTE_REVIEW.json 是新增待审核提案，不代表扩权获准。

Ego Lite 独立任务空间65，从批准入口加载，标题「2027 博世中国校园招聘」，企业身份一致。页面有登录按钮但无登录门槛、短信或 CAPTCHA。原空间60已经不存在。本轮未搜索或复核其他企业。

### 方法、证据与结果

1. 官网 anchor：人工智能方向 raw/resolved href 都为 `https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/jobs?zhineng%5B0%5D=204853`。第一次滚动尚未稳定，矩形 y=1169 超出720视口，点击未导航；pageInfo/listTabs确认未跳转。未将其视为网站失败，不重复该点击，改用 exact observed href 打开。后续不再点击。
2. 实际列表显示 AI/人工智能、32结果、30行/页；只看第一页，无翻页或额外分类。观察公开 POST `https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2`。
3. 公开捕获：最初本地 helper import 路径解析失败，尚未执行浏览器操作；用 node:url pathToFileURL 明确路径修正。随后从同一列表返回已批准首页，在 SPA 导航前安装 publicCaptureScript，正常回到同一列表。捕获 HTTP200；公开请求体为 `{"orgId":"bosch","siteId":"168626","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"zhinengIds":["204853"],"customFields":{},"site":"campus","locale":"zh-CN"}`。顶层键 data/necromancer，data 为长度34432的封装字符串，不是可解析岗位数组。未重放请求、未取请求头、未分析签名或解码封装；finally 已 stop 清除捕获。输出键时误对字符串调用 Object.keys 产生冗余数字索引；未保存完整响应，后续改为最小类型/样本记录。
4. 按证据切换：阅读 adapter-browser-listing.mjs。DOM 的真实岗位 anchor 为 `a.link-txmgVOCVz9[href]`，名称相对选择器 `.title-u2qk9xX9Ie`；地点应取 `.info-tPG_0QGbhl .sd-foundation-body-secondary-v3EXx:last-child .no-adaptive-tooltip`，避免隐藏副本重复。该选择器为观察线索，尚未实现或测试。平台 browserListing 必须使用批准的精确 listUrl，当前已批准地址是展示首页，没有岗位 anchor；需改为上面的实际列表页。
5. 新域名边界：DOM script.src 和 performance 均显示主程序 `https://static-ats.mokahr.com/recruitment-web-client/javascripts/recruitmentWeb-20260910-1545-197e7-release.js`，同域承载 runtime/vendor/i18n/CSS。固定浏览器读取需要这项精确资源域名批准。已提交连接链，立即停止生产开发。未主动请求其他域名。未将百度统计、验证码脚本或图片域名批量加入许可；它们不是当前证明必需的列表脚本。

### 最小公开列表样本（均未打开详情）

| 标题 | 字符串ID | 地点 |
|---|---|---|
| 端到端算法工程师（XC） | 153e145f-3516-467b-93e2-aabe30ac8c5b | 江苏·苏州市 上海市 |
| AI大模型开发工程师（车辆运动控制）（VM） | 5cdcec19-5328-4fe5-b61e-d610d76c2f36 | 江苏·苏州市 |
| AI 软件工程平台工程师（XC） | 1c48f059-aafa-445d-80e5-02b76008cfaf | 江苏·苏州市 上海市 |

真实 anchor 完整地址（可供批准后的续接直接导航，仍必须鲜读详情）：
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/153e145f-3516-467b-93e2-aabe30ac8c5b
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/5cdcec19-5328-4fe5-b61e-d610d76c2f36
- https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/1c48f059-aafa-445d-80e5-02b76008cfaf

### 剩余缺口与替代方法

HTTP 响应封装不提供可用公开字段；preload 不会改变已成功捕获的响应格式，没有重复捕获理由。页面是独立 anchor 详情，不需要 inlineDetails 或猜路由。固定 DOM 平台能力适用，但列表入口和必需脚本域名仍待路线批准，不能凭浏览器可见性扩权。未下载遍历 bundle 或尝试隐藏接口。当前明确缺口仅为这项新增路线授权；获批后续接固定 DOM、零网络 fixture 与最多三条详情，不重跑入口发现。

生产代码与 manifest 暂未修改，原模板不是已完成适配器；不得安装。当前范围仅人工智能方向第一页，不代表全校招、社招或实习全量。生产运行规划为平台零模型 Token 固定 reader；本次开发消耗 Agent Token。

真实详情抽查：0/3，未判断任何岗位可投递。启用及页面验收：未执行，由平台后续独立执行。未修改配置、绑定、信任、旧版或锁文件，未运行扫描、AI评估、投递。未保存凭证或个人数据。

本轮交接检查：plugin-audit 通过；原模板零网络 smoke 通过；index 与 smoke 语法检查通过。测试仅修正为要求的 node:assert strict 导入，仍非真实 DOM fixture，不代表在线验收。生产解析器保持未完成。
