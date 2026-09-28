# ACCEPTANCE — meituan-campus 美团校招招聘源适配器

状态：**开发与审核（默认停用）**. 本插件已安装但**停用且未绑定**，等待用户从 Web 适配器管理器中审核启用。
完成声明按 SOP 二阶段拆分：**离线测试** ✅ / **真实详情抽查** ✅ / **启用及页面验收** ⏳ 待用户授权.

---

## 1. 入口及招聘类型

| 项 | 值 |
|----|----|
| 企业 | 美团 |
| 入口 URL | `https://zhaopin.meituan.com/web/campus`（校招） |
| 招聘类型 | 校招 + 实习（列表展示「全部校招职位（608）」） |
| 列表 API | `POST https://zhaopin.meituan.com/api/official/job/getJobList` |
| 详情路由 | `https://zhaopin.meituan.com/web/position/detail?jobUnionId=<id>&highlightType=campus` |
| 适配类型 | 企业自建 API（非 Greenhouse/Lever/Ashby 等通用 ATS，故做企业专用适配器） |

## 2. 核验时间

**2026-09-09**（Ego Lite 在线观察与真实请求）。列表总数为 608，`refreshTime` 为毫秒级 epoch。

## 3. 实际列表请求（真实，非 mock）

```
POST /api/official/job/getJobList
Host: zhaopin.meituan.com
Content-Type: application/json

{"page":{"pageNo":1,"pageSize":100},"jobShareType":"1","keywords":"","cityList":[],"department":[],"jfJgList":[],"jobType":[{"code":"1","subCode":[]},{"code":"2","subCode":[]}],"typeCode":[],"specialCode":[]}
```

- 响应：HTTP 200，`data.page.totalCount = 608`，`data.list` 长度 100。
- 无需鉴权、无额外头；仅声明 `zhaopin.meituan.com` 一个 egress 主机（`manifest.json` 的 `allowedHosts`）。
- 观察来源：Ego Lite 捕获的站点自身 XHR（`initiatorType: xmlhttprequest`），校招页面发送的正是 `jobType` 为 code 1+2（社招的现成 `providers/meituan.mjs` 用 code 3，校招≠社招，不会混淆）。
- `jobUnionId` 返回为**字符串**（如 `"4721378720"`），插件中始终以字符串处理，不经过 Number。

## 4. 真实详情抽查（最多 3，使用观察到的官方点击路由，不猜路径）

点击真实职位卡片（`div.position_list_item.cursor_pointer`）打开新标签页，路由为 `/web/position/detail?jobUnionId=<id>&highlightType=campus`。

| # | 列表标题 | jobUnionId（字符串） | 详情 URL（观察路由） | 详情页标题 | 结果 |
|---|---------|----------------------|----------------------|-----------|------|
| 1 | 商业分析实习生（大模型应用BP） | `4721378720` | `https://zhaopin.meituan.com/web/position/detail?jobUnionId=4721378720&highlightType=campus` | 商业分析实习生（大模型应用BP） | 匹配 |
| 2 | 【实习】Keeta-后台产品实习生 | `4758327812` | `https://zhaopin.meituan.com/web/position/detail?jobUnionId=4758327812&highlightType=campus` | 【实习】Keeta-后台产品实习生 | 匹配 |
| 3 | Agent 产品运营实习生 | `4683387184` | `https://zhaopin.meituan.com/web/position/detail?jobUnionId=4683387184&highlightType=campus` | Agent 产品运营实习生 | 匹配 |

- 3 个样本均满足：列表名称 / 字符串编号 / 实际点击地址 / 详情名称一一对应。
- 更多真实抽检：无；样本不足即如实说明。

### 生产路径复跑（真实加载器路径）

用引擎的 `buildCtx`（含 `allowedHosts` + SSRF 校验的 `ctx.fetchJson`）直接调用插件 `fetch`，对真实 API 复跑：

- 返回 100 个岗位，耗时 464ms；前三个岗位的 title/URL/location/postedAt 与上表 3 个详情完全一致 → 真实加载器路径可用，且不越出声明的 egress 主机。

## 5. 离线 fixture 测试（零网络）

```
node plugins.local/meituan-campus/test/smoke.mjs
→ ✓ meituan-campus provider fixture smoke ok
```

覆盖（全部零网络，使用内存 fixture）：
- 字段映射：列表 payload → 规范化 Job[]（title/url/company/location/postedAt/description）。
- 字符串 ID 不丢位：`4721378720` 以字符串保留并经 URL 编码；不被 Number 强转。
- 确定性请求体：POST、`content-type: application/json`、`pageSize:100`、`jobShareType:'1'`、`jobType:[{code:'1'},{code:'2'}]`、`keywords:''`、`cityList/specialCode:[]`。
- 空列表 → 空结果，无幻影岗位。
- 缺失 `data.list` → 空结果，不抛错。
- 异常数据：缺 title / 缺 jobUnionId / 空 id / null id / null 行被丢弃，合法行保留。
- 载荷非数组（`list:'oops'`）→ 空结果，不抛错。
- `parseMeituanCampusResponse` 对 `data:null`、`{}` 返回空，不抛错。
- 语法检查：`node --check index.mjs`、`node --check test/smoke.mjs`；`node plugin-audit.mjs plugins.local/meituan-campus` → ✅ audit clean。

## 6. 分页限制

- `pageSize`：100（API 可返回 100/页；页面 UI 用 10，但后端接受 100，已实测）。
- `max_pages`：默认 10（`entry.max_pages` 可覆盖；portals.yml 美团条目当前 `max_pages: 3`）。
- 覆盖总量：608 条 ≈ 7 页即可取全；每页间隔 300ms。
- 遍历终止：单页 < PAGE_SIZE 或 `pageNo*pageSize >= total` 即停，避免超额请求。

## 7. 未完成 / 限制

- **停用且未绑定**：`config/plugins.yml` 无 `meituan-campus` 条目；`plugins.lock` 无对应指纹；`portals.yml` 美团条目（第 56-62 行）未加 `provider:`。用户需从 Web 适配器管理器审核，并 `node plugins.mjs enable meituan-campus --confirm` + 给美团条目配置 `provider: meituan-campus`（及可选 `api`/`keywords`）后，才进入启用及页面验收（SOP 第二阶段）。
- 适配器只读取列表 API 并依据列表 payload 拼装描述（`jobDuty`/`jobRequirement` 等，截断 4000 字符）；**不**逐条拉取详情页，因此详情 URL 由观察路由生成、描述为列表片段。未逐条核对的岗位未声明为「已核实」。
- `highlightType=campus` 参数来自观察到的校招点击路由；无害，但属于展示提示参数。
- 列表与详情页均未触发登录 / 短信 / 验证码，无需用户接管。
- 未运行 `scan.mjs`、`verify-portals.mjs`、批量扫描、AI 评估、任何投递流程；**没有提交任何申请**。
- 时间敏感：列表会变化；`jobType` code 1+2 为当前校招板默认，若美团调整 code 含义或新增专场，需重验。
