# @matrix-platform/vue-lint

Vue 3 + 純 JavaScript(ESM)+ Sass 專案的共用 lint 設定:一份 ESLint 工廠、一份 stylelint 設定、四支自訂規則。適用 `.css`、`.html`、`.js`、`.json`、`.scss`、`.vue`。

只有整套,不可拆;不分層、不匯出規則分組。

## 安裝

`eslint` 與 `stylelint` 是 peerDependency,由你的專案提供;其餘 plugin 套件自己帶。沒發佈到 npm,走 git 依賴跟著 `main`:

```json
"devDependencies": {
    "@matrix-platform/vue-lint": "github:matrix-platform/vue-lint#main",
    "eslint": "^10.8.0",
    "stylelint": "^17.14.1 || ^18.0.0"
}
```

## 用法

```js
// eslint.config.js
import lint from "@matrix-platform/vue-lint";

export default lint({
    browserFiles: ["src/**/*.js"],
    ignores: ["**/__screenshots__/**"]
});
```

```js
// stylelint.config.js
export { default } from "@matrix-platform/vue-lint/stylelint";
```

stylelint 無參數:`.scss` 走 `postcss-scss`、`.vue` 走 `postcss-html`,規則只有 `stylelint-order` 兩條——區塊順序 custom properties → declarations → rules → at-rules,屬性名字母排序。

### 工廠參數

四個都可省略。

| 參數 | 型別 | 作用 |
| --- | --- | --- |
| `browserFiles` | `string[]` | 哪些 `.js` 吃 browser 全域。空值時該段 config 不輸出 |
| `browserGlobals` | `object` | browser 全域的增補 |
| `ignores` | `string[]` | 附加的 ignore(`**/node_modules/**`、`**/dist/**` 已內建) |
| `nodeGlobals` | `object` | node 全域的增補 |

### 全域邊界

`no-undef` 開 error,且**不吃 ESLint 內建的 env / globals 預設集**,套件自己維護兩份白名單:

| 白名單 | 內容 | 誰吃得到 |
| --- | --- | --- |
| `STANDARD_GLOBALS` | `AbortController`、`File`、`URL`、`console` | 全部 `.js` 與 `.vue` |
| `BROWSER_GLOBALS` | `document`、`window`、`getComputedStyle`、`performance`、`requestAnimationFrame`、`ResizeObserver`、`Node`、`NodeFilter`,以及 `Event` / `MouseEvent` / `KeyboardEvent` 等事件建構子 | `browserFiles` 命中的 `.js`,加上全部 `.vue` |

清單刻意留短。`fetch`、`localStorage`、`matchMedia`、`setTimeout`、`process`、`Buffer` 都不在裡面,裸著用一律 `no-undef`。三條出路:加前綴(`window.setTimeout(fn, 0)`)、走具名 import(`import { tmpdir } from "node:os"`)、或用 `browserGlobals` / `nodeGlobals` 從呼叫端補——不要動套件。

`browserFiles` 是**疊加**不是切換:命中的 `.js` 同時吃 node 與 browser 兩邊。`.vue` 一律吃 browser 全域,不受 `browserFiles` 影響。

## 自訂規則

四支都掛 error,不能個別調級。要例外就逐處 `// eslint-disable-next-line <rule> -- <理由>`,理由必填。

| 規則 | 適用 | autofix |
| --- | --- | --- |
| `house/require-v-for-parentheses` | `.vue` | 有 |
| `house/sort-import-clauses` | `.js`、`.vue` | 有(見下) |
| `house/sort-module-declarations` | `.js` | 無 |
| `house/sort-template-attributes` | `.vue` | 無 |

### `house/require-v-for-parentheses`

`v-for` 的別名一律加括號,只有一個也不例外。括號內是「這輪拿到什麼」、`in` 右邊是「從哪裡拿」,邊界固定。

```html
<div v-for="(item) in items"></div>
<div v-for="(item, index) in items"></div>
<div v-for="(value, key, index) in object"></div>
```

分隔符不歸這條管,`(item) of items` 一樣過;要禁 `of` 用 `vue/v-for-delimiter-style`。

### `house/sort-import-clauses`

比較 `import` 與 `from` 之間的**原始文字**,ASCII 升冪。比的是原始文字而非模組路徑,順序天然變成:副作用(`"` = 34)→ `* as ns`(`*` = 42)→ 預設(字母)→ 具名(`{` = 123)。機械判準,review 不必吵分組。

```js
import "side-effect";
import * as namespace from "namespace";
import Alpha from "alpha";
import { zebra } from "zebra";
```

**咬人點**:autofix 一次只交換相鄰兩行,單 pass 不保證全序(ESLint 會重跑到收斂,實務上看不出來);但**目標行上方只要有註解就整處放棄 fix**,只能手動搬。

### `house/sort-module-declarations`

模組層宣告分四組:未匯出非函式 → 未匯出函式 → 匯出非函式 → 匯出函式,組內按識別字 ASCII 排序。檔案打開就是固定地形:常數在上、行為在中、對外介面在最後。

