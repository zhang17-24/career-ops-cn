# 金山办公候选：等待路线审核，未完成开发

候选：`company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0`
记录时间：2026-09-12T14:49:16.089190+00:00

## 官方入口证据

- 配置：`https://join.wps.cn/`；招聘类型：校园招聘。
- Ego Lite 独立任务空间 34 正常打开入口，最终地址：`https://join.wps.cn/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/`。
- 页面标题“金山办公软件 - 校园招聘”；正文含“走进金山办公”“金山办公招聘”。未发现企业身份冲突。
- 岗位入口原始 href 与绝对 href 均为：`https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/jobs?page=1&anchorName=jobsList&project%5B0%5D=100102183`。
- 当前仅批准 `join.wps.cn`，公开链接涉及 `app.mokahr.com`。完整连接链已写入 `ROUTE_REVIEW.json`，没有自行批准或修改 manifest 权限。
- 未使用搜索、未导航产品官网、未猜测 API/职位路径。页面有登录按钮，但没有读取门槛或验证码证据，不认定需要登录。

## 离线测试

以下仅针对平台预创建的初始模板，不能证明真实解析器正确：

- `node plugin-audit.mjs plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0`：通过，audit clean。
- `node plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0/test/smoke.mjs`：通过；零网络示例 fixture，不是真实官网样本。
- `node --check plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0/index.mjs`：通过。

## 真实详情抽查

未进行：列表 0 页，详情 0 条。此次仅核实招聘首页及 DOM 公开导航链接，没有 API 请求证据、真实岗位编号、描述或字段映射。模板测试中的 /jobs 地址不是观察到的官网路线，不得用于生产或验收。分页规则尚未核实。

## 启用及页面验收

未启用、未绑定、未安装，未运行扫描、AI 评估或投递。保留初始代码，停在路线审核；通过上述模板检查不代表开发完成。未读取或保存 Cookie、请求头、个人资料或完整生产响应。

## 续接条件

唯一待办门槛是平台批准本候选路线；没有另加入口发现阻塞。请在本企业页面审核路线并继续原候选，届时保持 ROUTE_REVIEW.json 原样。获批准后再观察一个公开列表端点，优先采用可复用 Moka 固定解析方式，完成真实字段 fixture 与最多三个详情核验。服务端独立验收决定是否安装与替换绑定。


## 2026-09-12T14:54:30Z 原候选续接记录（覆盖上述待路线审核状态）

平台已经批准原路线；ROUTE_REVIEW.json 字节未修改。原候选无 BLOCKED.md、无旧详情 URL 或真实 parser 证据可续用，只有初始模板。未重新搜索入口。当前状态为 HTTP 解析阻塞，详见 BLOCKED.md。

### 真实公开列表取证

Ego Lite 独立任务空间 35。批准入口页面标题为“金山办公软件 - 校园招聘”，同一项目第一页可见 13 个结果、30 行/页。未翻页、未读取其他项目。为了在正常 SPA 导航前安装观察器，返回首页再打开同一已观察的项目 href；同一页有重复加载，不是一次网络请求。首页链接 target=_blank，点击未产生新标签；一次滚动检查未命中，随后使用 instant 滚动确认命中但仍无导航。openOrReuseTab 原始 href 恢复了列表，却在新文档中没有观察器；关闭临时标签，在保留观察器的原标签通过 gotoUrl 导航同一真实 href 后捕获正常 SPA 请求。没有伪造链接或 API 重放。

开发捕获模块初次 import 因运行时 cwd 路径解析失败，改为已知模块的绝对 file URL 后正常；没有重试响应 requestId。观察器读取后已 stop，未保存完整响应、Cookie 或请求头。

观察到的公开请求：

- POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2
- 请求参数：orgId="wps"，siteId="41436"，limit=30，offset=0，needStat=true，jobIdTopList=[]，projectFolderIds=["100102183"]，customFields={}，site="campus"，locale="zh-CN"；sourceToken 与批准的公开入口参数相同。
- HTTP 200；外层字段 data:string、necromancer:string。data 长度 9260，不是可直接解析的 JSON。未输出字符串内容，未尝试解码。
- 未观察到可验证的明文 API description、发布时间或分页响应字段，因此不能编造映射或生产请求实现。界面只有本筛选页 13 条；未确认其他页。

### 真实详情抽查

三个样本链接均直接来自本页 a 元素的公开 href，基础地址为批准入口的 hash 前部分，下列 #/job/ 后缀是 DOM 实际值，不是猜测。导航复用一个详情标签，没有点击申请按钮。

| 名称 | 字符串 ID | 本轮可审计结果 |
|---|---|---|
| 政企营销（AI应用专项）-面向2027届-北京 | 18e7ef00-1329-4766-baf0-b9f023c29e8b | 已导航；批量终端输出未取回，正文未确认 |
| 运营专员（AI应用专项）-面向2027届-广州 | 6fe479d6-33ba-4fc3-80aa-6a2fca93a02e | 已导航；批量终端输出未取回，正文未确认 |
| 运营专员（AI应用专项）-面向2027届-武汉 | 866ff8e0-96a3-487b-a5e2-ac8a413e7be5 | 当前详情页复核：标题、URL UUID、湖北·武汉市、职责和要求可读，无关闭提示；未能与 API 描述比较 |

可确认详情 URL：https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/866ff8e0-96a3-487b-a5e2-ac8a413e7be5

最小正文样本：“制定运营策略并落地运营方案，持续跟踪与分析运营数据效果并提出改进计划”；要求“2027 届本科及以上学历”。不能据此宣称全部岗位有效或三条完整验收通过。

### 离线与启用阶段

移除模板的伪结构映射，改为明确抛错的阻塞实现。测试仅验证零网络且不生成岗位；真实字段、长编号、空数据和分页 fixture 尚未完成。审计及语法结果见下方最终命令记录。

未安装、未启用、未绑定、未运行扫描、AI 评估或投递。平台独立验收尚未进行；BLOCKED.md 是活动阻塞，必须保留旧版。日常目标为零 Token HTTP 固定解析，本候选目前不具备该读取能力。

最终命令记录：

- `node plugin-audit.mjs plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0`：exit 0，audit clean。
- `node plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0/test/smoke.mjs`：exit 0，仅 fail-closed 零网络检查通过。
- `node --check plugins.local/company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0/index.mjs`：exit 0。
