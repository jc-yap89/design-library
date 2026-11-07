# 组件目录使用指南

本文是 SKILL.md 中检索细节的完整版：缩略图墙、查询技巧、Uiverse 的特殊之处、站点分工表、registry 取源码、维护脚本、常用查询。流程与判断标准仍在 SKILL.md。

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
- 结果行末的 `⚠ fx: glow, gradient` 表示名称或标签含装饰效果词（gradient、glow、neon、glass、liquid、aurora 等），只是提醒多看一眼，不是质量判断。加 `--no-fx` 可直接隐藏这类条目；`gallery.mjs` 同样支持，并在卡片上标出。用户明确要这类效果时不要用 `--no-fx`。
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

## 分工表

具体价格、许可、配额和可用功能以源站及对应组件页面的当前说明为准，取用前核对。

| 站点 | 最强的地方 | 取用方式 |
|---|---|---|
| Aceternity UI | Hero、Pricing、Footer、FAQ 区块齐全 | 复制代码；MCP 可装 |
| React Bits | 文字动效、背景、光标、微交互，数量最多 | `npx shadcn add @react-bits/<Name>-TS-TW` |
| Originkit | 背景与 Shader，可实时调参 | `npx originkit add <name>` |
| Uiverse | 4,497 个小零件（目录收录其中按标签筛过的 1,956 条） | 复制 HTML / CSS / Tailwind |
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
