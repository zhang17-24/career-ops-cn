# 米哈游候选开发证据

候选：company-63572e2b-c77f-40af-afaa-e536fdbd3abe。
开发核对时间：2026-09-19 01:29–01:35（Asia/Shanghai）。匿名 HTTP 实测时间：2026-09-18T17:33:55.667Z。
状态：开发验证完成；候选未启用、未绑定；平台独立验收尚未执行。没有活动阻塞项。

## 来源、授权与实现选择

- 仅使用 portals.yml 中「米哈游」配置入口 https://jobs.mihoyo.com/ 。显示 miHoYo 招聘官网、米哈游品牌介绍及校园招聘导航，身份一致。
- 实际点击「切换到校招」进入 https://jobs.mihoyo.com/#/campus ，再点击「岗位投递」进入 https://jobs.mihoyo.com/#/campus/position 。无需额外登录，页面的登录入口不阻挡公开岗位读取。
- 使用任务提示中服务端保存的一次授权模式（2026-09-18T17:29:01.994Z），沿上述实际公开路线继续。ROUTE_REVIEW.json 记录精确连通证据；未自行设置任何 approved 字段或修改平台权限。
- 正常列表加载观察到米哈游自有 ats.openout.mihoyo.com API；没有公共第三方 ATS 租户证据，因此实现企业自有接口解析，不虚构通用 ATS。
- 生产仅需要 jobs.mihoyo.com 与 ats.openout.mihoyo.com。浏览器的统计和素材资源不用于生产 HTTP 读取，未扩展权限到这些域名。

## 方法、结果与替代能力

1. Ego Lite 独立任务空间12，配置首页身份核验及正常SPA导航可读。初始快照尚为空壳；后续页面加载后观察到岗位，未当作404或登录失败。
2. 尝试预加载捕获时，本地辅助模块的相对路径导入失败；修正为绝对 file URL 后注册与 finally 清理，但该轮未提供可用捕获输出，不算取证成功。
3. 切换为已证实适用的SPA内存捕获：返回同一校园首页，安装 publicCaptureScript（精确公开列表端点），再导航同一列表。得到POST请求体和真实JSON响应，随后停止并删除内存捕获。未使用 requestId、重放浏览器请求、读取请求头或凭证。
4. 列表卡片不是anchor；读取其公开React点击处理函数，看到 C_POSITION_ID.getPathname({id:e})。页面实际引用 https://jobs.mihoyo.com/umi.6f1adbea.js ，只提取导航声明 C_POSITION_ID:{uid:"/campus/position/:id",params:{}}，未遍历资源或分析安全签名。
5. 对列表前三张卡片分别 scrollIntoView({block:'center'})，独立检查矩形在视口内且 elementFromPoint 命中，然后正常点击。page.info() 与 task.tabs() 检查新页；初始 about:blank 是短暂加载状态，随后实际详情地址和正文正常。每次完成后关闭详情页，没有累积标签。
6. 三次实际导航证实固定公开路由；无需 browserListing 或 inlineDetails。纯HTTP JSON已可读，DOM reader不增加必要能力，且当前卡片不满足可见anchor契约。
7. 使用实现自身的 provider.fetch 做一次无Cookie、无Authorization的公开 HTTP 验证：200，10条，前三条ID/标题/地点与浏览器一致。无初始化、无重试、无翻页、无详情API请求。
8. 已完成 task.finish({keep:[]})，清理本次独立任务空间。

## 真实列表请求与映射

POST https://ats.openout.mihoyo.com/ats-portal/v1/job/list

公开请求体：`{"pageNo":1,"pageSize":10,"channelDetailIds":[1],"hireType":1}`。
生产发送 content-type: application/json，redirect: error。
观察响应：code=0，success=true，error=false；data.pageNo=1、pageSize=10、total=259、list长度10。
每项实际字段包括 id、title、addressDetailList、competencyType、jobNature、projectName。不保存完整响应。

映射：id原样保留字符串；title去首尾空白；addressDetailList[].addressDetail合为location；company固定为本企业；url根据公开代码声明及三次点击核实的路径生成。API列表没有完整职责或发布时间，不输出伪造description/postedAt。
校招页包含2027届秋招与实习生专项。固定首屏最多10条；即使配置max_pages=3仍不翻页，不声称覆盖259条。
成功且total=0/list=[]才返回空列表。失败状态、结构变化、不完整页面、重复ID、数值ID和缺失字段抛错，绝不返回mock。

## 真实详情抽查（仅三个）

三条列表地点均为上海，编号为实际字符串。完整职责及任职要求已在Ego DOM读取；下表只保留最小公开摘要。

| 字符串编号 | 列表及详情标题 | 实际点击URL | 当前正文证据与结果 |
|---|---|---|---|
| 9544 | 国际化品牌实习生-绝区零（线下活动和整合营销方向） | https://jobs.mihoyo.com/#/campus/position/9544 | 职责涉及海外线下活动策划落地与欧美版本整合营销；要求线下活动经验、英语能力；标题、URL编号、完整职责及要求一致，可读。 |
| 9541 | 市场内容实习生（前瞻节目制作）-绝区零 | https://jobs.mihoyo.com/#/campus/position/9541 | 职责涉及前瞻节目策划制作、台本撰写校对与跨团队协调；要求文字功底和内容制作流程知识；标题、URL编号、完整职责及要求一致，可读。 |
| 9538 | 浏览器渲染工程师 | https://jobs.mihoyo.com/#/campus/position/9538 | 职责涉及浏览器引擎研发及性能调优，要求Chromium内核开发与分布式系统经验；标题、URL编号、完整职责及要求一致，可读。 |

无登录验证、短信、验证码、关闭或404提示。没有点击投递；正文可读不等于已验证申请流程。其他七条未核实详情。

## 离线测试与审计

以下命令均通过：

- `node plugins.local/company-63572e2b-c77f-40af-afaa-e536fdbd3abe/test/smoke.mjs`
- `node --check plugins.local/company-63572e2b-c77f-40af-afaa-e536fdbd3abe/index.mjs`
- `node --check plugins.local/company-63572e2b-c77f-40af-afaa-e536fdbd3abe/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-63572e2b-c77f-40af-afaa-e536fdbd3abe` → audit clean

零网络fixture覆盖请求参数、一次请求、字段映射、超长字符串ID、成功空列表、10条分页上限、结构异常、重复编号、数值编号、缺失字段、网络失败传播。fixture仅存在test目录；生产无fixture导入、无fallback、无模型调用。

## 启用及页面验收（独立阶段）

尚未执行，由平台在Agent结束后独立进行真实列表、三个详情和权限/完整性验收，并决定是否自动安装及替换绑定。未运行scan.mjs、verify-portals.mjs、批量扫描、AI评估或投递；未改旧版、配置、绑定、锁文件；未提交或推送。开发抽查和离线通过均不替代平台验收。
