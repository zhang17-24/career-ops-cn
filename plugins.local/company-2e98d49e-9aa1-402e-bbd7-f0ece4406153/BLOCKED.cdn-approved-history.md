# 等待补充静态资源域名审核（未安装）

2026-09-18T16:21:01Z：此前同域列表入口已由平台批准，原入口审核阻塞已解决，历史记录另存 BLOCKED.route-approved-history.md。

本次批准列表正常可读；公开列表 API 的 data 为不透明字符串，不能据此实现真实字段解析。平台 browserListing 可读取真实 anchor，但核心客户端脚本及样式来自 static-ats.mokahr.com，该精确域名不在当前生产权限内。

已更新 ROUTE_REVIEW.json 申请 campus.didiglobal.com + static-ats.mokahr.com，连接证据来自正常列表 DOM 的实际 script src / stylesheet href。旧批准 JSON 字节原样保存在 ROUTE_REVIEW.approved-20260918.json；本次提案发生变化，旧批准不能授权新域名。

请在滴滴企业页面审核新增资源域名，然后继续原候选。当前不是登录、验证码、岗位关闭或 API 401 阻塞。未尝试解码封装、猜测接口、扩大扫描、启用插件或修改绑定。按域名边界停止开发，index/manifest/test 仍为原模板，不能安装。

批准后待办：按已观察 DOM 确定主列表选择器和地点字段；实现 ctx.browserJobs 固定 DOM provider，隔离 fixture 测试与字符串 ID 校验；核对最多三个真实详情；再次 audit / fixture / syntax，交平台独立验收。若必需资源出现其他域名，仍须单独审核。未请求遥测域名或验证码权限。
