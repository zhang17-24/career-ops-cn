# 腾讯 2027 校招：开发核验

2026-09-11（北京时间），Ego Lite 空间17。官网首页→岗位投递→2027校园招聘。
列表 https://join.qq.com/post.html?query=p_1 ，POST https://join.qq.com/api/v1/position/searchPosition 。
实际body见index.mjs：projectMappingIdList=[1]，pageIndex=1，pageSize=10；无地点限制，产品层再筛地点。
响应HTTP200，status=0，data.count=117，第一页10条。只处理这一页，不覆盖全部117条。
字段 positionTitle→title、workCities→location、字符串postId→实际详情路由。没有发布时间，不伪造日期。

以下3个真实详情名称、岗位描述、岗位要求可读，无需登录读取，未投递：
- AI全栈工程师 / 1282707398326592512 / https://join.qq.com/post_detail.html?postid=1282707398326592512
- Agent开发工程师 / 1282707395466077184 / https://join.qq.com/post_detail.html?postid=1282707395466077184
- AI应用工程师 / 1282707395466077185 / https://join.qq.com/post_detail.html?postid=1282707395466077185

前两条实际点击新标签；第三条点击被浏览器拦截新窗，经一次DOM正常点击捕获window.open真实参数（原函数透传并恢复），直接打开实际地址后正文可读。不是猜路由。
生产无fixture依赖、无凭证。离线测试覆盖长编号、字段、空列表、异常、去重、一页上限和网络错误。
命令：node test/smoke.mjs（在此候选目录）、node --check index.mjs、根目录 node plugin-audit.mjs plugins.local/company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9 。
开发完成保持候选停用，由平台独立验收后安装；页面扫描另记总报告。
