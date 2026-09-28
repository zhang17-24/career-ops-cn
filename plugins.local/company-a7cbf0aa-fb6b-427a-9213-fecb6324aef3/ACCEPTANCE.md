# 当前状态：开发验证完成，等待平台独立验收

候选 `company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3`；仅百度；保持停用，未安装、未绑定。
本次 UTC 取证时间 2026-09-18T16:22:19Z 至 16:23:46Z（北京时间 2026-09-19 00:22–00:23）。下方历史记录为旧状态，以本节为准。

## 批准路线与实现选择

平台本轮提供的批准时间为 2026-09-18T16:17:41.941Z，digest 为 `53edb975da58d4b7291c8a1dd3653db6f45a5a36b3c14a6d1af497c217150cf3`。ROUTE_REVIEW.json 原字节未修改；仅使用批准的 `talent.baidu.com`。原路线等待阻塞已解除并归档为 BLOCKED.resolved.md。

配置官方校招首页 `https://talent.baidu.com/jobs/campus` → 已批准列表 `https://talent.baidu.com/jobs/list`。续接直接读取已批准入口，没有重新发现或申请新域名。

使用百度官网 SSR 内嵌数据的固定解析，未发现需采用公共 ATS 的证据。生产仅一次匿名 GET 列表 HTML，使用平台 ctx.fetch、redirect:error；不加载 CDN、启动浏览器或调用模型，不导入 fixture，不请求 getPostListNew，不执行官网脚本。

## 方法、证据与纠正

1. Ego Lite 独立任务空间 7 正常打开已批准列表，正文为百度校园招聘、158 条职位信息，首屏 10 个岗位。页面“登录”是入口，没有强制登录/验证码。
2. 按已观察端点 `https://talent.baidu.com/httservice/getPostListNew` 注册 publicCapturePreload；先 Page.enable，再精确文档注册。同 URL goto 后未捕获，纠正为 reload；预加载 installed=true，但 record 为空，performance resource entries 为空。未读取或重复 getResponseBody、未重放请求。两次注册均在 finally 删除并 stop。最初辅助模块导入路径错误改用 pathToFileURL，未涉及网络权限变更。
3. 缺口重新评估：岗位已在 DOM，源码显示 `window.__USE_SSR__=true` 和 `window.__INITIAL_DATA__`。listData 自带 listDetailData，故切换到官方 HTML 内嵌数据，捕获 XHR 不再必要。browserListing 要求岗位 anchor，但该页为 div 卡片；inlineDetails 的 tr/summary 展开契约也不适用。已有 HTTP SSR 路线，无需申请额外 CDN 权限或使用浏览器生产路线。
4. 局部 React 卡片 onClick 公开源码明确为 `"/jobs" + "/detail/" + c + "/" + a`，无推荐参数时 window.open(l)。只读取这段导航函数，未下载 bundle 或分析签名。下面三个真实点击的地址分别与 listData.recruitType=GRADUATE 和 postId 完整对应，才采用该固定映射。
5. 匿名 HTTP HTML 初次整体 JSON.parse 因无关 detailData 中的 JavaScript undefined 失败；这不是 HTTP 不可读。修正为仅抽取并严格 JSON.parse listData（不执行脚本、不替换任意代码）。Node 错误曾自动回显公开 SSR 文本，未将该响应写入候选或 fixture；最终错误包装不会回显响应正文。纠正后同一列表 GET HTTP 200，10 条解析成功，三条样本名称/ID/地点与 Ego 一致。两次都是同一首屏，未翻页。

## 数据契约与最小样本

真实源：`GET https://talent.baidu.com/jobs/list`，HTTP 200；最终读取时间 2026-09-18T16:23:46.684Z。
官方数据：`listData.listDetailData[]`；`recruitType=GRADUATE`、`pageNum=1`、`pageSize=10`、`total=158`、`keyWord=''`、`projectType=''`。
字段映射：postId → 原样字符串 id；name → title；workPlace → location；publishDate → postedAt 毫秒时间戳；workContent + serviceCondition → 带“工作职责/职责要求”标题的纯文本 description。updateDate 只用于官网展示，不冒充发布时间。
拒绝错误 HTTP、缺失 SSR/JSON、企业标题不符、招聘类型/分页变化、缺失必要字段、非字符串/重复 ID；total=0 且空数组才作为明确空结果。无硬编码岗位兜底。仅首屏最多 10 条，即使 entry.max_pages 更大也不翻页；158 是页面总量，未声称覆盖全部。

| 字符串 postId | 标题 | 地点 | 职责最小摘录 |
|---|---|---|---|
| 545e6823-28d2-4cb5-aba2-3c520a31b4e0 | 北京-网络研发工程师(J100700) | 北京市 | 负责行业领先的超大规模云基础设施网络平台研发 |
| 72145a13-5eb1-41ce-8853-d00aa7369281 | 北京-后端开发工程师(J100737) | 北京市 | 负责百度核心产品功能和架构开发 |
| 423c0fa3-a0f3-4def-a882-7466d3685b79 | 北京-AI产品经理(J100665) | 北京市 | 负责AI/大模型方向产品的规划、设计与迭代 |

## 真实详情抽查：3/3

每次点击前对实际卡片 scrollIntoView(center)，等待矩形在视口内且 elementFromPoint 命中，然后正常 Ego click。每次检查列表 page.info 和 task.tabs，新标签初始空白时等待实际详情数据，未把空白当作失败。每个详情检查后立即关闭，最后清理整个任务空间。

