# 百度首屏招聘源适配器

候选：company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3。

通过一次匿名 GET 读取 https://talent.baidu.com/jobs/list 的 SSR listData，固定解析校招首屏最多 10 条岗位。运行不调用模型，不依赖浏览器、凭证或外部包；失败抛错，无示例岗位兜底。

详情映射来自公开卡片导航函数并经三个真实点击验证。完整证据、测试和范围见 ACCEPTANCE.md。

保持停用，等待平台独立验收后决定安装绑定。日常读取零 Token，本次开发消耗开发 Token。

离线验证：`node plugins.local/company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3/test/smoke.mjs`。
