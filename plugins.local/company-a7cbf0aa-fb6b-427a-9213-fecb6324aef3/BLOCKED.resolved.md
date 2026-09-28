# 等待路线审核

2026-09-18T15:55:47Z：配置百度校招首页可读，正常点击“职位”实际进入 `https://talent.baidu.com/jobs/list`，观察到同域公开列表 XHR `https://talent.baidu.com/httservice/getPostListNew`。

当前授权未提供变更后的入口批准。按 SOP“入口变化（即使同域）”要求，已提交 ROUTE_REVIEW.json，停止开发等待平台页面审核；不是登录、CAPTCHA、岗位关闭或无法读取官网。

请在本企业适配器设置审核路线，批准后继续此原候选。不要重建候选。批准后仍需捕获真实 schema、实现固定解析与 fixture，并完成最多三个真实详情核对；仅批准路线不能安装。详见 ACCEPTANCE.md，未解决前保留本文件。
