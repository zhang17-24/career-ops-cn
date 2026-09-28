# 蚂蚁集团校招适配器

已实现的确定性公开API解析器，不调用模型，不投递。详情及真实证据见 ACCEPTANCE.md。

官网应届生入口默认筛选，固定首1页10条，不等于全部岗位。API为hrcareersweb.antgroup.com，详情为talent.antgroup.com；两个精确主机均已核对，无通配域名、登录Cookie或额外密钥。

部分岗位发布时间较早，查看时选择足够长的时间范围。批次变化时需重新观察官网，不猜新批次编号。网络错误、字段变化或不安全编号会明确失败，不用示例兜底。

离线检查：node plugins.local/antgroup-campus/test/smoke.mjs 。停用、卸载或修改信任应从对应企业管理，保留用户投递记录。
