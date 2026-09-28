# 智谱AI 候选开发记录（未完成，待路线审核）

- 候选：company-ec6099d0-9c3a-4680-89b7-4133f2f16d10；保持禁用，未安装、绑定或更新信任。
- 核验时间：2026-09-12T09:18:23Z（北京时间 17:18）。
- 配置入口：https://campus.zhipuai.cn/，校招；Ego Lite 显示 ERR_TIMED_OUT，未确认可用。
- 开始时仅有生成模板，无既有 ACCEPTANCE、BLOCKED 或 ROUTE_REVIEW 文件；portals.yml 本企业没有旧 provider 绑定。

## 有界只读发现

一次 Google 搜索“智谱AI 官网 招聘”，只作官网导航线索，不作岗位证据。搜索展示 https://www.zhipuai.cn；实际打开后地址为 https://www.zhipuai.cn/zh。

读取三个官网/导航页面：
1. https://www.zhipuai.cn/zh：页脚主体“北京智谱华章科技股份有限公司”。
2. https://www.zhipuai.cn/zh/joinus：由实际点击“加入我们”到达。
3. https://app.mokahr.com/campus-recruitment/zphz/148984#/home：由实际点击“校园招聘”新标签到达，页面标题同公司全称。

两个导航元素均无 href（原始属性及解析属性均无）；均先 scrollIntoView，等待布局，确认视口内和 elementFromPoint 命中再点击。点击后检查 pageInfo 与 listTabs，无失败恢复或猜测 URL。

## 真实页面及请求证据

仅观察一个招聘首页自然加载，未翻页、未主动调用 API。页面公开显示热招职位，存在“登录”入口但未阻止阅读；未出现登录要求、短信或 CAPTCHA。

最小公开标题样本（只证明首页可读，未验证 ID 或详情）：
- 27届校招-大模型算法工程师（Agent方向）
- 27届校招-预训练数据算法工程师（基座模型方向），北京市
- 27届校招 GLM-Code Agent算法工程师，北京市

首页 performance 记录的相关公开 XMLHttpRequest：
- https://app.mokahr.com/api/outer/ats-apply/website/group-by-job
- https://app.mokahr.com/api/outer/ats-apply/website/jobs/module

上述为浏览器自然请求地址，未重放、未获取完整生产响应，HTTP 方法、请求参数、返回结构、字段映射及分页上限均待获批后确认。未保存凭证、个人信息或完整响应。候选应优先采用可复用 Moka ATS 解析方案；当前未实现。

## 离线及静态检查

以下检查退出码均为 0，仅针对原有生成模板，不是实际适配器验收：
- node plugin-audit.mjs plugins.local/company-ec6099d0-9c3a-4680-89b7-4133f2f16d10：audit clean。
- node plugins.local/company-ec6099d0-9c3a-4680-89b7-4133f2f16d10/test/smoke.mjs：provider fixture smoke ok；零网络示例测试。
- node --check plugins.local/company-ec6099d0-9c3a-4680-89b7-4133f2f16d10/index.mjs：通过。
- node --check plugins.local/company-ec6099d0-9c3a-4680-89b7-4133f2f16d10/test/smoke.mjs：通过。

真实解析 fixture（长字符串编号、空数据、异常、分页）尚未实现。未根据模板生成任何正式岗位结果。

## 真实详情抽查

0 条。新域名未获批准，因此未进入详情，未核对字符串编号、名称与职责。样本不足，不能宣称真实接入成功。

## 启用及页面验收

未执行，由平台在开发完成后独立处理。本次未运行 scan.mjs、verify-portals.mjs、批量扫描、AI 评估或投递。仅新增本候选路线申请及证据文档，未修改生产代码、旧版、配置、绑定或锁文件。

当前活动阻塞见 BLOCKED.md：新入口和域名须用户在平台页面审核。日常确定性适配运行目标为零 Token，本轮 Agent 开发消耗 Token。
