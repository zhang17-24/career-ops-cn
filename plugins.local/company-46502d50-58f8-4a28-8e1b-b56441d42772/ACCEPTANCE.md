# 网易候选开发验证

候选：company-46502d50-58f8-4a28-8e1b-b56441d42772。
核验时间：2026-09-11 02:55–02:59 Asia/Shanghai（UTC 2026-09-10 18:55–18:59）。
开发已完成；候选保持停用，平台独立验收、安装、绑定及页面验收尚未执行。没有未解决的开发阻塞。

## 来源与范围

仅 portals.yml 中“网易”：https://campus.163.com/，实际首页 /app/index。
首页“应届生”菜单实际 anchor 的 raw href 与 resolved href 均为
https://campus.163.com/app/job/position?id=103（语义快照显示相对路径 /app/job/position?id=103）。
点击后 pageInfo 仍是首页，listTabs 发现新列表标签，随后切入。
仅网易互联网2027届校园招聘；不含互娱、雷火、社招和实习。没有访问这些外域入口。
未发现可复用第三方 ATS 证据；沿用网易自有 campuspc 接口固定解析。
旧版 company-30498115-ecdf-49ce-954a-c7e23cd8b980 的代码、测试、ACCEPTANCE.md 仅读取参考，没有修改。

## 真实列表与请求

只读取第一页（10条），没有翻页。浏览器正常页面观察到：

- GET https://campus.163.com/api/campuspc/project/navigation/list?timeStamp=1789066638454
- GET https://campus.163.com/api/campuspc/project/banner?projectId=103&timeStamp=1789066638532
- GET https://campus.163.com/api/campuspc/position/getJobList?pageSize=10&currentPage=1&projectId=103&timeStamp=1789066638688

匿名 HTTP 去掉缓存时间戳请求同一列表地址，UTC 18:57:28 返回 HTTP 200、code=200，data.total=77，data.list=10条。
UTC 18:58:39 再以最终候选 provider.fetch 读取同一第一页：单次请求返回10条，全部输出 id 为字符串；前三条与浏览器一致。两次 HTTP 均为同一页，无额外列表页。
生产请求：https://campus.163.com/api/campuspc/position/getJobList?pageSize=10&currentPage=1&projectId=103
无 Cookie、Token、模型或额外密钥；禁止重定向。没有保存完整生产响应。

## 三条真实详情

列表 anchor 的 raw href 均为下列绝对 URL 去掉 https://campus.163.com 后的相对路径；resolved href 即表内 URL。
第一条点击后 pageInfo/listTabs 均未发生跳转，未重试该点击，改用 openOrReuseTab 打开实际观察到的 href；其余两条同样直接打开已读取的官方 href，没有猜测地址。
第二条初次出现异步空壳，等待后岗位正文正常到达，不把初始空壳误判为失效。

| 字符串编号 | 列表及详情名称 | 真实详情 URL | 核对结果和最小正文样本 |
|---|---|---|---|
| `4845` | 市场管理培训生-网易有道 | https://campus.163.com/app/detail/index?id=4845&projectId=103 | 名称、URL编号、北京及职责匹配；“市场营销工作是理性与感性、科学与艺术的结合”。要求包含热爱AI行业。 |
| `4860` | 全栈开发工程师-网易有道 | https://campus.163.com/app/detail/index?id=4860&projectId=103 | 名称、URL编号、北京及职责匹配；“负责公司核心业务系统/产品的前后端需求评审、技术方案设计与高质量代码落地”。要求本科及以上。 |
| `4854` | 语音交互（端到端语音/全双工语音）算法工程师-网易有道 | https://campus.163.com/app/detail/index?id=4854&projectId=103 | 名称、URL编号、杭州/北京及职责匹配；“参与端到端语音及全双工语音大模型的架构设计与算法研发”。要求硕士及以上。 |

上述三个页面正常产生以下详情请求（未额外直连请求详情 API）：

- https://campus.163.com/api/campuspc/position/getJobDetails?id=4845&projectId=103&timeStamp=1789066660437
- https://campus.163.com/api/campuspc/position/getJobDetails?id=4860&projectId=103&timeStamp=1789066668759
- https://campus.163.com/api/campuspc/position/getJobDetails?id=4854&projectId=103&timeStamp=1789066680522

三个详情均出现职责、要求和“投递简历”控件；未点击投递、收藏或登录。页头登录按钮未阻止公开阅读，无登录墙、短信、CAPTCHA、关闭或404。此结论仅指核验时公开详情可读，不代表已提交或保证未来可投递。其余7条详情未逐一核验。

## 固定字段规则及限制

- positionName → title；id → 字符串 id 及已观察路由的 URL 参数。字符串编号不经过 Number；不安全数值编号报错。
- projectId 必须为103；workPlaceName → location（API逗号与页面顿号为同一城市集合）。
- positionDescription + positionRequirement → description；缺失必要字段报错，避免生成空壳岗位。
- updateTime 是更新时间，三个页面发布日期均为2026-08-27，与列表更新时间不同；不输出误导性 postedAt。
- 校验 code、list、total、分页长度；确实 total=0/list=[] 才为空列表。错误响应、结构漂移和网络错误向上传递，不使用 mock 兜底。
- 固定第一页、pageSize=10；即使 max_pages 更大也不扩展。去重按字符串 id。未验证其他页或其他年度项目；项目103变更需重新核验。
- 只声明 campus.163.com；不需要其他域名或权限。运行时确定性HTTP解析、零Token，本次Agent开发消耗开发Token。

## 离线及静态验证（独立于线上结论）

从仓库根目录运行：

- `node plugins.local/company-46502d50-58f8-4a28-8e1b-b56441d42772/test/smoke.mjs`：通过。测试强制禁用全局fetch，只注入内存fixture；覆盖映射、长字符串编号、安全数值编号、空结果、异常结构、重复编号、固定一页、网络失败、错误公司及更新日期不冒充发布日期。
- `node --check plugins.local/company-46502d50-58f8-4a28-8e1b-b56441d42772/index.mjs`：通过。
- manifest仅包含同域 allowedHosts、requiredEnv=[]；生产模块不导入测试、无模型调用。

## 启用及页面验收

未执行；交由平台在本任务结束后独立核验一页列表与三条详情，再决定安装与替换绑定。未运行scan.mjs、verify-portals.mjs、批量扫描、AI评估或申请流程；未修改配置、绑定、信任、锁文件或旧版本；未提交或推送。平台检查失败应保留旧版。本文件不替代平台验收。
