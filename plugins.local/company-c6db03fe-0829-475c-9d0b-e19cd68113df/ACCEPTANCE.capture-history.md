# 美的集团候选：开发未完成，保留阻塞

候选 `company-c6db03fe-0829-475c-9d0b-e19cd68113df`。本轮核验截至 2026-09-13T03:11:00.659Z（北京时间 11:11）。上一轮入口发现和检查原文保存在 ACCEPTANCE.route-history.md。

## 路线与范围

平台于 2026-09-13T03:06:43.778Z 批准首页 `https://careers.midea.com/schoolOut/home`，精确域名 careers.midea.com、apiprod.midea.com。ROUTE_REVIEW.json 未修改。没有重做原入口搜索；只从批准首页续接。正常点击“岗位投递”（该 anchor 的 raw href 为 null、resolved href 为空）到达 `https://careers.midea.com/schoolOut/post`。此为正常站内列表导航，没有把批准首页替换成另一个生产入口，也未添加 browserListing 声明。

Ego Lite 独立任务空间 50；一个应届生列表页，默认每页10条、总数148。为公开取证正常返回同页一次，没有翻页、改筛选或访问第二页。三个独立详情，每次关闭后返回原列表。所有岗位点击前 scrollIntoView、等待布局、确认矩形位于视口且 elementFromPoint 命中；点击后检查 pageInfo 和 listTabs，显式选择新标签。未点击“立即投递”。

## 公开请求与捕获限制

实际列表请求（正常页面产生，未重放）：

- `https://careers.midea.com/backend/school/position/common/position/list?_ihr_log_trackId=4a99ae4b-3502-4c17-a869-5cbb6f36e9e2`
- 同页重入：`https://careers.midea.com/backend/school/position/common/position/list?_ihr_log_trackId=a15991db-6626-4901-834c-7413d3734483`

其他公开岗位导航请求：`https://careers.midea.com/backend/school/position/common/query/params/055bb05d-1957-4ea0-bb21-873ca0164d84?_ihr_log_trackId=a23d13e3-2740-40a7-ab53-b75a57197cea`。只记录实际 URL，不猜用途以外的 schema。

使用 adapter-network-capture.mjs 的 publicCaptureScript 在正常 SPA 返回列表前安装，精确匹配首次实际请求 URL；检查时 matched=false，未取得正文。后来 performance 记录确认追踪值不同。捕获器已 stop，最后检查 captureClean=true。没有使用 CDP requestId，没有反复读取响应，没有重放/改写参数或逆向签名。未注册 preload：本次是 SPA 导航，问题为动态 URL 精确匹配，不是刷新丢失内存 hook。没有保存请求头、凭证、个人接口正文或完整响应。

## 最小真实详情样本

下列地址全部来自当次真实卡片点击。编号原样保留为字符串，仅为点击所得 URL positionId；**尚未与列表 API 编号交叉验证**。

| 列表和详情标题 | 字符串 positionId | 地点 | 详情 URL | 职责最小摘录及结果 |
|---|---|---|---|---|
| 研究员-焊接工艺 | 8b8b36a5a07bc25301a08e4679cd4aba | 佛山市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b36a5a07bc25301a08e4679cd4aba | “负责焊接用新材料、新技术、新设备的工艺研发”；列表四项职责与详情相符，岗位要求可读 |
| IT项目管理工程师 | 8b8b36a5a07bc25301a08def45d04064 | 上海市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b36a5a07bc25301a08def45d04064 | “负责搭建、更新与维护项目台账、资源台账等核心项目数据体系”；列表五项职责与详情相符，岗位要求可读 |
| 电机控制软件工程师 | 8b8b33b8a05d379d01a05d47facc0275 | 佛山市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b33b8a05d379d01a05d47facc0275 | “永磁同步电机PMSM、感应电机IM的控制算法研究及产品化应用”；列表三项职责与详情相符，岗位要求可读 |

三个样本未出现关闭、404、登录要求或验证码。“登录”仅为公共导航按钮。结论只限浏览器公开可读，不证明匿名 HTTP 或全部岗位可投递。

## 适配决策与缺失项

暂无证据识别为已支持的公共 ATS；未复制任何其他企业解析器，也未编造企业 API schema。已读取两个平台 reader 契约：`.position-item` 是 div，无岗位 anchor href（计数0），前三项仅有 class 属性，无公开 data ID；不符合 browserListing 或 inlineDetails。三次正常点击证明详情存在，但固定导航代码映射未核验，不能根据 URL 样本拼生产路线。

缺少真实列表响应、请求体、分页字段、字符串 ID/详情完整交叉核对，因此未实现固定 parser。活动 BLOCKED.md 保留。生产 index 改为明确抛错，避免原通用模板静默返回空列表或未经证实的岗位；无 fixture 导入、模型调用、额外依赖或网络兜底。manifest 仅采用平台批准的两个域名，不涉及绑定/信任配置。

## 离线测试

本轮以下命令退出0：

- `node plugin-audit.mjs plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df`：audit clean。
- `node plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs`：零网络 fail-closed 检查通过，含模板形状、空数据、null 三个内存 fixture，确认网络调用数0。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/index.mjs`。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs`。

这些是阻塞保护检查，**不是固定解析器字段/长ID/分页 fixture 验收通过**。后者仍待实现，不得与真实详情检查互相替代。

## 启用及页面验收

未执行、未安装、未启用、未绑定。未运行 scan.mjs、verify-portals.mjs、批量扫描、AI评估或申请流程。只修改此候选目录，无配置/锁文件/旧版变更，无 commit/push。平台独立列表和三个详情验收尚未执行；当前 BLOCKED.md 必须阻止安装。后续只补响应取证与固定解析器缺项，无须重新发现官方入口。
