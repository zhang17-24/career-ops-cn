# ACCEPTANCE — jd-campus 京东校招招聘源适配器

状态：**开发与审核（默认停用）**. 本插件已安装但**停用且未绑定**，等待用户从 Web 适配器管理器中审核启用。
完成声明按 SOP 二阶段拆分：**离线测试** ✅ / **真实详情抽查** ✅ / **启用及页面验收** ⏳ 待用户授权.

---

## 1. 入口及招聘类型

| 项 | 值 |
|----|----|
| 企业 | 京东 |
| 入口 URL | `https://campus.jd.com/`（京东校招 SPA，hash 路由） |
| 招聘类型 | 校招应届（`type=present` 板，页面展示「职位推荐 126 个」；同站还有 TGT / 应届生（JDS、TET、新锐之星）/ 实习生等专项） |
| 列表 API | `POST https://campus.jd.com/api/wx/position/page?type=present` |
| 详情路由 | `https://campus.jd.com/#/details?id=<publishId>`（观察真实卡片点击所得） |
| 详情 API | `POST https://campus.jd.com/api/wx/position/detail/<publishId>`（已核实，但适配器**不调用**，见下） |
| 适配类型 | 企业自建 API（`campus.jd.com/api/wx/...`，字段名 `publishId`/`reqId`/`positionName`/`requirementVoList` 等均为京东自有，非 Greenhouse/Lever/Ashby/Moka 等通用 ATS，故做企业专用适配器） |

## 2. 核验时间

**2026-09-10**（Ego Lite 在线观察与真实请求）。列表 `totalNumber = 126`；`publishTime` 为毫秒级 epoch。

## 3. 实际列表请求（真实，非 mock）

```
POST /api/wx/position/page?type=present
Host: campus.jd.com
Content-Type: application/json

{"pageSize":10,"pageIndex":0,"parameter":{"positionName":"","planIdList":[],"jobDirectionCodeList":[],"workCityCodeList":[],"positionDeptList":[]}}
```

- 响应：HTTP 200，`{ "success": true, "body": { "totalNumber": 126, "pageCount": 0, "items": [ ... ] } }`，`items` 长度 10。
- 无需鉴权、无额外头；仅声明 `campus.jd.com` 一个 egress 主机（`manifest.json` 的 `allowedHosts`）。
- 观察来源：Ego Lite 捕获的站点自身 `fetch`（SPA 校招列表页首次加载即发此请求）。列表项**已自带完整 JD**（`workContent` + `qualification`）及逐需求 `requirementVoList[].workCity`，故适配器单次列表请求即可，不逐条拉取详情。
- `publishId` 为字符串保留（如 `"9329"`），适配器全程以字符串处理，不经过 Number。
- 每页 `pageSize` 为 10（服务端按 10/页返回）；`pageIndex` 从 0 开始；`body.pageCount` 恒为 0（不可用），分页依 `totalNumber` 或「单页不足」终止。

## 4. 真实详情抽查（最多 3，使用观察到的官方点击路由，不猜路径）

列表第 1 页真实返回的前三条（`publishId` + `positionName`），点击官方路由 `#/details?id=<publishId>` 核对详情标题。

| # | 列表标题 | publishId（字符串） | 详情 URL（观察路由） | 详情页标题 | 结果 |
|---|---------|----------------------|----------------------|-----------|------|
| 1 | 销售拓展 | `9329` | `https://campus.jd.com/#/details?id=9329` | 销售拓展 | 匹配 |
| 2 | 营业部/集配站站长 | `9257` | `https://campus.jd.com/#/details?id=9257` | 营业部/集配站站长 | 匹配 |
| 3 | 仓/场地经理 | `9277` | `https://campus.jd.com/#/details?id=9277` | 仓/场地经理 | 匹配 |

- 3 个样本均满足：列表名称 / 字符串编号 / 实际点击地址 / 详情名称一一对应。
- 更多真实抽检：无；样本不足即如实说明。
- 备注：SPA 在同路由下「仅换 id」不会重新拉详情（内容会停留在上一个 id），核对时采用「先到 `#/jobs` 再进 `#/details?id=<id>`」强制重新装载，标题均与列表一致。

