# 携程校招公开源候选

固定读取公开 getJobAd 接口首屏（category=2，page=1，size=10），运行零模型 Token。
生产只通过 ctx.fetchJson 请求官方接口；无需凭证、不导入测试数据、不翻页。
字段映射：fromId → 字符串 id；jobTitle → title；cityName → location；company 固定为携程。
详情路线由官网 anchor、公开导航代码及三次实际点击共同确认。
仅返回已确认映射的基础字段；不输出可选发布时间或描述字段。

离线检查见 test/smoke.mjs。真实证据及限制见 ACCEPTANCE.md。
候选保持停用，未更改绑定或信任；仅由托管平台独立验收后决定安装。
