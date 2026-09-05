# career-ops 中国版

把 Codex、Claude Code、Qwen 等编程助手变成你的本地求职工作台。

一句话理解：它不是新的 AI 模型，而是一套可以接到 Codex 或 Claude Code 上的求职流程和本地 Web 页面。

本仓库基于 [career-ops](https://github.com/career-ops-hq/career-ops) 改造，保留 MIT 许可和原作者信息。中国版默认使用中文，并把职位发现入口换成国内企业招聘官网。

## 中国版增加了什么

- 中文 Web 工作台：今日、找职位、投递进度、跟进、招聘源、分析、简历和设置。
- 223 个经过验证的企业校招官网，完整继承自 `job-apply` Skill，见 [`templates/china-campus-companies.md`](templates/china-campus-companies.md)。
- 其中 6 家可通过飞书/Moka 接口零 Token 自动读取；其余 217 家由 AI 限定在对应企业官网搜索，或由用户直接打开官网。
- 腾讯、美团、阿里等已有适配器目前读取的是社招接口，中国版不会拿社招结果冒充校招结果。
- `campus` / `校招` 模式：找岗位、查重、填表、验证码交接和提交前确认。
- 中文个人信息示例与填表规则，不包含真实个人资料。
- BOSS 直聘、拉勾、猎聘等聚合平台只做人工打开或导入；不绕过登录、验证码或滑块。

## 它怎么工作

把它想成一个“求职文件夹 + 助手”：

1. 企业官网公开职位被扫描到本地。
2. 你挑选值得看的岗位。
3. AI 根据你的简历评估匹配度并准备材料。
4. 投递状态保存在本地 Markdown/TSV 文件中。
5. 真正提交申请前，必须由你确认。

它不是云端数据库，也不要求另起 MySQL、Redis 或 Docker。个人简历、岗位和投递记录默认只在你的电脑上。

## 安装

需要 Node.js 22 或更新版本。

```bash
git clone https://github.com/zhang17-24/career-ops-cn.git
cd career-ops-cn
npm install
cp config/profile.example.yml config/profile.yml
cp templates/portals.china.yml portals.yml
```

把简历保存为 `cv.md`，再在仓库目录打开 Codex：

```bash
codex
```

可以直接说：

```text
运行 career-ops 校招模式，帮我找北京或上海的产品经理岗位。
运行 career-ops scan 模式，扫描最近 7 天的国内职位。
评估这个职位，并生成中文简历：<职位链接>
```

## 启动 Web 页面

```bash
cd web
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 数据和资源占用

- 数据存储：`cv.md`、`config/`、`data/`、`reports/`，都是普通本地文件。
- 额外服务：不需要数据库、Redis 或后台云服务。
- 运行时：命令行扫描只在执行时运行；Web 页面需要一个本地 Node 进程。
- 浏览器：生成 PDF 或辅助网页操作时会启动 Chromium，这通常是内存占用最大的部分。
- 本机实测：Web Node 进程空闲约 56 MB 内存；两套依赖目录约 463 MB，生产构建缓存约 141 MB。
- 浏览器和 AI 命令行按需启动，峰值取决于同时打开的页面、模型工具和扫描规模。

## 安全边界

- 不自动海投。
- 不编造个人经历或表单答案。
- 不绕过登录、短信、验证码、滑块或人脸验证。
- 不把身份证、手机号、住址、账号或投递记录提交到 Git。
- 点击最终“提交申请”、发送邮件或发送消息前必须获得当次确认。

## 许可和来源

本项目沿用原仓库的 [MIT License](LICENSE)。原项目由 Santiago Fernández de Valderrama 和 career-ops 社区维护；本仓库是面向中国招聘场景的社区改造版，不代表招聘平台官方产品。
