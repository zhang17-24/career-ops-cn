# 得物校招固定 DOM 适配器

复用平台 `browserListing` 飞书 ATS DOM reader，运行零模型 Token。只读取已批准入口第一页，不点击、不翻页、不投递。来源为真实可见 anchor；名称及地点按 manifest 中的相对选择器提取，company 由平台企业 entry 提供。

不重放带动态签名的 API，不返回 fixture 或缓存岗位。空列表、异常结构、加载及验证失败由平台 reader 报错并原样传播。生产模块没有独立 parser，固定解析与安全检查统一复用平台能力。

官网路径编号位于倒数第二段、末段为 detail。平台当前仅允许附加末段 ID，因此输出保留完整 URL，不附加错误的 id；证据中的 data-id 原样按字符串保存。不会把 detail 当作岗位编号。

候选保持禁用，由平台独立验收后决定安装和绑定。离线 smoke 只验证 provider 的单次委托及错误传播，不替代平台 DOM reader 测试或真实验收。详见 ACCEPTANCE.md。
