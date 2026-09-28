# 猿辅导候选开发验收记录

- 候选：`company-af53c855-ffdc-48b1-80c9-a7fa9531a73c`。
- 2026-09-19，开发观察约 01:07–01:14 UTC（北京时间 09:07–09:14）；生产入口实测返回于 **2026-09-19T01:12:41.727Z**。
- 当前状态：开发完成，未安装、未启用、未绑定；平台独立验收尚未执行。无活动 BLOCKED.md。
- 仅修改本候选，无扫描、模型评估、投递、配置或信任修改；Ego Lite 独立任务空间 17，全程复用 p1。

## 来源、范围和路线

配置入口 https://hr.yuanfudao.com/ 实际重定向至 https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/ ，浏览器首页为该地址加 `#/`。页面标题“2026届猿辅导集团 - 校园招聘”，公开初始化数据 org.id=`fenbi`、org.name=`猿辅导集团`、siteId=`47742`，品牌一致。

首页“产品/研发类 共7个职位”真实 raw href 为 `#/jobs?&zhineng%5B0%5D=160479`，resolved href 为 https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/#/jobs?&zhineng%5B0%5D=160479 。仅核验此页，不翻页、不切换类别。社会招聘链接仅被观察，未访问，不申请其域名权限。一次授权模式的连接证据见 ROUTE_REVIEW.json。

生产范围是**校招首页初始数据中的产品/研发类岗位**，本次与该列表7条完全一致；不是全集团、全部类别或全部分页覆盖。列表UI为30行/页，HTML初始数组本次15条，生产只解析初始数组并固定筛选 zhineng.id=160479；以后岗位增加或初始页排序变化可能只覆盖该类别的一部分。生产不扩展分页。

## 方法、证据与结果

1. Ego Lite 首页读取：品牌和真实招聘链接明确。“热招职位”菜单点击未切换列表，检查 info/tabs 后改用已观察的产品/研发类精确 href，没有重复失败选择器。
2. 列表正常请求观察到 `POST https://hr.yuanfudao.com/api/outer/ats-apply/website/jobs/v2`。公开参数：`{"orgId":"fenbi","siteId":"47742","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"zhinengIds":["160479"],"customFields":{},"site":"campus","locale":"zh-CN"}`。
3. 使用开发 helper publicCapturePreload，并先 Page.enable。首次同URL goto未重建文档，未捕获；纠正为注册后reload同一列表，捕获HTTP200，顶层仅 data:string、necromancer:string。不输出/保存封装内容，不解密、不重放API、不逆向签名。所有预加载注册和内存捕获均在finally移除。最初helper导入路径格式错误在实际注册前失败，改用精确file URL解决。
4. 考察固定DOM路线：真实岗位anchor可读，但列表卡片隐藏地点，不能满足 browserListing 的可见地点契约；不伪造 locationSelector。独立详情正常存在，inlineDetails不适用。
5. 改用官方HTML内 `input#init-data[value]`。其JSON与页面window.TurboApply.data一致；包含真实ID/title/status/locations/publishedAt/zhineng。仅读取需要字段，未保存整份响应、站点配置或个人数据。没有岗位描述时不编造description。无需新建企业API或解密Moka封装；固定HTML解析方式适用于Moka同结构，当前身份与范围严格固定为本企业。
6. 无初始化的匿名HTTP文档请求302回自身，不将它判作登录/过期。观察官网首页302同时设置匿名会话cookie；使用一次公开首页GET初始化，再GET其真实Location文档，返回200、HTML约79830字符。cookie仅存在单次函数内存，未读取用户浏览器cookie，不记录值；没有登录、短信、验证码或安全挑战页面。manifest声明publicBootstrapUrl，两个请求均同域。
7. 最终生产函数实测：一次初始化+一次HTML请求返回7条，与同一列表的7个字符串ID/标题相符。此结果来自当前官网响应，不来自fixture。

## 固定映射与异常处理