- 2026-09-18T16:22:19.476Z：`https://talent.baidu.com/jobs/detail/GRADUATE/545e6823-28d2-4cb5-aba2-3c520a31b4e0`
- 2026-09-18T16:22:22.032Z：`https://talent.baidu.com/jobs/detail/GRADUATE/72145a13-5eb1-41ce-8853-d00aa7369281`
- 2026-09-18T16:22:24.701Z：`https://talent.baidu.com/jobs/detail/GRADUATE/423c0fa3-a0f3-4def-a882-7466d3685b79`

三条均满足：detailData.isValid=true；详情标题及 postId 与首屏样本严格相等；workContent/serviceCondition 与列表内嵌字段严格相等；可见 DOM 在去除空白及字面换行后含完整职责及要求。没有出现岗位关闭、404、登录拦截或验证码。未点击申请按钮；抽查不证明另外七条或全部岗位当前可投递。

## 离线测试及静态检查

以下命令均 exit 0：

- `node plugin-audit.mjs plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3`：audit clean。
- `node --check plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/index.mjs`。
- `node --check plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/test/smoke.mjs`。
- `node plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/test/smoke.mjs`：零网络；字段映射、SSR 其他字段 undefined、长字符串 ID、同名不同 ID、重复 ID 拒绝、空数据与异常区分、范围变化、错误 HTTP/连接异常、单次首屏读取均通过。

fixture 只在 test/ 内，使用最小合成正文，不是生产响应或真实详情证明。离线通过与上述真实核验分别记录。

## 启用及页面验收：未执行

无未解决开发阻塞。未运行 scan.mjs、verify-portals、批量扫描、AI 评估或申请流程；未修改旧版、配置、绑定、信任、锁文件或其他企业。候选仍停用，服务器须独立核验真实一页列表和三个详情后决定是否安装替换；失败保留旧版。未宣称平台验收通过。

日常读取为确定性 HTTP + 解析，零模型 Token；本次 Agent 开发消耗开发 Token。Ego 任务空间已调用 finish({keep:[]}) 清理。

---

## 历史记录（保留，不代表当前阻塞）

# 百度候选续接记录

候选：`company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3`

核验时间：2026-09-18T15:55:47Z。状态：等待路线审核，未完成开发，未安装或启用。

## 既有成果与范围

开始时目录仅含生成的 index、manifest、说明及 smoke 模板，没有 ACCEPTANCE.md、BLOCKED.md 或路线申请。未重建候选，未修改旧版本、配置、绑定或信任。当前生产权限只有 talent.baidu.com。

## 实际入口与方法

- 配置入口 `https://talent.baidu.com/jobs/campus` 可加载，标题及正文为“百度校园招聘”“改变世界？不妨一试！”。身份一致，不需要额外搜索产品官网。
- DOM 检查发现“职位”是 `li.header-menu-item`，无 anchor href；未猜测路由。实际元素 scrollIntoView 后检查矩形 x=754,y=23,w=60,h=14，在视口内且 elementFromPoint 命中，然后正常点击。
- page.info 与 task.tabs 均确认同一标签实际进入 `https://talent.baidu.com/jobs/list`。初始快照只有壳，随后读取显示“校园招聘”“面向全球2027届毕业生”“158条 职位信息”。未翻页；158为页面显示总数，不能解释成已抓取158个岗位。
- 页面存在“登录”入口，但没有出现强制登录或验证码。首页“度小招”组件显示加载失败，不据此认定招聘列表不可读。
- 正常导航公开 XHR 包括 `https://talent.baidu.com/httservice/getPostListNew`、`https://talent.baidu.com/httservice/getSearchCompDicInfo?recruitType=GRADUATE` 和配置请求。没有获取或保存请求头、Cookie、用户信息、完整生产响应，没有 API 重放。
- 观察到页面引用 talent-offical-static-prod.cdn.bcebos.com 的脚本资源；尚未采用 browserListing，不申请无证据证明生产 HTTP 读取所必需的额外资源域名。如后续需要浏览器生产路线，必须另行审核必要资源域名。

## 路线审核及后续方法

已保存官网校招首页 → 正常点击职位 → 实际列表地址 → 公开 XHR 的连通证据于 ROUTE_REVIEW.json。入口从 /jobs/campus 变成 /jobs/list，依 SOP 即使同域也先审核，当前未获得该变更的批准，因此停止开发。没有把缺少产品主页反向链接当成额外阻塞。

待平台提供批准入口后，优先用已观察 getPostListNew 端点的 publicCaptureScript 在正常 SPA 导航前捕获一次；若请求属于初始加载，则 Page.enable 后使用精确文档 publicCapturePreload，并 finally 清理。尚无响应 schema，不能编造解析字段或详情 URL。若 HTTP 不可读而 DOM 可读，再根据真实 DOM 评估 browserListing；原页展开则检查 inlineDetails 契约。这些替代路线尚未失败，但不能跳过当前入口审核继续实现。未枚举接口、下载分析 bundle 或逆向签名。

## 分阶段结果

### 离线检查

- `node plugin-audit.mjs plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3`：通过，audit clean。
- `node plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/test/smoke.mjs`：已有模板测试通过，零网络，仅证明模板行为，不能证明百度字段映射。
- `node --check plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/index.mjs`：通过。

生产代码仍是原生成模板，不是已实现的百度适配器。真实固定解析、字符串 ID、空结果与异常数据及分页 fixture 仍待批准后补齐；测试届时使用 `import { strict as assert } from 'node:assert'`。未将 fixture 导入生产。

### 真实详情抽查

0/3，未访问任何详情，未核实具体岗位名称、字符串编号及职责。没有宣称任何岗位当前可投递。已观察一个列表页面，但尚无最小岗位响应样本。

### 启用及页面验收

未执行。保持候选禁用，未运行 scan、verify-portals、批量扫描、AI 评估或申请流程。后续由平台独立核验一页列表与三个详情，再决定安装和绑定；当前不可安装。
