# 哔哩哔哩应届生招聘：开发验收

时间：2026-09-11 北京时间，Ego Lite 实际官网导航及普通 Node HTTP 核验。
入口：https://jobs.bilibili.com/campus/ → 应届生招聘 → https://jobs.bilibili.com/campus/positions?type=3 。

公开初始化 GET https://jobs.bilibili.com/api/auth/v1/csrf/token ，随后 POST https://jobs.bilibili.com/api/campus/position/positionList 。匿名CSRF只在内存使用，不保存值或Cookie。官网用户信息接口返回未登录；列表正常显示91条。
公开客户端标识 X-AppKey=ops.ehr-api.auth、X-UserType=2、X-Channel=campus 来源于官网实际列表请求，不是账号密钥。缺这些标识返回-101，缺匿名CSRF返回-3；公开初始化后无需登录即可得到code=0。
列表请求固定 pageNum=1、pageSize=10、workTypeList=["3"]、positionTypeList=["3"]，其他筛选为空，onlyHotRecruit=0。仅1页10条，未遍历91条。
字段 positionName/id/workLocation/pushTime/positionDescription 映射标题/字符串编号/地点/北京时间/描述。长编号不得转Number，未知发布时间留空。

实际从列表点击观察到的详情路由（不是猜测）：
- 30401：【B-UP】音视频理解工程师（校招），https://jobs.bilibili.com/campus/positions/30401 ，标题一致，上海，工作职责与工作要求可读，显示网申截止2027-06-30。
- 30368：SLG游戏版本运营【2027届】，https://jobs.bilibili.com/campus/positions/30368 ，标题一致，上海，职责与要求可读，显示网申截止2026-12-31。
- 29738：游戏版本运营（ARPG）【2027届】，https://jobs.bilibili.com/campus/positions/29738 ，由真实列表按钮调用window.open的参数观察，使用相同地址打开核对；标题一致，上海，4条职责和5条要求可读，网申截止2026-12-31。三条均未遇登录或验证码，未点击投递。

离线命令：`node test/smoke.mjs`、`node --check index.mjs`、`node plugin-audit.mjs plugins.local/company-68a3ca39-7edd-4988-a257-531c48bb3471`。
已通过字段、空数据、异常数据、长编号、去重、单页限制、匿名初始化失败等测试；fixture在test目录，生产不导入。
启用与页面验收：尚未执行；候选默认停用，由平台独立再核验真实列表和3条详情，通过才安装绑定。未登录、未投递、未全量扫描。
