# 蚂蚁集团校招新增适配器

2026-09-11，北京时间。Ego Lite空间17。从官网 /campus → /campus/home 向下滚动，点击“应届生招聘”卡片进入 https://talent.antgroup.com/campus-full-list?type=campus_graduates 。不是使用官网AI聊天结果。

## 真实接口

官网正常请求 POST https://hrcareersweb.antgroup.com/api/campus/position/search ，请求体完整固定筛选见 index.mjs。pageIndex=1、pageSize=10，批次字符串26040200083752、25030300059633、26070900089909来自官网请求。界面总数66，首屏10条。
在 Node 环境不带Cookie、Token、签名或登录凭据的独立HTTP请求返回200、success=true、errorCode=success，首三条标题及编号与官网一致。API域名与页面域名不同，均来自官网实际调用；只声明这两个精确主机，不放开通配域名或全局自动安装权限。按CLI手动审核流程安装，不冒充同域托管自动验收。

## 三个真实详情

实际点击列表进入以下路由，标题、职位描述、职位要求均可读，无需登录查看；未点击加入意向或投递。
- 大模型智能体优化算法，260721010991745：https://talent.antgroup.com/campus-position?positionId=260721010991745
- 智能体与大模型应用工程，260721011006030：https://talent.antgroup.com/campus-position?positionId=260721011006030
- 模型基准和评估，260721010993684：https://talent.antgroup.com/campus-position?positionId=260721010993684

官网点击附带临时tid追踪参数；第二条在去除tid后重新打开，正文仍一致。生产只保留positionId，不保存追踪标识。编号在API中是安全整数；超过安全整数范围必须由API返回字符串，否则拒绝，不猜修复。

## 数据、测试和范围

name→title，workLocations→location，description/requirement→描述，publishTime→postedAt。前三个抽查样本实际发布时间2026-07-22，不能改成今天来绕过时间筛选。页面扫描选择60天；默认7天/30天会过滤这些旧发布岗位（首屏另有9月发布的岗位）。
固定读取第一页10条，不代表全部66条；后续批次变化需重新观察官网请求并验收。接口失败或结构异常报错，绝不返回mock；测试数据仅test/smoke.mjs。
验证命令：node test/smoke.mjs、node --check index.mjs、根目录 node plugin-audit.mjs plugins.local/antgroup-campus。验证结果与启用/页面验收补记在项目文档，启用后不直接改插件以免破坏信任指纹。
