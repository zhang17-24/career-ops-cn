# 携程候选开发验收记录

记录时间：2026-09-18T17:34:50.763473+00:00。候选：company-58ce5cb2-df6b-43f8-bda4-43826e599e58。

## 范围与状态

只处理携程校园招聘第一页；未翻页、未扫描、未评估、未投递。候选保持禁用，未改绑定、信任或旧版本。平台独立验收及启用尚未执行。生产只用 ctx.fetchJson 的真实响应，不导入测试数据，无模型调用。

## 来源与方法

配置入口 https://careers.ctrip.com/，标题“携程集团招聘官网”，正文“了解携程集团”；实际校园招聘 anchor 原始 href `#/campus`，解析地址 https://careers.ctrip.com/#/campus。进入后页面说明 2027届应届校招生，留用实习生暂未开启。正常点击“查看所有职位”到 https://careers.ctrip.com/#/campus/jobList。

首页/校园页 goto 曾在15秒等待 load 时超时，但 navigation 已提交且 readyState interactive；随后直接检查同页 DOM，公开正文正常。没有把该超时判为登录或过期。使用独立 Ego Lite 空间13。

正常列表请求观察到 https://careers.ctrip.com/api/hrrecruit/getJobAd。使用开发辅助 publicCaptureScript 在校园页内安装，正常 SPA 切换回同一列表捕获一次，状态200、retCode字符串201、retMessage调用成功。读出 schema 和三条最小样本后 stop 清理；未获取 Cookie/请求头、未调用 getResponseBody、未逆向签名。首次 helper import 路径解析失败，改为正确 file URL 后成功；没有改变请求。

公开请求：POST，Content-Type application/json，正文：
```json
{"condition":{"fromId":[],"keyword":"","kind":[],"country":[],"city":[],"bucode":[],"jobFamilyCode":[],"jobFamilyGroupCode":[],"category":2},"pager":{"index":"1","size":"10"},"head":{"language":"zh_CN","version":"1"}}
```
响应结构 retValue.total=56、retValue.recruitJobAdList 长度10。字段映射：fromId→字符串id；jobTitle→title；cityName→location；requirements→description（保留官方HTML）；company固定携程。publishDate在三个样本均为2026-09-15，当前不输出可选日期。数字形式编号拒绝，重复 fromId 拒绝；同名不同编号允许。

详情 anchor 为 `#/campus/job-detail/<fromId>`。实际加载列表脚本 https://ak-s-cw.tripcdn.com/modules/hrteam/careers-trip-new-ares/static/js/84.1b218d6d.chunk.js 的 recruit-item-link 使用 `pathname: ${n}/${e.fromId}`；相邻导航代码根据 campus 路由使用 `/campus/job-detail`。三个真实点击与映射一致，不凭编号猜路径。主 bundle 只显示路由注册，转查已加载列表 chunk 后找到固定映射，没有遍历下载资源。API字段虽标 atsApiType=Moka，但公开端点属于携程自有封装，没有观察到公共 Moka ATS 入口，所以实现携程专用固定解析。

## 真实详情抽查（3条）

|官方记录id|路由编号|完整标题|当前正文核对|
|---|---|---|---|
|30109407|MJ036670|数据分析师（技术方向）（2027届秋招）(MJ036670)|标题、编号、上海一致；职责含多维度数据分析体系、AB实验框架；要求含SQL、Python及统计学，完整可读。|
|30109408|MJ036676|算法工程师（NLP方向）（2027届秋招）(MJ036676)|标题、编号、上海一致；职责含旅游场景文本语义解析、智能对话系统；要求含Transformer与PyTorch，完整可读。|
|30109409|MJ036671|算法工程师（时间序列方向）（2027届秋招）(MJ036671)|标题、编号、上海一致；职责含业务洞察、时序预测；要求含统计与机器学习、TensorFlow/PyTorch，完整可读。|

实际详情URL依次为：
- https://careers.ctrip.com/#/campus/job-detail/MJ036670
- https://careers.ctrip.com/#/campus/job-detail/MJ036676
- https://careers.ctrip.com/#/campus/job-detail/MJ036671

每次点击前 scrollIntoView(center)，等待矩形完整进入视口及 elementFromPoint 命中，再点击真实 a.recruit-item-link；检查 page.info 和 task.tabs。详情页逐一关闭，未积累临时标签。可见登录按钮但不妨碍阅读，无验证码，无明确关闭/404；未点击立即申请。该抽查不证明所有职位有效，也不证明投递阶段无需登录。

## 匿名 HTTP 与限制

对同一已观察列表端点作一次无凭证 POST 验证：HTTP200、retCode201、total56、10条真实岗位，schema一致。但匿名默认语言/排序与Ego页面不同，前三条为 MJ036717（AI Solution (Customer Service Intelligence) - Arabic (2027 Graduates)）、MJ036639（Eagle Program – Business Analyst (2027 Graduates)）、MJ036640（Eagle Program – Big Data Engineer (2027 Graduates)）。未为这些岗位额外打开详情，以遵守三个详情预算。生产原样映射当前响应，未硬编码浏览器样本、未排序补造、未使用用户会话。

此差异需平台独立读取当前HTTP列表并核验其三个详情，开发阶段三条中文详情不可代替平台当前结果验收。HTTP公开读取已可行，因而无需改用 browserListing、inlineDetails 或预加载监听；没有假定额外生产浏览器能力。仅覆盖第一页10条，不承诺全量56条或社招/实习覆盖。

## 离线检查

