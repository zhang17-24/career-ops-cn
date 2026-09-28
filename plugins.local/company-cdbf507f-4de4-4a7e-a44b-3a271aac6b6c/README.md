# Momenta Mstar 招聘源

复用平台 browserListing 固定 DOM reader，读取批准的飞书 ATS 单页，不翻页、不调用模型、不提交申请。运行零 Token；本次 Agent 开发使用开发 Token。

标题与地点来自真实岗位 anchor 的相对选择器，URL 原样保留。编号保留于 URL 中，不转换为 Number；不输出平台契约不支持的可选 id。生产不导入 fixture。

当前仅覆盖批准入口的 Mstar 项目，其他校招/实习筛选未读取。空结果、结构异常、重复编号和读取错误均停止，不返回示例岗位。

候选保持禁用。平台在任务结束后独立验收、安装及绑定；详见 ACCEPTANCE.md。
