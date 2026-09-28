# 深度求索DeepSeek 候选

固定读取 https://talent.deepseek.com/ 及 HTML 明示的同域 main 资源，解析官方公开岗位数据；两次 HTTP GET，零模型 Token，不执行下载脚本，不返回 mock。

开发检查及三个真实详情抽查完成，保持 DISABLED，等待平台独立验收。不是通用 Moka API 适配器；官网静态数据可能落后于详情更新。详见 ACCEPTANCE.md。

测试：node plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/test/smoke.mjs
审计：node plugin-audit.mjs plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/

本次开发消耗开发 Token。禁止自行启用、绑定或投递。
