# HTTP 固定解析阻塞，候选未完成

核验时间：2026-09-12T14:23:31.885007+00:00

原路线已获平台批准，ROUTE_REVIEW.json 保持原样。旧路线阻塞归档于 BLOCKED.route-history.md；产品官网反向链接缺失不再是阻塞。

正常 Moka 列表可读，13 条职位，无登录/验证码阻断。但实际 POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2 返回 HTTP 200，顶层 data 与 necromancer 均为字符串，data 长度 9260；未观察到可直接映射的岗位数组、描述及分页 schema。未解码封装、逆向签名或枚举端点，也未发直连重放。因此匿名 HTTP 与固定解析未验证，不可交付生产解析器。

首次首页捕获器因真实岗位链接打开新标签而未捕获；唯一取证修正是在同一列表标签的详情页安装捕获器，再点击实际职位列表 breadcrumb，成功观察同一第一页的正常请求。只观察一个列表页（同页有重复导航），未翻页。捕获器已停止，未保存封装响应或凭证。

三个真实 DOM 详情已读，见 ACCEPTANCE.md；它们不能替代 HTTP 列表解析验收。移除原模板的猜测 jobs 映射，改为明确抛错，避免结构变化被当作空列表。离线测试只证明阻塞时失败关闭，不能证明解析完成。

恢复需要经过批准且可直接解析的公开响应证据，或平台另行支持确定性浏览器 provider；当前不得启用。没有登录接管需求。未修改配置、绑定或旧版。


## 续接复核 2026-09-12T14:53:29.877Z

本轮先读现有代码、测试、路线与阻塞历史。路线已批准，但没有新增公开响应或固定解析证据。遵守 SOP“无新证据立即记录阻塞”及“同一失败最多一次有明确依据的修正验证”，不重复上一轮已经完成的 Ego Lite 取证或三个详情访问；本轮新增真实列表/详情核验均为 0，历史 DOM 可读结果不作为本轮实时验收。未创建浏览器任务空间，无本轮空间需要清理。

重新运行 plugin-audit（audit clean）、test/smoke.mjs（blocked-provider offline check passed; production parser NOT implemented）、node --check index.mjs，均退出 0。离线测试仅验证明确抛错且不请求网络，不代表字段映射、分页或生产解析器完成。

未解决：jobs/v2 的 data/necromancer 字符串封装没有经过验证的公开固定解析方式；缺少真实响应字段映射及 API 描述比对。没有逆向、猜测端点、请求重放或 mock 兜底。需要新的可解析公开响应证据或平台支持确定性浏览器 provider 才能继续；单纯再次批准相同路线不解除本阻塞。

候选仍未完成，BLOCKED.md 保留有效；未执行启用及页面验收，未修改配置、绑定、旧版、锁文件或批准路线。


## 当前恢复进展与路线审核 2026-09-12T15:09:20.688190+00:00

平台新增 browserListing 已提供不同于历史 HTTP 的可行恢复方法，旧“平台不支持浏览器 provider”的条件已过时；HTTP 封装问题仍未解决，也未尝试解码。当前具体阻塞是 browserListing 主程序依赖 static-ats.mokahr.com，而该域名尚未获平台批准。新 ROUTE_REVIEW.json 已记录批准列表 → 实际主脚本的资源链，原批准文件字节保存在 ROUTE_REVIEW.approved-history.json。等待企业页面审核该新增域名后续接原候选；不要重启发现，也不要再次 HTTP 捕获。

本轮仅一页列表、零个详情。审核后尚需实现声明式 browserListing / ctx.browserJobs 委托、零网络 DOM fixture、三条新鲜详情检查和平台独立验收。旧失败关闭测试通过不代表这些工作完成。BLOCKED.md 保留，未启用、绑定、修改配置或旧版。
