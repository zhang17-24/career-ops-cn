---
name: job-apply
description: Use when the user asks to help with 秋招/校招/网申/投递简历 — campus recruitment job applications for themselves or a student (学员). Triggers include: 秋招, 校招, 网申, 投递, 校招官网, 投递台账, 内推, campus recruitment, or any request to apply for jobs on company career sites.
---

# job-apply — 秋招投递

## 概述

统一编排「找岗位 → 填表单 → 上传简历 → 提交 → 记账」的秋招网申流程。铁律三条:链接只从 `references/companies.md` 查(不凭记忆造);投递前必查台账、投递后必记账(`records/applications.jsonl`);提交动作默认必须经用户确认(`config.json` 可改)。

## 每次投递前先收集(缺一不可)

1. 学员姓名
2. 简历文件路径(.docx / .pdf / .md)
3. 个人信息文件路径(JSON,模板见 `references/personal-info-template.json`)
4. 目标:岗位方向(如「前端开发」)+ 城市偏好 + 意向公司(可选,可多选)
5. 提交模式:缺省读 `config.json` 的 `submit_mode`;用户临时指定则仅本次生效

## 工作流

1. **届别检查** — 用个人信息文件里的毕业时间核对招聘批次:正式批只收当年应届(如 2027 届 = 2026.09–2027.08 毕业)。不匹配时暂停,提示改投实习岗或该批次不符,绝不硬投。
2. **查重** — 在 `records/applications.jsonl` 里检索 学员+公司(+岗位)。已投过 → 暂停询问用户是否仍要继续。
3. **找岗位** — 从 `references/companies.md` 取该公司校招官网链接,ego-browser 打开,进入校招岗位列表页,按方向/城市筛选,列出匹配岗位(标题 + 要求摘要 + 届别要求)让用户勾选。链接打不开时:WebSearch「<公司名> 校招官网」找新链接,验证后回写 companies.md。
4. **填表** — 打开投递页,按表单字段从个人信息 JSON 取值填写;字段含义不确定(如「户籍」vs「现居」)暂停询问,不猜。简历附件用 ego-browser 的 `uploadFile`。附件格式/大小不符合要求的,先用 docx/pdf 工具转换。
5. **提交** — 按提交模式:
   - `confirm`(默认):填完展示核对清单(岗位 / 姓名 / 手机 / 邮箱 / 简历文件 / 城市),用户确认后才点提交按钮
   - `auto`:填完直接提交
   - `manual`:填完由用户自己在浏览器点提交
6. **记账** — 追加一行到 `records/applications.jsonl`:`{"time","student","company","position","url","status","mode"}`。status 取值:`submitted`(已提交)/ `ready`(已填完等用户确认)/ `manual`(用户自行提交)/ `failed`(失败+原因)。
7. **汇报** — 本次投递结果 + 该学员台账摘要(已投哪些公司、什么状态)。

## 浏览器操作要点(ego-browser 0.4.6 实测)

本机 ego-browser 为 0.4.6.14,与 ego-browser skill 文档(1.2.x)有行为差异,实测可用模式:

- 开空间导航:`useOrCreateTaskSpace(name)` → `listTabs()` 取 `targetId` → `switchTab(targetId)` → `gotoUrl(url)`
- **`openOrReuseTab` 和 `wait()` 在本版本会挂起,禁用**;等待用 `await new Promise(r => setTimeout(r, ms))`
- 读页面状态:`listTabs()`(url/title)、`snapshotText()`(页面文本)、`js()`(页面内 JS)
- 输出走 `cliLog()`;heredoc 输出只在进程退出时刷新,脚本末尾加 `process.exit(0)`
- 脚本里用 `require` 时需包裹 async 函数,或改用 `const fs = await import('fs')`(顶层 await 与 require 不能混用)
- **登录墙 / 验证码 / 风控**(字节、腾讯等校招页对自动化较严)→ 暂停,请用户在 ego lite 窗口手动完成登录后继续

## 修改提交模式

- `config.json`:`{"submit_mode": "confirm"}`
- 用户说「这次直接投」→ 仅本次用 auto;说「以后都自动投」→ 改 config.json
- 改完在回复中确认当前生效的模式

## 常见错误

- 凭记忆/猜测校招官网 URL → 只用 companies.md,失效才搜索并回写
- 不查台账直接投 → 重复投递可能进企业黑名单
- 不核对毕业时间与批次 → 2028 届投 2027 届正式批 = 无效投递(基线实测踩过)
- 表单字段靠猜(把「现居地」填进「户籍地」)→ 不确定就问
- confirm 模式下没等用户确认就点提交 → 投递不可逆,必须等

## 文件结构

- `references/companies.md` — 企业校招官网链接库(223 家,16 类;文件顶部有分类索引,可锚点跳转)
- `references/personal-info-template.json` — 个人信息 JSON 模板(每学员一份)
- `references/form-filling-guide.md` — 校招表单填写规范与踩坑点
- `records/applications.jsonl` — 投递台账(追加式,勿删)
- `config.json` — 提交模式配置
