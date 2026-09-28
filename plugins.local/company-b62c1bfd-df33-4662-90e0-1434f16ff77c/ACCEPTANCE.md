# 完美世界校招适配：开发验证记录

候选：company-b62c1bfd-df33-4662-90e0-1434f16ff77c。核验日期：2026-09-19；最终真实 DOM 检查时间 2026-09-19T05:12:05.244Z。保持停用，未安装、未绑定、未更新信任。企业公开托管授权由任务提供，候选文件不授予权限。

## 路线恢复与方法选择

- 原配置 https://campus.wanmei.com/ 在 Ego Lite 报 ERR_CERT_COMMON_NAME_INVALID，未绕过证书检查；不是职位过期。
- 一次 Bing 搜索“完美世界 官网 招聘”，仅作导航线索。读取搜索所得 https://www.wanmei.com/enterprise/recruitment.htm，发现旧式招聘页面和 2008 导航，不以其岗位作为当前校招数据。
- 同次搜索提供 https://jobs.games.wanmei.com/；实际打开后标题为“完美世界招聘官方网站”，正文、集团品牌、页脚及关于完美链接一致。此招聘首页的“校园招聘” raw/resolved href 均为 https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN 。招聘首页作为恢复后的官方来源，未伪造旧入口到新入口的重定向。
- 打开上述 Moka 首页，首次 load 超时但文档已提交。读取当前页面后确认标题“完美世界 - 校园招聘”，首页正文可读；没有据超时认定登录或关闭。沿实际“校招职位” href 进入同一列表 #/jobs。
- Moka 公开 ATS 优先：观察实际 jobs/v2 请求后，用 adapter-network-capture.mjs 的 publicCaptureScript 在首页 → #/jobs SPA 导航前安装一次捕获。首次本地模块导入路径格式错误，修正为 file URL 后执行成功；不是重复网络重放。HTTP 200 的顶层键为 data、necromancer；data 为不透明字符串，不尝试解码、签名、其他端点。捕获已 stop，未存响应全文或凭证。
- HTTP 固定 JSON 解析不适用，已有可读 DOM 和真实岗位 anchors，因此切换平台支持的 browserListing。无需 preload（SPA 捕获已成功）、inlineDetails（已有独立详情 anchor）或猜测卡片路由。生产复用平台匿名浏览器 reader；没有自建浏览器执行器或 Ego CLI。
- 选择器直接取自 DOM，并使用平台原函数 extractBrowserListing 在当前 Ego 页检查。主列表30条；排除“最新职位”侧栏，不翻页。30个字符串 ID 全部唯一。不是空结果兜底。

## 公开请求与字段

列表 URL：https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/jobs

正常页面公开请求：POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2

公开查询体（观察记录，不由插件重放）：
`{"orgId":"pwrd","siteId":"172467","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"customFields":{},"site":"campus","locale":"zh-CN"}`

实际使用 DOM 字段：主卡片 `a.link-txmgVOCVz9:has(.card-content-eGHrYZMEX6)`；名称 `.title-u2qk9xX9Ie`；地点 `.info-tPG_0QGbhl .sd-foundation-body-secondary-v3EXx:last-child .no-adaptive-tooltip`；URL 为 anchor 的实际绝对 href，ID 为其 #/job/ 最后一段原始字符串。company 为本候选目标“完美世界”，不输出未核实的额外字段。页面发布日期为2026-09-10，但本 reader 不输出 postedAt 或 description。

ROUTE_REVIEW.json 保存已观察的招聘首页 → Moka 首页 → 列表 → API/资源链。资源域精确声明 static-ats.mokahr.com、public-cdn.mokahr.com、cstaticdun-v6.126.net；后者加载了普通脚本，未出现验证码挑战。Sentry 遥测未纳入必要域名。匿名运行是否有其他必需资源，由平台独立验收确认。

## 真实详情抽查（开发阶段）

直接打开本次真实列表 DOM 中观察到的完整 href，复用一个详情标签；未猜路径、未点投递。每条等待完整职责及任职要求正文，不以标题或HTTP 200代替。以下名称、地点、URL中原始字符串编号均对应列表；无登录、验证码、下线或404提示。

| 标题 | 字符串 ID | 地点 | 最小职责证据 |
|---|---|---|---|
| 27届秋招-数值策划（MMO） | de498ba8-660d-4225-85cb-92a7fc892c0d | 北京市 | 参与MMORPG现有玩法、系统及战斗内容维护优化；本科及以上要求 |
| 27届秋招-角色原画（国风玄幻） | 0e44b052-04aa-492e-a556-452bcc464c96 | 北京市 | 导师指导下完成角色、场景、道具原画设计细化；美术相关专业要求 |
| 27届秋招-品宣视觉设计师 | aa63b164-3376-4ad1-a865-31eb772930b0 | 广东·广州市 | 游戏买量素材、应用商店视觉包装；视觉设计及工具使用要求 |

实际详情地址：
- https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/de498ba8-660d-4225-85cb-92a7fc892c0d
- https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/0e44b052-04aa-492e-a556-452bcc464c96
- https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/aa63b164-3376-4ad1-a865-31eb772930b0

## 离线测试与审计

以下命令均通过（2026-09-19）：
- `node plugins.local/company-b62c1bfd-df33-4662-90e0-1434f16ff77c/test/smoke.mjs`
- `node --check plugins.local/company-b62c1bfd-df33-4662-90e0-1434f16ff77c/index.mjs`
- `node --check plugins.local/company-b62c1bfd-df33-4662-90e0-1434f16ff77c/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-b62c1bfd-df33-4662-90e0-1434f16ff77c`：audit clean。

fixture 仅在 test/smoke.mjs 内，零网络；覆盖三条字段映射、超长字符串ID、同名不同ID、空/异常/重复/超限拒绝、单次 reader 委托与错误传播。生产不导入测试、不返回硬编码岗位。离线 fixture 不代表匿名浏览器实时验收通过。

## 启用及页面验收：待平台独立执行

开发阶段已核对同一列表第一页及三个详情；平台尚未独立读取匿名列表、核验三个详情、安装或切换绑定。不得据此文件宣称启用成功。失败应保留旧版本。

页面总计36条，当前第一页30条，不覆盖其余6条；除上述三条外，其余详情未核实。DOM build 类名可能变化，变化后报错并重新适配。空列表也按“未确认”抛错，不表示零岗位。零 Token 指日常不调用模型，浏览器仍需运行资源，本次开发使用了模型。

未运行 scan.mjs、verify-portals.mjs、批量扫描、AI评估、申请流程。未更改旧版本或配置。Ego任务空间21已 finish({keep:[]})，临时详情标签已关闭，捕获器已清除。当前无未解决开发阻塞；无 BLOCKED.md。
