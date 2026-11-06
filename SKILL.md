---
name: design-library
description: "AI 产品、智能体体验和前端 UI 设计入口：按需使用 AI Design Skills 的交互、行为、安全、评估、编排与提示词设计主题；界面实现前检索 11 个开源组件库的 3,788 条候选。适用于新建或改造用户界面，不用于纯后端、文案或数据任务。"
tags: [design, frontend, ui, components, motion, reference, ai-product, agent-experience, uiverse, magicui, shadcn]
---

# Design Library：AI 产品设计与组件复用

**AI 产品先定体验，界面实现先查再写。** 涉及 AI 助手、智能体或生成式界面时，先按任务选择下方相关的 AI Design Skills 主题；需要实现视觉界面时，再查本地组件索引，确认十一家里有没有合适方案。

## 设计偏好

设计任务开始时，按[偏好规则](references/preference-memory.md)读取适用的长期与当前项目偏好，再结合本次要求自主选方案。收到具体审美反馈后，主动按规则更新用户本机记录；首次反馈前不创建记录文件。

十一站分四类，别混着比：

- **大型动效组件库**：Aceternity UI、React Bits、Originkit —— 整段区块与复杂动效，React 代码。
- **小零件**：Uiverse —— 按钮、加载、开关、复选、输入，HTML + CSS / Tailwind。
- **开源 shadcn 系**：Magic UI、Animata、Cult UI、Kokonut UI、Eldora UI —— 组件粒度，多数有 registry 可直接装。
- **提示词与生成器**：MotionSites（提示词）、Aura（整页生成）。

## AI Design Skills：AI 产品体验设计

