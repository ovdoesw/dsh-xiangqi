# dsh-xiangqi — DSH 象棋消遣插件 设计文档

日期：2026-08-15
状态：待用户审阅

---

## 1. 目标与非目标

### 目标
在 DeepSeek Harness（DSH）Web GUI 内提供一个"AI 思考时可以下中国象棋"的消遣插件：一个卡通小宠物悬浮在界面上，邀请用户下棋；人机对弈（内置自写引擎），并在对局过程中提供"天天象棋定式名 + 三国杀风格击杀台词"的即时提示，以及可选的多模型 LLM 局势点评。

### 非目标（YAGNI）
- 不做联网多人对战。
- 不做完整中国象棋竞赛规则仲裁（长将/长捉只做简化版，见 §5）。
- 不做残局库、开局库的深度学习。
- 不接入外部 UCI 引擎（Stockfish 等）。
- 不做棋谱导出/分享。

---

## 2. 需求明细

| 维度 | 决策 |
|---|---|
| 玩法 | 纯消遣，人机对弈（中国象棋），与对话 agent 完全独立，不阻塞 agent 主循环 |
| 棋种 | 中国象棋 |
| AI 引擎 | 内置自写：negamax + α-β 剪枝 + 估值函数，难度用搜索深度分档 |
| 难度 | 初级 / 中级 / 高级（搜索深度递增 + 初级加随机扰动） |
| 入口 | CSS/SVG 卡通小宠物（抱一枚"象"字棋子），悬浮于 `shell.overlay` |
| 交互 | 悬停：棋子升起 + 气泡邀请台词；点击：打开小面板；可放大全屏；Esc 收起 |
| 呈现 | 浮动小面板 + 可放大全屏棋盘 |
| 台词 | 天天象棋开局定式名 + 三国杀风格击杀台词 |
| 台词分层 | 定式名/击杀台词由本地规则引擎**离线即时**触发；LLM **叠加局势点评** |
| 点评时机 | 每步自动 + 手动单步，均可开关 |
| 点评风格 | 可切换（专业棋评 / 娱乐主播），默认娱乐 |
| 点评模型 | 默认复用 DSH 模型列表（`ctx.llm`）；插件设置可覆盖 base/key/model |

---

## 3. 架构

单 npm 包 `dsh-xiangqi`，`src` 下分层，纯函数核心层可独立单测。

```
dsh-xiangqi/
├── src/
│   ├── core/                  # 纯 TS，零依赖，无 React/Cordis
│   │   ├── board.ts           # 9×10 棋盘、棋子表示、初始布局
│   │   ├── moves.ts           # 走法生成（含全部特殊规则校验）
│   │   ├── rules.ts           # 将帅照面、将军、将杀、困毙、长将简化仲裁
│   │   ├── openings.ts        # 开局定式库（当头炮/仙人指路/屏风马…）
│   │   ├── flavor.ts          # 三国杀风格击杀台词表 + 触发判定
│   │   └── fen.ts             # 局面序列化（FEN），用于持久化与可复现
│   ├── ai/
│   │   ├── evaluate.ts        # 子力价值 + 位置分
│   │   ├── search.ts          # negamax + α-β + 迭代加深 + 异步分片
│   │   └── engine.ts          # 难度分档封装、异步调度（不阻塞主线程）
│   ├── client/
│   │   ├── store.ts           # defineStore：局面/历史/难度/胜负/面板/宠物/设置
│   │   ├── comment.ts         # LLM 点评调用与编排（ctx.llm / 覆盖配置）
│   │   ├── Mascot.tsx         # SVG 卡通小宠物（抱"象"）；悬停动画+气泡
│   │   ├── BoardPanel.tsx     # 小面板浮窗棋盘
│   │   ├── FullscreenBoard.tsx# 全屏棋盘
│   │   ├── pieces.tsx         # 棋子 SVG（红黑汉字）
│   │   └── index.tsx          # 注册 shell.overlay 的根组件
│   └── plugin.ts              # apply(ctx)：register + 服务面
├── test/                      # node --test 单测
├── package.json               # type:module + dsh 元数据
└── README.md
```

---

## 4. 挂载机制（已从 @deepseek-ai/dsh@0.1.0-rc.6 源码确认）