- `node plugins.local/company-58ce5cb2-df6b-43f8-bda4-43826e599e58/test/smoke.mjs`：通过；零网络，字段映射、长字符串编号、空结果、错误结构、缺字段、重复编号、同名异编号、单页上限及网络错误传播。
- `node --check plugins.local/company-58ce5cb2-df6b-43f8-bda4-43826e599e58/index.mjs`：通过。
- `node plugin-audit.mjs plugins.local/company-58ce5cb2-df6b-43f8-bda4-43826e599e58`：audit clean。

## 启用及页面验收

未执行，交由服务端独立验收后决定。没有活动 BLOCKED.md；默认语言/排序差异是待独立验证的限制，不能用本记录覆盖失败结果。只修改本候选目录。

## 2026-09-19 续接诊断（覆盖上文“无活动阻塞”的历史状态）

本轮时间：2026-09-18T18:29:03Z—18:30:23Z（北京时间 2026-09-19）。独立 Ego Lite 空间15。保留原生产 HTTP 解析和 fixture，不重建、不启用。活动阻塞见 BLOCKED.md。

### 新证据与方法

1. 配置首页再次显示“携程集团招聘官网”“了解携程集团”，正常中文入口身份一致。使用既有批准列表 URL；页面内 publicCaptureScript 在正常 SPA 切换前安装，捕获已知 POST `/api/hrrecruit/getJobAd` 后停止。请求正文与原 REQUEST 相同；HTTP200、retCode201、total56，第一页10条。未读取凭证/请求头、未重放浏览器请求、未翻页。列表前三条仍为 MJ036670、MJ036676、MJ036671，实际 anchor 原始 href 和绝对 URL 与历史一致。
2. 语言假设：浏览器 navigator.language=zh-CN。对已知公开端点的一次匿名 HTTP 请求附加普通 Accept-Language: zh-CN，其余正文与 REQUEST 相同。结果仍为10条，前三条为 MJ036717、MJ036639、MJ036640（标题见上文匿名 HTTP 记录）。因此语言头不能解决列表差异，未把此无效修改留入生产。不枚举参数、不读取 Cookie、不研究签名。
3. 本轮只核验三个中文详情，均使用已记录且当前列表再次观察到的准确 URL。MJ036670 在独立详情页完整就绪；同标签 goto MJ036676 后，URL已是 MJ036676，但15秒等待超时，正文仍是 MJ036670。这是实际可复现的 hash 路由复用问题，不是404、岗位关闭或登录要求。对同一已观察 URL reload 后，MJ036676 完整就绪。随后对 MJ036671 同样采用实际 URL 加整页 reload，完整就绪。
4. 只读查看平台调用契约：`enterprise-adapters.mjs:253` 创建一个详情 page，循环在 `:266` 调用 `checkUrlLiveness(page, job.url, options)`；`liveness-browser.mjs:312` 使用 page.goto，未在这些 hash 详情之间重新创建页或 reload。这与本轮“第二条详情沿用上一条正文”的现象吻合，也是上次 MJ036639（匿名结果第二条）超时的有证据解释；未额外打开英文详情，所以不把该英文岗位本身标为已验证或失效。

### 真实详情抽查（本轮3条）

- 18:29:21.662Z：MJ036670，完整标题“数据分析师（技术方向）（2027届秋招）(MJ036670)”，职责“构建多维度数据分析体系”“AB实验分析框架”，SQL/Python要求，上海；当前列表与详情一致。
- 18:30:21.579Z：MJ036676，完整标题“算法工程师（NLP方向）（2027届秋招）(MJ036676)”，职责“构建融合知识图谱的多轮对话引擎”，Transformer要求；当前列表与重新加载后的详情一致。
- 18:30:22.388Z：MJ036671，完整标题“算法工程师（时间序列方向）（2027届秋招）(MJ036671)”，职责“精准的时间序列预测模型”，TensorFlow/PyTorch要求；当前列表与重新加载后的详情一致。

三个详情使用上文相同完整 URL；等待完整标题及职责，不以初始 undefined 空壳视为完成。无登录墙/验证码，无关闭提示；未点击申请。

### 替代方案评估与剩余缺口

已阅读 browserListing 契约，观察到真实 DOM `a.recruit-item-link`、`h4.recruit-title`、`p.recruit-tips`。固定 DOM 方案可以使列表与中文官网一致，但不能修复平台详情核验循环的同页 hash 问题；p.recruit-tips 还包含类型/部门/日期，不能伪装为纯地点。临时评估后恢复原 HTTP 实现，没有留下无效迁移或扩大域名。公开 API 本身可固定解析，不需预加载或 inlineDetails；详情本来有真实独立 anchor，不适用原页展开契约。首页 load 超时但页面及公开列表已读取，不作为登录证据。

可验证的最小修复在平台详情导航层：每条详情使用新页，或保证相同 document 的 hash 路由切换发生完整导航，同时保留全部域名、标题、正文和登录/失效检查。这超出唯一允许修改的候选目录，未修改平台，也未改造/添加官网 URL 参数以绕过验收。不能仅删除阻塞后要求平台重复同一失败流程。

### 分阶段结果

- 离线 fixture、生产及测试语法检查、plugin-audit：本轮重新执行，结果见命令记录；离线通过不代表真实验收。
- 真实抽查：一页列表、三个中文详情核对完成；英文 HTTP 样本未核对，不扩大三个详情预算。
- 启用/页面验收：未执行；候选继续禁用，平台详情导航问题待修复后独立验收。无扫描、AI评估、投递、配置/绑定/信任修改。

本轮最终检查：`node test/smoke.mjs`（从候选目录解析等效路径）PASS；`node --check index.mjs` 和 `node --check test/smoke.mjs` 均 exit 0；`node plugin-audit.mjs plugins.local/company-58ce5cb2-df6b-43f8-bda4-43826e599e58` 输出 audit clean。Ego Lite 空间15已用 finish({keep:[]}) 清理。上述检查不消除 BLOCKED.md 的平台导航缺口。