- `input#init-data` value只做HTML实体还原、JSON.parse，不执行下载脚本。
- 身份严格核对org.id、org.name、siteId；jobs必须数组，最多100条保护上限。
- 只返回status=open且zhineng.id=160479；真实ID必须字符串且不重复，数字ID拒绝，以免长编号损失。
- title来自title；地点连接locations中的实际country/provinceName/cityName/address，缺省为真实空字符串。不会把cityId猜成地名；第一条正文显示北京市，原始数据保存中国及望京办公地址；第二、三条官网详情地点为“-”，输出空字符串。
- postedAt来自带时区的publishedAt；本地时区模糊日期拒绝。description不输出，因为初始HTML无完整JD字段。
- 官网anchor raw href为`#/job/<真实字符串ID>`。三条正常点击均与该固定映射一致；输出在实际官方文档地址后追加这一观察到的Moka路由，不猜其他路径或参数。
- 初始化路由改变、文档非200、缺失init-data、错误身份、结构变化、重复/数字ID、未知状态、日期错误均抛错；真实空数组返回空数组，网络错误不伪装成空岗位。无fallback、缓存或生产fixture导入。

## 三个真实详情抽查

以下均先将实际anchor scrollIntoView，等待边界落在viewport内且elementFromPoint命中，再click；每次检查page.info与task.tabs。都在p1导航，没有累积临时标签。完整职责与要求均已加载，无登录/验证码弹层，无关闭/404信号。“登录”常驻按钮不影响公开阅读。未点击“申请职位”。

| 字符串ID | 列表和详情完整标题 | 实际点击URL | 最小正文证据与结果 |
|---|---|---|---|
| c3404b3e-9cb8-456f-a0df-cc89384f7255 | 2025届校招- C端产品实习生（有转正机会） | https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/#/job/c3404b3e-9cb8-456f-a0df-cc89384f7255 | 职责含参与斑马App服务体验产品工作、协同教研及模型团队；要求25届毕业生，可实习三个月优先；北京市，发布2026-08-12。标题/ID一致，正文可读。 |
| e433c6ae-c3f0-4e9e-96a1-4421063b1f69 | 2026春招-测试工程师 | https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/#/job/e433c6ae-c3f0-4e9e-96a1-4421063b1f69 | 职责含移动端功能与兼容性测试、计划/用例/bug确认；要求计算机基础及测试兴趣；地点“-”，发布2026-03-04。标题/ID一致，正文可读。 |
| 6ae831e9-eda5-417b-9353-5f229b46a9fb | 2026届春招-AI服务端研发工程师 | https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/#/job/6ae831e9-eda5-417b-9353-5f229b46a9fb | 职责含智能硬件/小猿AI APP/内容中心服务端研发；要求2026届、Java及计算机基础；地点“-”，发布2026-03-04。标题/ID一致，正文可读。 |

其余四条没有打开详情，不声称全部当前可投递；2025/2026届标题按官网保留，不改成2027届。

## 离线验证

以下均通过，离线测试没有任何网络：

- `node plugins.local/company-af53c855-ffdc-48b1-80c9-a7fa9531a73c/test/smoke.mjs`
- `node --check plugins.local/company-af53c855-ffdc-48b1-80c9-a7fa9531a73c/index.mjs`
- `node --check plugins.local/company-af53c855-ffdc-48b1-80c9-a7fa9531a73c/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-af53c855-ffdc-48b1-80c9-a7fa9531a73c` → audit clean。

测试覆盖最小公开样本字段映射、HTML实体、长字符串编号、同名不同ID、重复ID、身份错误、真实空列表、异常结构、关闭状态、分类过滤、固定两请求不翻页、初始化和列表错误传播。测试样例仅在test目录，与生产模块隔离。

## 启用及页面验收

尚未执行，由服务端在任务结束后独立读取一页列表、三个真实详情、审计和测试，再决定是否启用绑定。开发抽样及fixture成功不替代该阶段；失败应保留旧版本。日常运行零模型Token，本次Agent开发消耗开发Token。
