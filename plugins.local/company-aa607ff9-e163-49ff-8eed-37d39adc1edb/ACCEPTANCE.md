# 携程招聘源开发验收记录

- 候选：company-aa607ff9-e163-49ff-8eed-37d39adc1edb
- 核验时间：2026-09-18 18:21–18:24 UTC（北京时间 2026-09-19 02:21–02:24）；最终详情核对 2026-09-18T18:24:23.285Z。
- 状态：开发完成；未启用、未绑定、未安装。最终真实列表与三详情及页面验收由托管平台独立执行。
- 本次任务已提供服务器保存的一次授权模式；ROUTE_REVIEW.json 只记录连通证据，不自行授予权限。
- 配置入口 https://careers.ctrip.com/ 可用，标题“携程集团招聘官网”，校园招聘展示2027届对象及毕业区间，品牌一致。无需入口恢复搜索。
- 唯一列表 https://careers.ctrip.com/#/campus/jobList ，来自校园招聘页“查看所有职位”的实际点击。未翻页、未扫描其他企业、未点击申请。

## 方法、证据、结果

1. Ego Lite 独立任务空间14读取首页，观察真实校园招聘 href，再点击查看所有职位；记录 page.info/tabs 的实际导航。
2. 等待列表异步就绪，从 resource timing 观察到同域 /api/hrrecruit/getJobAd。通过开发辅助 publicCaptureScript 对此精确端点安装内存捕获器，在同一列表正常 SPA 重入后捕获公开 POST 响应。无重放、无读取请求头/Cookie；取证完成已 stop 清除。
3. 首次辅助模块 import 因 Ego 进程 cwd 不同失败，改为绝对 file URL 后成功；没有重复失效 CDP requestId。请求发生在 SPA 导航，预加载不必要。
4. 公开响应 JSON 可固定解析，因此无需 browserListing、inlineDetails 或匿名初始化。未出现读取登录/验证码阻拦；导航条登录按钮不影响公开读取。
5. API 没有详情 URL 字段，实际列表 anchor 有 #/campus/job-detail/{fromId}。读取页面实际加载的 84.1b218d6d.chunk.js 中 recruit-item-link 局部导航代码，校园路径 /campus/job-detail，pathname `${n}/${e.fromId}`，标题 e.jobTitle。三条卡片实际点击新标签与该映射一致。未分析安全签名、未遍历下载 bundle。首个 main 路由片段只给出 /campus/job-detail/:jobId，不足独立证明字段映射；最终依据为列表模块局部代码和实际 anchor/点击。
6. 每次点击前 scrollIntoView(center)，等待元素边界在视口且 elementFromPoint 命中；每次检查原页 info 与 tabs。第二详情刚打开时 body 尚未创建，等待条件增加 body 空值保护后读取成功，非登录/关闭错误。前三条详情用完即关闭；第一条用已观察的精确 URL 复核正文后统一 finish 清理任务空间，无残留取证监听。
7. 单次匿名 Node HTTP POST 相同公开端点、相同 body、仅 content-type，无凭证：HTTP 200，retCode=201，返回10条。匿名首屏前三条为 MJ036717（AI Solution (Customer Service Intelligence) - Arabic (2027 Graduates)(MJ036717)）、MJ036639（Eagle Program – Business Analyst (2027 Graduates)(MJ036639)）、MJ036640（Eagle Program – Big Data Engineer (2027 Graduates)(MJ036640)）。与 Ego 会话的首屏排序不同，原因未推断；这些匿名首屏详情本次未另行打开，以遵守三个唯一详情预算。平台须对其自身实时列表独立抽查。

## 实际列表请求与最小 schema

POST https://careers.ctrip.com/api/hrrecruit/getJobAd

```json
{"condition":{"fromId":[],"keyword":"","kind":[],"country":[],"city":[],"bucode":[],"jobFamilyCode":[],"jobFamilyGroupCode":[],"category":2},"pager":{"index":"1","size":"10"},"head":{"language":"zh_CN","version":"1"}}
```

公开响应：retCode="201"；retValue.total=56（Ego观察）；retValue.recruitJobAdList 共10条。映射 fromId（字符串，保留前导零）→id；jobTitle→title；cityName→location；company=携程。API 标注 atsApiType=Moka，但观察到的是携程自建封装，没有到通用 Moka ATS 的公开链，因此使用企业专用薄解析器，不猜通用 ATS 租户。
生产仅声明 careers.ctrip.com 请求权限；ROUTE_REVIEW 另记录开发时实际读取的静态导航模块主机。无测试数据导入、失败兜底、环境密钥或模型调用。

## 真实详情抽查（三个不同编号）

| 字符串编号 | 列表与详情完整标题 | 真实点击 URL | 结果与最小正文样本 |
|---|---|---|---|
| MJ036670 | 数据分析师（技术方向）（2027届秋招）(MJ036670) | https://careers.ctrip.com/#/campus/job-detail/MJ036670 | 标题及URL编号吻合，完整职责/要求可读；“构建多维度数据分析体系”；详情全文包含列表API职责全文（去空白比较） |
| MJ036676 | 算法工程师（NLP方向）（2027届秋招）(MJ036676) | https://careers.ctrip.com/#/campus/job-detail/MJ036676 | 标题及URL编号吻合，完整职责/要求可读；“基于自然语言处理和机器学习算法”；正文去空白逐字包含匹配 |
| MJ036671 | 算法工程师（时间序列方向）（2027届秋招）(MJ036671) | https://careers.ctrip.com/#/campus/job-detail/MJ036671 | 标题及URL编号吻合，完整职责/要求可读；“深度参与业务洞察、特征构建、模型研发到算法实现的全过程”；正文去空白逐字包含匹配 |

无明确关闭/404、登录或验证码；仅证明这三个页面在观察时可公开读取，不保证所有列表岗位当前可投递。未保存完整生产响应、凭证或个人信息。

## 离线验证

以下命令均通过：

- `node plugins.local/company-aa607ff9-e163-49ff-8eed-37d39adc1edb/test/smoke.mjs`
- `node --check plugins.local/company-aa607ff9-e163-49ff-8eed-37d39adc1edb/index.mjs`
- `node --check plugins.local/company-aa607ff9-e163-49ff-8eed-37d39adc1edb/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-aa607ff9-e163-49ff-8eed-37d39adc1edb` → audit clean

fixture 全程无网络，覆盖真实字段映射、超安全整数长度字符串编号、同名不同编号、重复编号、真实空列表、异常/缺字段/错误响应、一页上限和网络错误传播。生产固定第1页10条，忽略扩大分页配置，不声明全量覆盖；无可选 description/postedAt 输出，避免未经所需解析验证的额外字段。

## 启用及页面验收

未执行 scan.mjs、verify-portals.mjs、批量扫描、AI评价、申请流程、安装或配置修改。没有活动 BLOCKED.md；此候选的独立平台验收尚未发生，不能把本记录或离线测试视为启用成功。平台失败应保留旧版本。
