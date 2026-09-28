# 阻塞：真实响应与详情标识未完成核验

续接时间：2026-09-12T10:54:53.472447+00:00

平台已批准原 ROUTE_REVIEW.json 路线；旧路线审核阻塞已解决，原记录归档于 BLOCKED-route-history.md。原申请文件保持逐字节不变。本文件记录新的活动阻塞。

正常官网列表公开可读，显示共37条、当前20条。观察到 POST https://joinserverfast.g-bits.com/humanResource/recruitmentExtranet/ExtrannetCampusPost/queryRecuitPost 返回 HTTP 200。Ego Lite 的 CDP 请求记录跨 heredoc 后无法取回请求体（No resource with given id was found）；一次响应恢复仍报 No resource with given identifier found。没有重放列表、枚举接口、下载脚本或逆向签名。

实际点击「客户端开发工程师」展开了本页职责与要求，URL仍为列表页，没有新标签。当前DOM没有岗位详情href或字符串ID；未点击「投递简历」。这不是登录、验证码、岗位关闭或官网连接失败，而是本轮网络证据采集不足。尚无可靠请求参数、响应字段映射及独立详情URL，不能编写真实生产解析器。

候选现为明确报错的禁用占位实现，避免原模板把未知响应当空列表。离线检查仅验证失败关闭，不代表解析器完成。后续需在获授权的核验窗口内，同一 Ego Lite 调用中捕获并提取正常列表的最小公开请求/响应字段，再沿真实路由核对最多三个详情；不得据本文件猜端点、ID或URL。平台不得安装本候选。
