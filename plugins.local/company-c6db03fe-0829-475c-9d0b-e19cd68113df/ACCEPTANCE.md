# 美的集团：开发完成，待平台独立验收

候选 `company-c6db03fe-0829-475c-9d0b-e19cd68113df`。记录时间 2026-09-13T03:45:59.009778+00:00。

## 本轮范围与路线

仅续接本候选。portals.yml 的美的集团旧入口为 https://campus.midea.com/；本次使用平台已批准入口 https://careers.midea.com/schoolOut/home，不重复入口发现。页面标题“美的集团-校园招聘官网”，正文“美的集团 2027 届校园招聘”。ROUTE_REVIEW.json 保持字节原样；仅 careers.midea.com 和 apiprod.midea.com 获准，无新增生产域名。

Ego Lite 独立任务空间51，旧空间50已不存在；没有操作用户空间38。首页“岗位投递”anchor 的 raw href=null、resolved href为空。scrollIntoView 后布局等待，矩形中心(802,36)、视口内且 elementFromPoint 命中，正常点击后 pageInfo 与 listTabs 确认到达 https://careers.midea.com/schoolOut/post。这是批准首页的站内列表导航，未更换生产入口。一页默认应届生岗位列表，10条，总数148；没有翻页、筛选或其他招聘类型扫描。

## 方法、证据、结果

1. 旧精确捕获失败：两次已观察请求仅 `_ihr_log_trackId` 不同，历史见 ACCEPTANCE.capture-history.md。此次使用 publicCaptureScript(旧实测完整URL, {ignoreQueryParams:['_ihr_log_trackId']})，在正常 SPA 列表导航之前安装。只忽略这个已确认追踪键用于匹配，实际出站请求未改写。捕获 HTTP 200、code字符串“0”，解决旧 schema 阻塞。未重放请求、读取请求头/Cookie或逆向签名。完成最小取证后 stop；未使用跨调用requestId，也无preload注册。
2. DOM导航：`.position-item` 为div而非anchor；其实际 Symbol(_vei).onClick.value 公开处理器为 `()=>(e=>{const a=i.resolve({name:"postDetails",query:{positionId:e.positionId}});window.open(a.href,"_blank")})(e.item)`。应用router公开元数据：base=`/schoolOut`，postDetails path=`/post/details`。映射与历史三个真实点击URL一致。本次按历史实测URL重新读取三个当前详情，匹配新API中的positionId、标题、地点及全部职责/要求。没有根据编号猜路径。
3. public JSON响应已经可读，因此采用固定HTTP解析，无证据识别为通用公共ATS。browserListing要求anchor、inlineDetails要求带data编号的tr/summary原页展开，均不适用且无需替代已成功JSON路线。SPA内存捕获有效，无需再试初始加载preload或下载bundle。

## 实际公开列表请求

- 时间：2026-09-13T03:40Z—03:45Z（详情核对结束03:44:40.775Z）。
- POST `https://careers.midea.com/backend/school/position/common/position/list?_ihr_log_trackId=6a2f27ca-69d4-4555-ad92-ca23ba164c6a`
- 正常页面请求体：`{"keyword":null,"superiorIds":[],"recruitCategoryIds":[],"workPlaceCodes":[],"projectRuleId":"055bb05d-1957-4ea0-bb21-873ca0164d84","pageIndex":1,"pageSize":10}`
- 顶层keys：code、message、ihrReturnVersion、data、stackTrace。data.keys：data、total、info、additions。成功code严格为字符串“0”；data.data为岗位数组；total=148、数组长度10。
- 生产使用该实测完整请求URL和固定公开请求体，保留追踪值，不生成身份/鉴权参数、不复制浏览器头。仅application/json请求头。此追踪值是否可长期复用、匿名HTTP是否可读尚由平台验证；若失败明确报错，不补凭证、不返回缓存岗位。
- 字段：positionId→字符串id；projectPositionName→title；workPlaceCode→location；projectPositionDto.jobResponsibility及jobRequirement→description；projectPositionDto.positionName与title一致性验证。company固定美的集团。没有可靠发布时间，故不生成postedAt。真实编号无需Number转换。
- projectRuleId固定于本次应届生项目；每次只读取pageIndex=1/pageSize=10，不承诺全部148条。项目改变、响应异常、重复编号、缺字段、HTTP错误、解析错误均fail closed；仅成功且total=0/data=[]才返回空。

## 三个当前详情

以下均为旧验收记录的真实点击URL，本次逐一在Ego Lite重新打开。复用一个详情tab，未点击投递按钮。当前列表API与详情标题、positionId、地点、职责及要求相符；未出现验证码、登录要求、404或关闭提示。

| 名称 | 字符串positionId | 地点 | 当前详情URL | 最小职责证据 |
|---|---|---|---|---|
| 研究员-焊接工艺 | 8b8b36a5a07bc25301a08e4679cd4aba | 佛山市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b36a5a07bc25301a08e4679cd4aba | 负责焊接用新材料、新技术、新设备的工艺研发；4项职责、3项要求相符 |
| IT项目管理工程师 | 8b8b36a5a07bc25301a08def45d04064 | 上海市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b36a5a07bc25301a08def45d04064 | 负责搭建、更新与维护项目台账、资源台账等核心项目数据体系；5项职责、4项要求相符 |
| 电机控制软件工程师 | 8b8b33b8a05d379d01a05d47facc0275 | 佛山市 | https://careers.midea.com/schoolOut/post/details?positionId=8b8b33b8a05d379d01a05d47facc0275 | 永磁同步电机PMSM、感应电机IM的控制算法研究及产品化应用；3项职责、4项要求相符 |

仅这些三个详情已抽查，其余未核验。Ego公开可读不等于独立匿名HTTP或全部岗位可投递。未保存完整响应、凭证或个人信息。

## 离线开发验证

以下命令均退出0：

- `node plugin-audit.mjs plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df`：audit clean。
- `node plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs`：固定字段、长字符串ID、同名不同ID、重复ID拒绝、空/异常响应、错误HTTP/非JSON/超时及单页限制通过；网络为0。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/index.mjs`。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs`。

fixture仅用于测试，不导入生产。没有模型调用和额外依赖。旧阻塞因动态追踪匹配及schema缺失，现已解决，原文归档 BLOCKED.resolved-history.md；旧验收原文保存在 ACCEPTANCE.capture-history.md，早期入口证据保存在 ACCEPTANCE.route-history.md。

## 启用及页面验收

候选保持DISABLED，未安装、未启用、未绑定，未修改信任/配置/旧版或锁文件。没有运行scan.mjs、verify-portals.mjs、批量扫描、AI评估或申请流程，无commit/push。

独立匿名HTTP列表读取、三个详情及页面验收尚未执行，由托管平台在任务结束后决定；失败必须保留旧版。这里的开发完成不代表平台验收通过。日常固定HTTP解析零模型Token；本次Agent开发消耗开发Token。
