# 网易互联网2027校招（不含互娱、雷火、社招）
2026-09-11北京时间，Ego官网导航实际观察。
入口：https://campus.163.com/app/job/position?id=103
公开GET：https://campus.163.com/api/campuspc/position/getJobList?pageSize=10&currentPage=1&projectId=103
匿名请求code=200，总计77；仅1页10条。
字段positionName/id/workPlaceName/updateTime分别映射名称/原编号/地点/时间。
列表真实详情链接：
- https://campus.163.com/app/detail/index?id=4845&projectId=103 市场管理培训生-网易有道
- https://campus.163.com/app/detail/index?id=4860&projectId=103 全栈开发工程师-网易有道
- https://campus.163.com/app/detail/index?id=4854&projectId=103 语音交互（端到端语音/全双工语音）算法工程师-网易有道
详情待托管验收，失败不启用；页面扫描待完成。
离线：node test/smoke.mjs；异常、空、长编号、分页与网络失败。
默认1页，上限10页。年度项目103需官方变动后重新验收。