### 生产路径复跑（真实加载器路径）

用引擎的 `buildCtx`（含 `allowedHosts` + SSRF 校验的 `ctx.fetchJson`）直接调用插件 `fetch`，对真实 API 以 `max_pages: 1` 复跑：

- 返回 10 个岗位，耗时 282ms；第 1-3 条 title/url/location/postedAt 与上表 3 个详情完全一致 → 真实加载器路径可用，且不越出声明的 egress 主机 `campus.jd.com`。

## 5. 离线 fixture 测试（零网络）

```
node plugins.local/jd-campus/test/smoke.mjs
→ ✓ jd-campus provider fixture smoke ok
```

覆盖（全部零网络，使用内存 fixture）：
- 字段映射：列表 payload → 规范化 Job[]（title/url/company/location/postedAt/description）。
- 字符串 ID 不丢位：publishId `9329` 以字符串保留并经 URL 编码；不被 Number 强转。
- 请求体确定：POST、`Content-Type: application/json`、URL 末尾 `?type=present`、`pageSize:10`、`pageIndex:0`、`parameter:{positionName:'', planIdList:[], jobDirectionCodeList:[], workCityCodeList:[], positionDeptList:[]}`。
- 地点提取：`requirementVoList[].workCity` 的省份去重（`上海市-上海市`、`北京市-北京市`、`陕西省-西安市` → `上海市/北京市/陕西省`；重复项去重）。
- 空列表 → 空结果，无幻影岗位。
- 缺 `body` / 缺 `body.items` → 空结果，不抛错。
- 异常数据：缺 title / 缺 publishId / 空 id / null id / null 行被丢弃，合法行保留。
- `items` 非数组 → 空结果，不抛错。
- `parseJdCampusPage` 对 `body:null`、`{}`、`null` 返回空，不抛错。
- 语法检查：`node --check index.mjs`、`node --check test/smoke.mjs`；`node plugin-audit.mjs plugins.local/jd-campus` → ✅ audit clean。

## 6. 分页限制

- `pageSize`：10（服务端按 10/页返回）；`max_pages` 默认 10（`entry.max_pages` 可覆盖）。
- 覆盖总量：126 条 ≈ 13 页（每页 10）；遍历终止：单页 < PAGE_SIZE 或 `(pageIndex+1)*pageSize >= totalNumber` 即停，避免超额请求。
- 每页间隔 300ms。
- `body.pageCount` 恒为 0，不可用作终止信号，已按 `totalNumber`/短页处理。

## 7. 未完成 / 限制

- **停用且未绑定**：`config/plugins.yml` 无 `jd-campus` 条目；`plugins.lock` 无对应指纹；`portals.yml` 京东条目（第 69-75 行）未加 `provider:`。用户需从 Web 适配器管理器审核，并 `node plugins.mjs enable jd-campus --confirm` + 给京东条目配置 `provider: jd-campus`（及可选 `api`/`positionType`）后，才进入启用及页面验收（SOP 第二阶段）。
- 适配器只读取列表 API 并依据列表 payload 拼装描述（`jobDirection`/`positionBg`/`workContent`/`qualification`，截断 4000 字符）；**不**逐条拉取详情页，因此详情 URL 由观察路由生成、描述为列表片段。未逐条核对的岗位未声明为「已核实」。
- 默认板为 `type=present`（已核实）。京东同站的其他专项板（`tgt`、`intern` 等）未逐一验证；若需覆盖，可在 portals.yml 条目配置 `positionType`（需另行按 SOP 验证）。当前**只验证了一个列表页**的 `present` 板。
- `location` 为 `requirementVoList[].workCity` 的省份去重（如 `上海市/北京市/陕西省/...`），与 scan.mjs `location_filter` 的省份/国家子串匹配一致；不保留城市级粒度。
- 列表与详情页均未触发登录 / 短信 / 验证码，无需用户接管。
- 未运行 `scan.mjs`、`verify-portals.mjs`、批量扫描、AI 评估、任何投递流程；**没有提交任何申请**。
- 时间敏感：列表会变化；`type=present` 为当前校招板默认，若京东调整路由/字段/板值，需重验。
