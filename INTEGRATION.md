# dsh-xiangqi 接入 DSH —— INTEGRATION

本文说明如何把这个插件装进 DeepSeek Harness（DSH），以及如何验证它是否正常工作。

## 插件形态速览

- 是 **Cordis 客户端插件**（`type: module`），运行在 DSH 的 Web 客户端内。
- 入口：
  - `"."` → `./lib/plugin.js`，导出 `apply(ctx)` 与 `inject`（服务注入），Cordis 主入口。
  - `"./client"` → `./lib/client.js`，客户端 bundle 入口（转导同一 `apply/inject`）。
- `package.json` 的 `dsh.client` 元数据声明了所需注入 `@deepseek-ai/dsh-client-runtime` 与 `@deepseek-ai/dsh-client-ui-slots`，平台 `web`。
- UI 挂载：`apply(ctx)` 里 `ctx.slots.register({ name: 'shell.overlay', id: 'xiangqi-mascot', store, inject }, XiangqiOverlay)`。

## 一、构建产物

源码在 `src/`；包的 `exports` 指向编译后的 `lib/`。接入前需要先编译 TS 到 `lib/`：

```bash
# 在插件仓库根目录
npx tsc -p tsconfig.json     # 产出 lib/
```

> 插件内没有把 `tsc` 固化成一个 `build` script，接入 DSH 前请先执行上面的编译；`npm test` 走的是 tsx 直接加载 `src/`，与 `lib/` 无关。

## 二、装载方式（二选一）

### 方式 A：cordis.patch.yml（推荐，门槛低）

在 DSH 的本地配置目录找到/创建 `cordis.patch.yml`，把插件作为依赖挂进来并启用：

```yaml
plugins:
  - plugin: "@deepseek-ai/dsh-xiangqi"
    disabled: false
```

如果插件是本地路径（开发中），可用文件链接方式：

```yaml
plugins:
  - plugin: "file:F:/桌面/dsh/Xiangqi"
    disabled: false
```

DSH 会读取包的 `dsh.client` 元数据，在客户端装配 `shell.overlay`。配置变更后需要重启 DSH 客户端进程，让 patch 重新解析。

### 方式 B：dsh plugin 命令

若你的 DSH 提供了插件管理 CLI，也可以：

```bash
dsh plugin add @deepseek-ai/dsh-xiangqi
dsh plugin enable @deepseek-ai/dsh-xiangqi
# 然后重启 / 刷新 Web GUI
```

把 `@deepseek-ai/dsh-xiangqi` 换成 `file:F:/桌面/dsh/Xiangqi` 即为本地调试。

## 三、验证步骤

### 1. 核心层单测（不依赖 DSH，可离线）

已覆盖走法生成（马腿/炮架/象眼/九宫/照面/兵卒）、将军/将杀/困毙、FEN 往返、定式识别，以及客户端 FEN 游戏助手：

```bash
npm test
# 预期：tests 36, pass 36, fail 0
```

> 注意：`npm run typecheck`（`tsc --noEmit`）在**未装载进 DSH / 未安装 peer 依赖**时会对 `@deepseek-ai/dsh-client-runtime/client`、`@types/react` 报"找不到模块"。这是环境性报错（这些类型由 DSH 运行时提供），不是核心规则层的编译问题。核心/AI 层（`core/`、`ai/`、`client/game.ts`）均为零依赖纯 TS，单测全程绿色。

### 2. 浏览器装载：看悬浮宠物

1. 确保 DSH 已在本机运行（`http://127.0.0.1:3080`）。
2. 通过上面任一方式装载插件后，刷新浏览器。
3. 页面右下/默认位置应出现一只卡通小宠物（抱"象"字）。
4. 验证交互闭环：
   - **悬停**：棋子升起，出现"来下一盘？"等邀请气泡。
   - **点击**：打开小面板棋盘（红方先行）。
   - **走子**：选子出现高亮 + 绿色合法目标点，点击落子；AI 思考后回招（思考中显示"AI 思考中…"）。
   - **全屏**：`全屏` 放大，`Esc` 收起。
   - **悔棋 / 新局 / 难度切换** 均生效。
   - **点评**：点击 `点评` 触发 LLM 点评；`设置 → autoComment` 控制每步自动点评，`commentStyle` 切换 pro / fun。
5. **持久化**：刷新页面后，进度、难度、宠物位置应保持不变。

### 3. 观察 overlay 不冲突

`shell.overlay` 是 `kind:'list'`、`scope:'root'` 的帧级浮动层，累加式注册。此插件只挂一只 `xiangqi-mascot`，并自行把根容器 `pointer-events: auto`（overlay 默认点击穿透）。若同时有其他 overlay 插件，两者会并存、互不清除。

## 四、配置说明

| 配置 | 位置 | 说明 |
|---|---|---|
| 难度 | 小面板顶部下拉 | 初级 / 中级 / 高级 |
| 自动点评 | 设置 `settings.autoComment` | 默认开；每步自动触发 LLM 点评 |
| 点评风格 | 设置 `settings.commentStyle` | `pro` 专业棋评 / `fun` 娱乐主播，默认 `fun` |
| LLM 覆盖 | 设置 `settings.llmOverride` | `{ base, key, model }` 非空则走 OpenAI 兼容直连；留空复用 DSH `ctx.llm` |

## 五、排错

- **宠物不出现**：确认 `dsh.client.platform === 'web'`、注入的两组 `@deepseek-ai/*` 已声明；确认 `apply` 在 Cordis 里被调用（`lib/` 已编译）。
- **TS 类型报错**（`react` / `dsh-client-runtime` 找不到）：装载进 DSH 或 `npm i -D @types/react @deepseek-ai/dsh-client-runtime @deepseek-ai/dsh-client-ui-slots @deepseek-ai/cordis` 后再 `typecheck`。
- **AI 不落子**：确认所选难度能被引擎计算（高级为深度 4 / 5s 限时）；引擎层为异步分片，不应卡死主线程。
- **点评无输出**：默认复用 DSH `ctx.llm`，需 `llm.stream` 可用且 provider 有模型；默认模型回退为 `deepseek-v4-pro`（本部署 opencode-go 已配置）。也可在设置里填 `llmOverride` 直连 OpenAI 兼容端点。所有失败静默降级为 `null`，不影响对局。