```js
const roots = new WeakMap();
const captureClass = () => {};
export const policy = {};
export const useRootTheme = () => {};
```

無名的 `export default { ... }` 取不到識別字,不參與排序也不受約束。

**`let` / `var` 與 `const` 分開排。** 可變宣告只跟可變宣告比,不會被要求排進 `const` 的字母序裡,所以模組層那一兩個可變狀態可以放在檔案最上面(或任何讀起來合理的位置)而不必為它加豁免。它們彼此之間仍然按 ASCII 排序。

```js
let cache = null;

const Alpha = 1;
const Zebra = 2;
```

**咬人點:TDZ**。規則要求非函式排在函式**之前**,而 `const foo = () => {}` 不 hoist,於是 `const value = helper();` 排到 `const helper = () => 1;` 之前就 `ReferenceError`。規則只看形狀、不認相依。兩條路:

1. **讓 value 不在模組層求值**——改成 `const value = () => helper();`,或把呼叫搬進真正用到的地方。先試這條。
2. **把 helper 改成函式宣告**,hoist 得到;代價是 `no-restricted-syntax` 擋 `FunctionDeclaration`,要逐處豁免:

```js
// eslint-disable-next-line no-restricted-syntax -- hoisting: value above is initialized by this helper
function helper() {
    return 1;
}
```

### `house/sort-template-attributes`

template 內每個 tag 的 attribute 按 ASCII 排序,忽略開頭的 `@` / `:` / `#`(符號保留);原始文字以 `v-` 開頭的一律排最後,彼此順序不拘。

```html
<div :class="classes" @click="click" #default id="probe" v-if="shown"></div>
```

attribute 沒有語意先後,順序純看誰先打字,加個 prop 就整行重排、diff 全是噪音。忽略前綴是因為 `:class` 與 `class` 讀起來同一個東西;`v-*` 收尾則讓 `v-if` / `v-for` 這種改變渲染結構的東西固定在同一位置。

## 內建設定的咬人點

- **`.vue` 的 `@stylistic/indent` 關掉**,縮排交給 `vue/html-indent` 與 `vue/script-indent`(4 空格、`baseIndent: 1`,內容相對 `<template>` / `<script>` 再縮一層)。`.js` 才走 `@stylistic/indent`。
- **`vue/essential` 整組展開後併進 `.vue`**,另外手動開 `no-mutating-props`、`no-undef-components`、`no-unused-components`,手動關 `multi-word-component-names`、`no-reserved-component-names`、`valid-template-root`。
- **`vue/valid-template-root` 在 Vue 3 是誤報**:Vue 3 接受空 `<template></template>`(編成 `return null`),規則卻沿用 Vue 2 的單根前提,逼 renderless 元件塞假節點進 DOM。規則無選項,只能整條關,代價是失去 `<template src>` 必須為空的檢查。
- **升 `eslint-plugin-vue` 大版時第一個爆的是 `src/index.js`**:那裡從 `flat/essential` 撈名為 `vue/essential/rules` 的 entry,撈不到直接 throw,不會靜靜少掛一整組規則。
- **`perfectionist/sort-named-exports` 與 `sort-named-imports` 必須成對。** 只開 import 那一條時,`export { … } from "./x.js"` 的清單完全沒人看 —— 消費端曾經出現一份 87 個名字的 re-export barrel,唯一的順序破口(`treeProps` 排在 `tooltipProps` 前)是人工掃出來的,lint 全程沉默。兩條的選項一字不差:自訂 ASCII 字母表、`ignoreCase: false`,所以大寫 `A–Z` 一律排在小寫之前。
- **`perfectionist/sort-objects` 刻意**沒有**開。** 物件字面量的鍵序經常是有意義的:數字色階(`50` / `100` / … / `950`,字串排序會變成 `100, 200, …, 50, 950`)、示範碼物件(鍵序就是頁面上區塊出現的順序)、把引號鍵集中在前的分組。在消費端實測開這條規則會產生 7 個違規,**7 個全部都是不該排的**。要開就得配同樣數量、附理由的 `eslint-disable`,不划算。

## 開發

```
pnpm test     # 自訂規則與整份設定的測試
pnpm lint     # 用自己的設定 lint 自己
```

測試分兩份:

- `test/rules.test.js`:用 `RuleTester` 測 `src/rules/` 那四支。
- `test/config.test.js`:把一小段程式碼丟進真正的 `lint()` 與 stylelint 設定,斷言**剛好**觸發哪些 rule id。全域白名單、工廠參數、規則掛在哪種副檔名、`perfectionist` / `@stylistic` / `vue` / `json` / `stylelint-order` 的設定都在這裡驗。

**「加了規則之後測試還是綠」不算驗證**,綠也可能是規則根本沒掛上。改設定時,在 `config.test.js` 加一筆違規案例,先確認它在改動前紅、改動後綠。斷言是完全比對,所以案例程式碼本身若踩到別條規則也會紅,寫案例時要讓它只違反要測的那一條。