本技能整合了 [Owl-Listener/ai-design-skills](https://github.com/Owl-Listener/ai-design-skills) 的六个主题入口。按当前任务挑选相关主题，不需要每次逐项展开：

| 主题 | 适用问题 | 技能索引 |
|---|---|---|
| 模型交互设计 | 对话流程、上下文窗口、反馈、混合主动权、多模态、生成式 UI | [8 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/model-interaction-design)：`context-window-design`、`conversation-patterns`、`feedback-loops`、`frustration-detection`、`generative-ui`、`mixed-initiative-flow`、`multimodal-orchestration`、`progressive-disclosure` |
| AI 对齐推理 | 同意与自主权、信任、透明度、偏差、护栏、伤害预判与升级处理 | [8 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/ai-alignment-reasoning)：`bias-detection-design`、`consent-and-agency`、`escalation-design`、`guardrail-design`、`harm-anticipation`、`transparency-patterns`、`trust-calibration`、`value-specification` |
| 系统行为塑造 | 助手角色、语气、情绪表达、错误反馈和行为一致性 | [7 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/system-behavior-shaping)：`behavioral-consistency`、`cultural-adaptation`、`domain-voice`、`emotional-design`、`error-personality`、`persona-architecture`、`tone-calibration` |
| 评估 | 失败分类、输出质量、任务成功、满意度和长期表现 | [7 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/evaluation)：`comparative-evaluation`、`failure-taxonomy`、`heuristic-evaluation-ai`、`longitudinal-measurement`、`output-quality-rubrics`、`task-success-metrics`、`user-satisfaction-signals` |
| 智能体编排设计 | 多智能体角色、任务拆分、交接、人类介入、状态与故障恢复 | [7 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/design-agent-orchestration)：`agent-role-design`、`failure-recovery`、`handoff-protocols`、`human-in-the-loop`、`observability-design`、`state-management`、`task-decomposition` |
| 提示词架构 | 系统提示词、上下文工程、约束、示例、模板和版本管理 | [7 项技能](https://github.com/Owl-Listener/ai-design-skills/tree/main/skills/prompt-architecture)：`chain-of-thought-design`、`constraint-specification`、`context-engineering`、`few-shot-patterns`、`prompt-versioning`、`system-prompt-structure`、`template-design` |

建议流程：先明确用户与模型分别能做什么、交互中的失败和风险如何处理、如何判断体验有效；涉及多智能体时补充角色与交接；涉及界面实现时，再用下方组件索引找可复用的视觉方案。上游仓库保留各技能的完整说明与命令。

> 触发词唯一源：`.agents/skill-router/skill-triggers.json` 的 `design-library` 条目。SKILL.md 不再维护第二份。

## 路由：什么时候用，交给谁

| 任务 | 本技能 | 之后交给 |
|---|---|---|
| AI 助手 / 智能体 / 生成式界面 | 选择相关 AI Design Skills 主题，梳理交互、行为、风险与评估；有界面时再查组件 | design-taste-frontend 或 impeccable 定视觉；需要产品流程时交 product-design:ideate |
| 新建落地页 / 区块 | 查同类实现，定结构与动效参数 | design-taste-frontend 或 impeccable 定审美 |
| 加按钮 / 开关 / 加载 / 弹窗 | 查 Uiverse 与组件库 | shadcn 落地 |
| 改造现有界面 | 找可替换的现成组件 | site-retrofit 主导前后对比 |
| 选风格 / 配色 / 字体 | 不在范围 | ui-ux-pro-max |
| 纯后端 / 文案 / 数据 | 不触发 | — |

一句话：**本技能负责 AI 产品体验主题选型和"有没有现成的 UI 方案"。** 视觉方向交 design-taste-frontend / impeccable，组件落地交 shadcn，验收交 visual-regression-acceptance。

与 motionsites 的区别也在这：它给提示词，本技能给能装的代码和带缩略图的候选。

## 界面实现：查本地索引

以下命令从技能根目录执行，路径相对于包含 `SKILL.md` 的目录。本机活动源位于共享 `.agents/skills/design-library`；发布副本可安装到任意技能目录。

```bash
node scripts/find.mjs "价格卡片 光晕" --limit 8
```

- 中文、英文、混写都行。中文设计词会自动映射到英文 slug（价格→pricing、光晕→glow、开关→toggle）。
- `--site uiverse|magicui|animata|cultui|kokonutui|eldoraui|aceternity|reactbits|originkit|motionsites|aura` 限定单站。
- `--json` 输出结构化结果。
- 索引含 3,788 条：Uiverse 1,956、Originkit 758、Aceternity 344、React Bits 217、Animata 156、Cult UI 134、Kokonut UI 90、Magic UI 86、Eldora UI 34、Aura 7、MotionSites 6。

输出是「分数 + 站点 + 名称 + 类别 + 链接」。分数只代表词面匹配，**不代表质量**。

### 看风格：缩略图墙

名字判断不了调性，生成一页缩略图墙直接看：

```bash
node scripts/gallery.mjs "hero" --limit 12
```

它先在更宽的候选里优先取有预览图的，再取前 N 条。缺图候选会显示无预览占位，不会生成坏掉的图片链接。传入 `--site` 可单站看。

生成的 HTML 会内嵌当前存在的本地预览图；远程预览仍使用源站 URL，离线时可能无法显示。

原始本机目录包含 2,269 张本地预览缓存，另有 1,462 个远程预览链接。公开包排除全部本地截图，只保留这些远程链接；链接可用性取决于源站。

本机原始目录的预览映射覆盖 3,731 条（共 3,788，98.5%）：

| 站点 | 覆盖 | 图源 |
|---|---|---|
| Uiverse | 1,925 | **本地渲染** galaxy 仓库的 HTML，480×300 JPEG |
| Originkit | 746 | `cdn.originkit.dev/components/<slug>-poster.jpg`，区块用 `-gallery.png` |
| Aceternity | 344 | 页面 `og:image`，真实组件截图 |
| React Bits | 216 | `reactbits.dev/og/<path>.jpg` |
| Animata | 156 | 页面 `og:image`，组件实拍 |
| Cult UI | 134 | 文档页预览区截图 |
| Kokonut UI | 90 | 文档页预览区截图 |
| Magic UI | 86 | 文档页预览区截图 |
| Eldora UI | 34 | 文档页预览区截图 |

Uiverse 的图不是抓官网，是把仓库里的 HTML + CSS 在本地无头浏览器里渲染出来——官网有 Cloudflare，抓不动，本地渲染反而稳定。渲染时会按元素文字/图形颜色猜深底还是浅底，再把过小的元素放大到画面 2.5 倍以内。

shadcn 系四家是直接截文档页里的预览面板（用 `[class*=preview]` 定位，截不到就退化成固定裁切）。它们的 OG 图只是标题卡，没有参考价值。

剩下 57 条是分类入口页和生成器首页，没有单一组件可截。

### 查询技巧

- **一次查一个意图**：价格区块和评价区块分两次查。
- 中文优先；结果不理想就换英文关键词（`glow`、`marquee`、`bento`）。
- 词越短越稳：`card` 好过 `pricing card with glow shadow`。
- 结果太杂时加 `--site` 收窄。
- 要现成小零件直接 `--site uiverse`，别和大型动效组件混排。

### Uiverse 的特殊之处

元素名是随机代号（`moody-horse-75`），按名字搜没有意义。索引里的 1,956 条是**按标签筛过的元素**，通用的 `button`/`loader`/`modern` 这类标签已经剔除——它们由分类页覆盖，留着只会淹没其他结果。

所以：查 `torch`、`glassmorphism`、`neumorphism`、`3d` 这类具体特征能直接命中元素；查 `button` 这种大类时，用分类入口 `/buttons` 自己翻。

**取代码走 GitHub，别硬爬网页。** uiverse.io 对非浏览器客户端返回 403，官方仓库有全量源码：

```
github.com/uiverse-io/galaxy
galaxy/Toggle-switches/Praashoo7_nasty-seahorse-26.html   ← 自包含 HTML + <style>
```

每个文件首行注释带 tags，`git clone --depth 1` 后本地 grep 比翻网页快。

## 第二步：确认候选

打开前 2–3 个链接，确认三件事：

1. 视觉是否匹配目标调性（暗色 SaaS、编辑感、 playful）。
2. 参数是否可调（颜色、密度、速度、圆角）。
3. 代码形态是否可落地（React 组件、纯 CSS、还是只能看）。

不要只看名字下结论。`Card Stack` 可能是 3D 卡片堆，也可能只是列表。

## 第三步：选复用层级

| 层级 | 做法 | 适用 |
|---|---|---|
| 整段复用 | 复制源码或 `shadcn add`，改品牌变量 | 结构完整、风格接近 |
| 只借参数 | 抄动效曲线、时长、光晕强度 | 自己已有结构 |
| 只借结构 | 照布局重写，不搬代码 | 授权不明或栈不匹配 |

复用后必须改：品牌色、字体、圆角、文案、间距节奏。原样搬运会一眼看出是组件库。

## 分工表

具体价格、许可、配额和可用功能以源站及对应组件页面的当前说明为准，取用前核对。

| 站点 | 最强的地方 | 取用方式 |
|---|---|---|
| Aceternity UI | Hero、Pricing、Footer、FAQ 区块齐全 | 复制代码；MCP 可装 |
| React Bits | 文字动效、背景、光标、微交互，数量最多 | `npx shadcn add @react-bits/<Name>-TS-TW` |
| Originkit | 背景与 Shader，可实时调参 | `npx originkit add <name>` |
| Uiverse | 4,497 个小零件 | 复制 HTML / CSS / Tailwind |
| Magic UI | 动效组件标杆：marquee、dock、beam、粒子 | `npx shadcn add https://magicui.design/r/<slug>.json` |
| Animata | 手写 CSS/SVG 动效，风格更"手作" | 文档内复制 |
| Cult UI | 偏 AI 产品与实验性交互 | `https://www.cult-ui.com/r/<slug>.json` |
| Kokonut UI | AI 界面、输入、导航组件 | `https://kokonutui.com/r/<slug>.json` |
| Eldora UI | 动效小组件补充 | `https://www.eldoraui.site/r/<slug>.json` |
| MotionSites | 设计方向与提示词 | 复制提示词给 AI 建站工具 |
| Aura | 一句话生成整页 | 导出 HTML / Figma |

## 取源码：先试 registry

shadcn 系站点都把组件源码挂在 `/r/<slug>.json`，一条命令装进项目（含依赖与文件路径）：

```bash
npx shadcn@latest add https://magicui.design/r/marquee.json
```

| 站点 | registry 前缀 | 备注 |
|---|---|---|
| Aceternity UI | `ui.aceternity.com/registry/<slug>.json` | 只有 components，blocks 无 registry |
| Magic UI | `magicui.design/r/<slug>.json` | 覆盖全部组件 |
| Cult UI | `www.cult-ui.com/r/<slug>.json` | 覆盖全部组件 |
| Kokonut UI | `kokonutui.com/r/<slug>.json` | 覆盖全部组件 |
| Eldora UI | `www.eldoraui.site/r/<slug>.json` | 覆盖全部组件 |
| React Bits | `@react-bits/<Name>-TS-TW` | 命名空间式，非 URL |
| Originkit | `npx originkit add <name>` | 需登录，计数 |
| Uiverse / Animata | 无 registry | 复制源码 |

三个实战坑：

- **先有 `components.json`**。Vite 项目里直接 `shadcn add` 会卡在初始化；手写一份（tailwind 配置、css 路径、`@` 别名）就能一路装完。
- **组件默认引用语义色**（`bg-card`、`border`、`muted-foreground`）。Tailwind 配置里没有这些颜色，装进来就是透明底。补一组颜色比改组件快。
- **复合 API**：Cult UI / Kokonut 的组件常是 Root + Window + Content 多个子组件拼装，装完先看 `export` 列表再写。

## 取用与授权

- 本技能只索引第三方名称、标签、链接和预览地址，不授予链接内容的代码、图片或商标权利。
- 复用前核对具体组件页面和源站当前许可、付费条件与使用配额；保留其要求的声明，不绕过访问限制。
- 不批量抓取或再分发第三方站点内容。

## 维护

两个脚本，分开跑：

```bash
node scripts/build-uiverse.mjs  # 从 galaxy 仓库重建 1,956 条元素
node scripts/build.mjs          # 合并所有站点，生成 catalog.json
node scripts/add-covers.mjs     # 增量补远程预览图
node scripts/shoot-uiverse.mjs  # 本地渲染 Uiverse 缩略图
node scripts/shoot-docs.mjs     # 截 shadcn 系文档页预览区
```

`build-uiverse.mjs` 第一次会自动 clone 仓库到临时目录；`build.mjs` 会读 `data/uiverse-elements.json`，没有就只用分类入口。建议每月一次。

新增站点：在 `build.mjs` 里加一段 sitemap 解析（shadcn 系站点直接复用 `docsSite()`）。

## 常用查询

```bash
node .../find.mjs "hero 3d tilt"           # 首屏 3D 倾斜
node .../find.mjs "pricing"                # 价格区块
node .../find.mjs "文字 打字机"             # 打字机文本
node .../find.mjs "鼠标跟随 粒子"           # 光标粒子拖尾
node .../find.mjs "bento grid"             # Bento 布局
node .../find.mjs "torch" --site uiverse   # 那个手电筒开关
node .../find.mjs "glassmorphism"          # 玻璃拟态元素
node .../find.mjs "dock"                   # 四个站都有，对比着看
```

## 判断标准

- 查到 3 个以上高分候选：优先复用，省时间。
- 只查到弱相关：借参数或结构，不硬套。
- 完全无结果：说明需求较新，从零写，并把结果补进自己的组件库。
