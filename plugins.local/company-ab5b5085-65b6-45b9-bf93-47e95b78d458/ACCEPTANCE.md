# 三六零候选开发验收记录

候选：company-ab5b5085-65b6-45b9-bf93-47e95b78d458。核验日期：2026-09-19，约09:07–09:13（Asia/Shanghai）。匿名HTTP最终核验时间：2026-09-19T01:12:32.804Z。

## 来源、范围与方法

- 配置入口 https://360campus.zhiye.com/ 可用，首页显示“360集团2027全球校园招聘”，页脚“360集团校园招聘”、Powered by Beisen。首页校招卡片原始href为 `/campus/jobs`，解析为 https://360campus.zhiye.com/campus/jobs 。未使用搜索、未扩大到其他企业。
- 服务端任务提供一次授权企业公开托管模式；路线记录见 ROUTE_REVIEW.json。候选不自行授予权限。
- 使用独立 Ego Lite TaskSpace 16。只读取同一校招列表第一页及前三个不同详情；同页重导航用于不同取证方法，没有翻页、搜索筛选、投递或登录。
- 初始等待条件误用了anchor数量，等待超时；复查页面发现20个非anchor职位卡片，列表正常，不能据此认定官网连接失败。
- 普通performance记录及过早读取的CDP事件未提供职位接口。原始HTML HTTP 200但仅含BSGlobal配置，没有岗位；因此不采用HTML解析。等待真实职位标题后，在同次CDP调用获取正常导航产生的公开请求，发现列表POST。
- 采用 `adapter-network-capture.mjs` 的 publicCapturePreload，对已观察的精确列表端点及精确列表document注册；先Page.enable，正常导航后成功捕获，finally删除注册并stop。没有请求重放、Cookie/请求头读取、追踪参数例外或签名分析。一次辅助模块导入路径错误发生在注册前，改为明确file URL后完成。
- 公开JSON可读，因此无需browserListing或inlineDetails。非anchor导航：滚动标题到视口中心、等待命中检查后正常点击，每次查看page.info与task.tabs，等待新标签的完整职责。短暂about:blank最终正常加载，不视为阻塞；每次核验后关闭详情页或在最后清理。
- 卡片局部公开React事件函数显示 `window.open(le)`；附近代码明确 `categoryId:e.data.CategoryId, jobAdId:e.data.Id`、`le=ae.detailUrl`。同一公开模块的列表导航明确 `pageType:detail,businessType:t.CategoryId` 后拼接 `"?jobAdId="+t.Id`。三个实际点击均确认校招前缀 `/campus/detail`，并与API字符串Id完全一致。没有仅凭ID猜路径。通过CDP定位当前卡片函数所在脚本，仅读取附近导航片段，没有遍历bundle或分析安全算法。入口静态pc脚本不含路由，故改为精确函数定位。

## 实际请求与固定字段

POST https://360campus.zhiye.com/api/Jobad/GetJobAdPageList

```json
{"PageIndex":0,"PageSize":20,"Category":["2"],"KeyWords":"","SpecialType":0,"PortalId":"","DisplayFields":["Category","Kind","LocId","WorkWeChatQrCode"]}
```

浏览器真实响应及无凭证Node HTTP均200；响应Code=200，Count=35，Data=20条，Total=0（不用Total判定空列表）。没有保存完整响应。生产仅调用ctx.fetchJson，一次请求，无浏览器、模型、fixture或失败兜底。

字段映射：Id→字符串id；JobAdName→title；LocNames→location；Duty和Require→description；company固定为三六零。详情URL采用已被公开导航代码及三次点击验证的北森校园详情映射。保留Id字符串，不用数值JobAdId替代。不写postedAt：列表PostDate为0001-01-01占位值，ChangeDate不能冒充发布日期。解析器拒绝异常schema、重复ID、非活动/非校招记录及缺失职责。有效Count=0/Data=[]才返回空数组。

## 三个真实详情抽查

以下均为列表实际标题和实际点击地址；地点均为北京市。正文已完整读取并与捕获的Duty/Require逐项对照，无登录墙、验证码、关闭或404提示。

| 标题 | 字符串Id及真实地址 | 最小正文证据 | 结果 |
|---|---|---|---|
| 27秋-安全方向-AI大模型算法工程师（北京）-5093(J12477) | [fb968ca0-e3cd-45cd-a659-8403c413f219](https://360campus.zhiye.com/campus/detail?jobAdId=fb968ca0-e3cd-45cd-a659-8403c413f219) | 基于大模型构建自动化工具；安全场景微调与提示工程；博士学历要求。 | 名称、ID、职责及资格一致；description 474字符 |
| 27秋招-智能化漏洞挖掘研究员（北京）-5390(J12462) | [50c5846f-48fe-46a8-a881-e538ead16821](https://360campus.zhiye.com/campus/detail?jobAdId=50c5846f-48fe-46a8-a881-e538ead16821) | AI在Web/API安全场景的应用研究；智能化漏洞挖掘Agent；本科及以上。 | 名称、ID、职责及资格一致；description 700字符 |
| 27秋招-产品专员（北京）-5388(J12460) | [2bc87f57-fa8b-4b99-a39d-cb0af8dfd2ba](https://360campus.zhiye.com/campus/detail?jobAdId=2bc87f57-fa8b-4b99-a39d-cb0af8dfd2ba) | 移动安全AI产品规划；平台CLI与工具链；原文要求3年以上产品经理经验。 | 名称、ID、职责及资格一致；description 541字符 |

第三条虽在校招入口，却写有经验要求；保留官网原文，不擅自修正或排除。

## 分阶段结论

1. 离线测试：`node plugins.local/company-ab5b5085-65b6-45b9-bf93-47e95b78d458/test/smoke.mjs` 通过。合成fixture仅用于测试，覆盖字段映射、长字符串ID、同名异ID、重复ID、空列表、错误schema、状态、网络失败和一页20条限制。
2. 语法检查：index.mjs及test/smoke.mjs的 `node --check` 通过。`node plugin-audit.mjs plugins.local/company-ab5b5085-65b6-45b9-bf93-47e95b78d458` 通过。
3. 开发现场验证：同一列表匿名HTTP返回20条，前三条详情Ego真实读取通过。其余17条未逐条验证；Count=35不代表读取了35条，更不代表全部可投递。
4. 启用及产品页面验收：未执行，候选保持停用且未绑定。未运行scan.mjs、verify-portals.mjs、批量扫描、AI评估或申请流程。由平台任务结束后独立核验并决定是否安装、替换绑定，失败保留旧版。

运行时为确定性北森公开JSON解析，日常读取零模型Token；本次开发使用了Agent Token。无未解决开发阻塞；平台独立验收仍待进行。