- 插件是在 DSH 客户端运行的 Cordis 插件：导出 `apply(ctx)` 与 `inject`。
- 通过 `ctx.slots.register({ name: 'shell.overlay', id: 'xiangqi-mascot', store: createStore, inject }, Component)` 累加挂载。
- `shell.overlay` 是 `kind: 'list'`、`scope: 'root'` 的帧级浮动层，点击穿透（`pointer-events:none`），条目需自行恢复 `pointer-events:auto`。累加式注册不清掉其他 overlay 条目。
- store 用 `defineStore({ init, persist, actions })`；组件通过 `useStore`（selector 读）与 `actions`（写）访问；`persist` 实现局面持久化。
- LLM 点评复用 `ctx.llm`（DSH 已提供 llm 服务与模型选择 UI）；插件设置内可覆盖自定义 endpoint。

---

## 5. 规则引擎要点（正确性核心）

走法生成需正确处理：
- **马**：蹩马腿。
- **炮**：直线行进；吃子需隔且仅隔一子（炮架）。
- **象**：田字走 + 塞象眼；不得过河。
- **士**：九宫内斜线。
- **将/帅**：九宫内直走一步；两王不得照面（"将帅照面"为非法）。
- **兵/卒**：过河前只前进；过河后可横走一步；终局不可后退。

走子合法性：走完后己方将不得处于被攻击状态（防"送将"）。

终局判定：
- **将杀 (checkmate)**：被将军且无法解。
- **困毙 (stalemate)**：无子可动（按中国象棋规则判负）。
- **长将/重复局面**（简化版）：检测同一局面第三次循环出现，判将方负；简化实现不覆盖长捉。

---

## 6. AI 引擎要点

- 估值：子力分值（车9 / 炮4.5 / 马4 / 象2 / 士2 / 兵1 / 将∞）+ 简单位置分表。
- 搜索：negamax + α-β 剪枝 + 迭代加深。
- 异步：采用分片计算（`setTimeout`/rAF 让步）或 Web Worker，**绝不阻塞主线程/agent 循环**。
- 难度分档：
  - 初级：深度 1 + 随机扰动（选分接近的若干候选之一）。
  - 中级：深度 2–3。
  - 高级：深度 3–4 或限时搜索。

---

## 7. 台词系统（本地）与 LLM 点评（叠加）

### 7.1 本地台词（离线即时，规则引擎触发）
- 开局定式库 `openings.ts`：识别头几步的固定招法并喊名（当头炮、仙人指路、屏风马、顺手炮、列手炮…）。
- 击杀台词 `flavor.ts`：吃子时按吃子方/被吃子力值匹配三国杀风格台词（例如"一破，卧龙出山""雷公助我"等），以文字气泡展示（不依赖音频）。
- 将军、绝杀等事件也可挂接台词。

### 7.2 LLM 局势点评（叠加，可开关）
- 输入：当前局面（FEN）+ 最近走法 + 事件（定式名/吃子/将军）。
- 输出：短评（1–3 句）。
- 风格可切换：专业棋评 / 娱乐主播。
- 时机：每步自动（可关）+ 手动点评按钮。
- 模型来源：默认复用 `ctx.llm`（DSH 已配置的模型）；插件设置可覆盖 base/key/model。

---

## 8. 状态 store 形状

```ts
{
  fen: string;              // 当前局面
  history: Move[];          // 走子历史
  difficulty: 'easy'|'medium'|'hard';
  gameOver: null | { winner: 'red'|'black'|'draw'; reason: string };
  panel: 'closed'|'panel'|'fullscreen';
  mascot: { x: number; y: number };   // 悬浮位置（可拖拽持久化）
  settings: {
    autoComment: boolean;             // 每步自动点评（默认开）
    commentStyle: 'pro'|'fun';        // 默认 fun
    llmOverride: null | { base: string; key: string; model: string };
  };
  lastEvent: null | { type: 'opening'|'capture'|'check'|'mate'; line: string };
}
```

---

## 9. 验证与测试

- `core/` 纯函数单测（`node --test`）：走法生成、将军/将杀/困毙、FEN 往返、定式识别、击杀台词触发。
- `ai/` 测试：已知残局（单马、单车胜）能搜到杀棋；不同难度耗时分层。
- 端到端：装载进本机 DSH（http://127.0.0.1:3080），验证宠物悬停/气泡/面板/全屏/对局/点评全流程。

---

## 10. 明确的范围边界与风险

- 长将/长捉仲裁为简化版（重复局面三次判将方负）；完整亚洲规则仲裁不在 v1 范围。
- 击杀台词为文字呈现，不实现音频播报（后续可加）。
- LLM 点评依赖网络与 token 消耗；离线时只有本地台词，体验仍完整。
