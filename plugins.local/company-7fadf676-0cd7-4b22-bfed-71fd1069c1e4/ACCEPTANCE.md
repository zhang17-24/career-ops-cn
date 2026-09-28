# 哔哩哔哩候选开发核验（未完成三条详情验收）

候选：company-7fadf676-0cd7-4b22-bfed-71fd1069c1e4。
时间：2026-09-11 03:05 北京时间；HTTP 核验时间戳 2026-09-10T19:05:24.839Z。
状态：开发代码与离线检查通过，真实详情 2 条确认、1 条待确认；活动阻塞见 BLOCKED.md。未安装、未启用、未修改绑定或信任。平台独立验收尚未执行。

## 入口和证据来源

只读取 portals.yml 的哔哩哔哩条目及其旧版 company-68a3ca39-7edd-4988-a257-531c48bb3471 的代码、测试、验收记录。旧版未修改。旧版公开请求和解析规则作为实现参考，本次重新验证官网。

Ego Lite 独立任务空间 20： https://jobs.bilibili.com/campus/ → 点击“应届生招聘” → https://jobs.bilibili.com/campus/positions?type=3 。入口菜单和前三张职位卡的 raw href 均为 null，resolved href 为空字符串；正常点击后检查 pageInfo 与 listTabs。仅查看这一页列表（10条，总计91条）；未进入实习或社会招聘列表。

观察到官网自建同域 campus API；未发现可复用公共 ATS 证据，故采用企业专用固定解析器。官网正常显示列表，“登录”仅为导航入口，没有登录拦截或验证码。

## 实际公开请求

- GET https://jobs.bilibili.com/api/auth/v1/csrf/token
- POST https://jobs.bilibili.com/api/campus/position/positionList
- 固定公开客户端标识 X-AppKey=ops.ehr-api.auth、X-UserType=2、X-Channel=campus，来自真实页面请求。
- 列表 JSON：`{"pageSize":10,"pageNum":1,"positionName":"","postCode":[],"postCodeList":[],"workLocationList":[],"workTypeList":["3"],"positionTypeList":["3"],"deptCodeList":[],"recruitType":null,"practiceTypes":[],"onlyHotRecruit":0}`。
- 本次独立 Node HTTP 调用候选 provider：一次匿名初始化 GET + 一次第一页 POST，均 HTTP 200，解析成功返回10条。未使用浏览器登录凭证；匿名 CSRF header/cookie 仅保存在内存，无值落盘。没有请求其他域名。禁用重定向。
- 浏览器观察亦确认相同列表 POST 与参数、HTTP 200。跨 Ego heredoc 读取 CDP 响应体失败（No resource with given identifier found），未重复此失败；上述普通 HTTP 验证提供最小公开样本。

## 真实样本和详情检查

|字符串编号|列表标题|官网点击详情地址|本次结果|
|---|---|---|---|
|30401|【B-UP】音视频理解工程师（校招）|https://jobs.bilibili.com/campus/positions/30401|点击新增标签，标题、上海地点、工作职责和工作要求可读；职责涉及视频多模态大模型训练与评测；截止2027-06-30。|
|30368|SLG游戏版本运营【2027届】|https://jobs.bilibili.com/campus/positions/30368|点击新增标签，标题、上海地点、职责和要求与列表描述一致；职责包括SLG赛季规划、版本落地；截止2026-12-31。|
|29738|游戏版本运营（ARPG）【2027届】|旧版点击证据为 https://jobs.bilibili.com/campus/positions/29738|本次真实列表包含相同编号、标题、上海地点，描述涉及版本迭代、研发对接；本次点击未打开详情，未确认有效，也不判为失效。|

第二条初始选择器错误地假设 h3，失败后检查真实 outerHTML（h4）并改为实际锚点文本，一次修正成功，未重试原选择器。第三条点击后无新增标签；一次诊断包装 window.open 观察真实点击参数仍为空，停止，无地址猜测或继续重试。旧版第三条验收不代替本次抽查。

## 映射与范围

positionName→title；id 保留字符串生成已由旧版点击记录及本次前两条点击核实的 /campus/positions/{id} 路由；workLocation→location；positionDescription→description（最多4000字符）；pushTime→postedAt（北京时间毫秒时间戳，未知留空）。返回公司固定为哔哩哔哩。长字符串ID不经过 Number，拒绝不安全数字及异常字段。

每次最多一页10条，忽略 entry.max_pages，无翻页或额外详情请求。空总数与空列表才返回空结果，接口错误、结构变化、非零总数空页、超页大小、非法编号、初始化失败均抛错，无 mock 回退、无模型调用。

## 离线检查

- `node plugins.local/company-7fadf676-0cd7-4b22-bfed-71fd1069c1e4/test/smoke.mjs`：通过；纯内存模拟 ctx，零网络。覆盖字段、长编号、去重、空列表、异常数据、非安全ID、非字符串ID对象、非法总数、10条上限、未知日期、匿名初始化及网络失败，验证固定第一页请求。
- `node --check plugins.local/company-7fadf676-0cd7-4b22-bfed-71fd1069c1e4/index.mjs`：通过。
- `node --check plugins.local/company-7fadf676-0cd7-4b22-bfed-71fd1069c1e4/test/smoke.mjs`：通过。
- `node plugin-audit.mjs plugins.local/company-7fadf676-0cd7-4b22-bfed-71fd1069c1e4`：通过，未修改或削弱审计器。

## 平台启用与页面验收

未执行。候选保持停用；未运行 scan、verify-portals、批量扫描、AI评估或投递。第三条真实详情未确认，BLOCKED.md 保留；平台须独立核验真实列表与三条详情并解决阻塞后决定是否安装替换，失败保留旧版。未核实其他岗位。本次开发使用 Agent Token；日常 provider 仅固定 HTTP+解析，零模型 Token。
# 补充核验（2026-09-11 03:08 北京时间）

主任务使用 Ego Lite 空间17读取此前实际点击得到的 https://jobs.bilibili.com/campus/positions/29738 ，确认标题“游戏版本运营（ARPG）【2027届】”、上海、工作职责及工作要求可读。发布时间2026-09-03，网申截止2026-12-31。第三条补核验完成，无需登录，未投递。原阻塞归档 BLOCKED-resolved.md，下面保留 Agent 原始阶段记录。随后由平台独立重新验收，安装和页面结果以平台回执及总报告为准。
