# 未解决：匿名 HTTP 入口自重定向

固定 HTML 解析在真实浏览器文档通过，但生产 ctx.fetchText 不依赖 Ego 会话。匿名 GET https://hr.yuanfudao.com/ 返回302到 /campus-recruitment/fenbi/47742/，该实际目标再次302到自身；首次默认重定向请求报 redirect count exceeded。未保存或重放 Cookie、凭证，未绕过。

替代能力：API 为 data/necromancer 加密封装，未解密；browserListing 必须有岗位 anchor 内可见地点，本页卡片仅标题/发布日期，无法提供真实 locationSelector；inlineDetails 无 tr/summary 展开控件；公开内嵌 JSON 已成功固定解析，但仍缺匿名 HTML 获取路线。不能用标题/日期充当地点，不能修改平台 reader。

需要平台支持可独立验证的公开 HTML 获取能力，或用户提供可匿名读取的官方入口。没有出现登录/验证码，不宣称登录能解决。候选禁用，不安装；离线通过和三条浏览器详情不消除此阻塞。
