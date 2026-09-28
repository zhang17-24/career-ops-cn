# 虎牙招聘源适配器 · 验收记录

- 候选：`company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5`（仅本目录改动，未启用、未绑定）
- 企业：虎牙（广州虎牙信息科技有限公司，页脚版权 + 首页标题「首页-虎牙招聘」核对一致）
- 入口与类型：`portals.yml` 配置 `https://hr.huya.com/` → 社会招聘（社招；校招入口未适配）
- 核验时间：2026-09-21 00:18–00:33 CST（2026-09-20T16:18–16:33Z）
- 运行方式：HTTP 固定解析 + 固定详情路由，零 Token、不翻页、不投递、无凭证

## 一、路线与来源链（实际观察）

1. `https://hr.huya.com/` → 跳转 `https://hr.huya.com/home`（标题「首页-虎牙招聘」）
2. 顶部导航「社会招聘」实际 href → `https://hr.huya.com/SocialRecruit/allPosition`（8 个职位类别卡片）
3. 正常点击可见类别卡片「技术类」（`.position-content-item`，`scrollIntoView({block:'center'})` 后 `elementFromPoint` 命中该元素）→ `https://hr.huya.com/SocialRecruit/recruitList?zhineng=15181`，页面显示「显示1-10 共 20 个职位」
4. 该列表页正常加载产生公开 GET → `https://api.mokahr.com/v1/jobs/huya?mode=social&limit=100`（Moka 公开 ATS，可复用）
5. 列表岗位卡片真实 anchor href → `https://hr.huya.com/SocialRecruit/detail/<uuid>`（同路由经三个真实岗位核对）

精确路线与证据已写入本目录 `ROUTE_REVIEW.json`（`allowedHosts: hr.huya.com, api.mokahr.com`）。

**方法记录（取证顺序与纠正）**

| 步骤 | 方法 | 证据 | 结果 |
| --- | --- | --- | --- |
| 1 | 打开配置招聘首页 + 快照 | 标题/页脚/导航 href | 身份一致，进入社招列表 |
| 2 | 页面资源条目观察（`performance.getEntriesByType('resource')`） | `hr.huya.com/api/social/job/getJobList` | 该接口只返回 8 条职位类别（opid/name/icon），不是岗位列表；转向列表页实际点击导航 |
| 3 | 点击类别卡片进入真实岗位列表 | URL `recruitList?zhineng=15181`，出现岗位 anchor | 成功，拿到岗位列表页 |
| 4 | `publicCapturePreload` + `Page.addScriptToEvaluateOnNewDocument` 取证公开列表请求 | 200 / code 0 / total 107 / jobs 100 | 确认端点、参数与字段 schema，随后 `Page.removeScriptToEvaluateOnNewDocument` + `stop()` 清理 |
| 5 | 真实点击 + 直接打开已观察 href 核对三个详情 | 三个详情页标题、地点、正文 | 与 API 一致（见下表） |

## 二、一页列表（真实响应）

- 请求：`GET https://api.mokahr.com/v1/jobs/huya?mode=social&limit=100`（`redirect: 'error'`，匿名、无 Cookie/凭证）
- 响应：HTTP 200，`code: 0`，`total: 107`，本页 `jobs: 100` 条；`status` 取值 `open`/`pause`
- 插件解析结果：`81` 条（仅返回 `status === 'open'`，暂停岗位不作为结果；ID 去重后 81 个，无空地点）
- 字段映射：`id`(字符串 UUID，不经过 Number) → `id`；`title` → `title`；`locations[].city`（缺省回退 province）→ `location`；`publishedAt`/`openedAt` → `postedAt`；`description`(HTML 转纯文本) → `description`；`url` = 官网详情路由 `https://hr.huya.com/SocialRecruit/detail/<id>`
- 最小样本（脱敏，仅名称/编号/城市）：`38ef2125-4ae4-43c2-b21a-abfaf47f3a3d 内容运营实习生（游戏直播方向）· 广州市`；`88c00476-d470-4070-83c9-6172122f485c 直客商务拓展 · 佛山市、深圳市`；`f5903afe-6ecd-43a6-a408-f0c9e5122634 海外广告变现与投放策略优化运营 · 深圳市、佛山市`

## 三、三个真实详情核验

| # | 编号（字符串） | 列表标题 | 打开方式 | 详情地址 | 详情标题 | 地点/日期 | 正文核对 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `4195ef65-a1c3-4c15-b186-ff231a9ab568` | 数据开发工程师 | 列表卡片真实 anchor 点击（新标签） | `https://hr.huya.com/SocialRecruit/detail/4195ef65-a1c3-4c15-b186-ff231a9ab568` | 数据开发工程师 | 深圳市 · 技术类 · 2026年09月10日 | 「岗位职责：- 负责游戏广告投放发行场景的数据体系建设…」与 API `description` 一致 |
| 2 | `319087fd-7eec-49db-9494-8fa60f8cf5f1` | 高级后台开发工程师 | 直接打开已观察 href（同一详情标签复用） | `https://hr.huya.com/SocialRecruit/detail/319087fd-7eec-49db-9494-8fa60f8cf5f1` | 高级后台开发工程师 | 深圳市 · 技术类 · 2026年09月10日 | 「岗位职责：- 负责游戏广告投放发行平台后台系统建设…」与 API 一致 |
| 3 | `87ce8bdc-1d27-44c4-9fb3-a5e25b2e4c33` | iOS开发工程师 | 直接打开已观察 href | `https://hr.huya.com/SocialRecruit/detail/87ce8bdc-1d27-44c4-9fb3-a5e25b2e4c33` | iOS开发工程师 | 广州市 · 技术类 · 2026年08月21日 | 「岗位职责：1.负责虎牙游戏发行中台iOS端产品功能的设计…」与 API 一致 |

三个编号均在本次真实列表响应中存在且 `status: 'open'`；详情页未出现登录、短信、验证码或岗位关闭/404 提示（页面含「申请职位」按钮，未点击）。

## 四、离线测试与静态检查

- `node --check plugins.local/company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5/index.mjs` → 通过
- `node plugins.local/company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5/test/smoke.mjs` → `offline fixture passed: mapping, string UUIDs, paused rows, multi-city, empty, malformed, duplicates, limit and request failure`（零网络，fixture 仅存测试路径）
- `node plugin-audit.mjs plugins.local/company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5` → `✓ audit clean`
- fixture 覆盖：字段映射、UUID 字符串不丢精度、多城市、暂停岗位过滤、空列表、异常 code/结构、重复编号、超页上限、请求失败透传

## 五、限制与未完成事项

- 只读取单一页（limit=100）：`total` 为 107，首页之外的岗位不在本次结果内；不翻页、不批量扫描。
- 暂停/关闭岗位（`status !== 'open'`）按规则过滤，不代表官网未展示。
- 只适配社会招聘；校园招聘入口（`campusRecruit`）未接入。
- 详情正文取自列表公开接口的 `description` 字段，已与三个真实详情页 DOM 正文逐条核对；若官网改为详情页异步加载正文，需重新取证。
- 插件保持停用、未绑定，未运行 `scan.mjs`/`verify-portals.mjs`/批量扫描/AI 评估，未提交任何申请；启用与绑定由平台独立验收后执行。
- 未保存任何凭证、Cookie 或个人数据；证据仅保留最小公开样本。

**结论分列**：离线 fixture 通过；一页真实列表已读取（81 个在招岗位）；三个真实详情已逐条核对通过；启用/页面验收未进行（不在本次授权范围，由平台执行）。
