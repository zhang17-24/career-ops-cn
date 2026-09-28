# 唯品会 招聘源适配器 — 验收记录（候选：未启用）

- 候选 id：`company-56286487-d911-4432-9a84-da8a2a66dc74`
- 目标企业：唯品会（portals.yml 第 162 行，`careers_url: https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039`，校园招聘）
- 授权模式：企业公开适配托管授权（服务端保存于 2026-09-20T16:42:20.302Z），路线记录见同目录 `ROUTE_REVIEW.json`
- 核验时间：2026-09-21 01:00–01:06 CST（2026-09-20T17:00–17:06Z）
- 状态：候选仍为**停用未绑定**；平台独立验收通过后才由服务端安装与替换绑定。本文件不声明已安装或已启用。

## 1. 能力选择与证据（按证据切换能力）

| 方法 | 证据 | 结果 |
| --- | --- | --- |
| Ego Lite 打开配置招聘首页 | 标题「唯品会（中国）有限公司 - 校园招聘」，URL `app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/` | 身份一致；首屏无职位，仅图片链接指向 `#/jobs` |
| 公开路由 `#/jobs`（SPA 哈希路由） | 页面显示「31 结果」，渲染 38 个 `#/job/<uuid>` anchor（含重复渲染副本），28 个带可见地点 | 列表可读 |
| HTTP 固定解析 | 列表为 SPA 异步渲染，接口返回封装数据；本轮未做 API 取证、未解析封装、未枚举端点 | 未采用；改用平台 `browserListing` |
| 平台固定 DOM reader（`manifest.browserListing`） | 用 `adapter-browser-listing.mjs` 的 `extractBrowserListing` 逻辑在真实页面内试跑，读到 28 条，title/location/url 齐全，无登录或验证码元素 | 采用 |

未使用 inlineDetails（有独立详情路由，无需展开式）；未使用网络捕获（页面不依赖可固定解析的 JSON，且不需要新增端点授权）。

## 2. 列表证据（一页）

- `listUrl`：`https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/jobs`
- 选择器（全部来自实际 DOM，已用平台读取逻辑在真实页面验证）：
  - `linkSelector`：`a[href^="#/job/"]:has(.no-adaptive-tooltip)`
  - `titleSelector`：`[class^="title-"]`
  - `locationSelector`：`.no-adaptive-tooltip`
  - `identityText`：`唯品会`（页面 `document.title` 含「唯品会（中国）有限公司 - 校园招聘」）
- 命中 28 条（页面显示 31 结果；3 条卡片无可见地点，被 `:has()` 过滤，不产出无地点岗位）。此前使用的 CSS-Module 哈希类名选择器（`.jobs-AkItzswt6b` / `.link-txmgVOCVz9` / `.title-u2qk9xX9Ie`）同一时刻读到完全相同的 28 条，但哈希类名会随前端发版变化，故改为 `href` 路由前缀 + 类名前缀的稳定写法。
- 全量校验：用平台 `normalizeBrowserJobs` 的等价逻辑跑完 28 条——去重后 28 条、编号无重复、同 URL 无字段冲突、无空标题/空地点（2026-09-20T17:05Z）。
- 最小公开样本（3 条，均为真实读取值）：

| 编号（字符串） | 名称 | 地点 |
| --- | --- | --- |
| `53bb03c1-8fcd-4cf2-bf80-b10af7ead4d0` | 【2027届物流】物流总部校招生 | 广东·广州市 |
| `cfe6b0e2-86a5-4afe-b7c5-f462f05dc574` | 【2027届物流】东北RDC校招生 | 辽宁 |
| `6d21b156-54e2-4f53-9b5b-8017b5fccf0a` | 【2027届秋招】测试开发工程师 | 广东·广州市 |

## 3. 详情抽查（三个真实岗位，均来自列表实际 href）

| # | 详情 URL | 列表名称 / 编号 | 详情核对 |
| --- | --- | --- | --- |
| 1 | `https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/job/53bb03c1-8fcd-4cf2-bf80-b10af7ead4d0` | 【2027届物流】物流总部校招生 / `53bb03c1-8fcd-4cf2-bf80-b10af7ead4d0` | **真实点击**（scrollIntoView → elementFromPoint 命中卡片 → click）后地址栏变为该路由，无新标签；详情标题一致，栏目「物流/仓储\|广东·广州市」，正文含「岗位职责 … 任职要求 …」 |
| 2 | `https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/job/cfe6b0e2-86a5-4afe-b7c5-f462f05dc574` | 【2027届物流】东北RDC校招生 / `cfe6b0e2-86a5-4afe-b7c5-f462f05dc574` | 详情标题一致，发布日期 2026-09-07，正文可读（岗位职责/任职要求） |
| 3 | `https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/job/6d21b156-54e2-4f53-9b5b-8017b5fccf0a` | 【2027届秋招】测试开发工程师 / `6d21b156-54e2-4f53-9b5b-8017b5fccf0a` | 详情标题一致，地点广东·广州市，正文含「团队介绍 … 【岗位职责】…」 |

三个详情均未出现登录、短信或验证码拦截，未出现职位关闭/下线/404。未提交任何申请。

## 4. 离线测试（零网络、零 Token）

```
node plugin-audit.mjs plugins.local/company-56286487-d911-4432-9a84-da8a2a66dc74   # ✓ audit clean
node --check plugins.local/company-56286487-d911-4432-9a84-da8a2a66dc74/index.mjs  # syntax ok
node plugins.local/company-56286487-d911-4432-9a84-da8a2a66dc74/test/smoke.mjs
# PASS: offline fixture mapping, string IDs, duplicate IDs, empty/malformed data, single-page bound, error propagation. No network.
```

覆盖：manifest 选择器与 `listUrl`/`allowedHosts` 一致性；字符串编号不经过 Number（含超长编号）；空列表、重复编号、企业身份不符、非法 URL、超 100 条、异常数据全部抛错不产出伪岗位；`ctx.browserJobs` 错误向上传播。另用三个真实读取行验证 `preserveIds`，输出 title/url/company/location/id 完全对应（未写入仓库）。

## 5. 限制与未完成

- 仅读取单页列表（页面自报 31 结果，本适配器产出其中 28 条可见地点岗位），不翻页、不补全量；无地点岗位被有意排除。
- 仅浏览器读取路线验证；HTTP 固定解析未验证（接口数据封装，未解码、未枚举端点）。
- 详情为 SPA 哈希路由，需官网 JS 正常渲染；如前端发版改变 `#/job/` 路由、`.no-adaptive-tooltip` 或 `title-` 类名前缀，读取会失败并报“未确认”，不会回退示例数据。
- `cstaticdun-v6.126.net`（易盾静态资源）在 `allowedHosts` 中；实测屏蔽它后列表仍渲染 28 条，非必需资源。`sentry-fe.mokahr.com` 未列入（实测屏蔽后列表仍渲染）。
- 未启用、未绑定、未安装、未运行扫描或 AI 评估；是否安装与绑定由平台独立验收后决定。
- 未保存任何凭证或个人数据；临时脚本已在 `$TMPDIR` 使用并删除。
