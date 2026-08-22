# @matrix-platform/vue-lint

Vue 3 + 純 JavaScript(ESM)+ Sass 專案的共用 lint 設定:一份 ESLint 工廠、一份 stylelint 設定、三支自訂排序規則(`house/sort-import-clauses`、`house/sort-module-declarations`、`house/sort-template-attributes`)。

只有整套,不可拆;不分層、不匯出規則分組。適用 `.css`、`.html`、`.js`、`.json`、`.scss`、`.vue`。

## 安裝

`eslint` 與 `stylelint` 是 peerDependency,由你的專案提供;其餘 plugin 由本套件自己帶。

沒有發佈到 npm registry,走 git 依賴、跟著 `main` 分支:

```json
"devDependencies": {
    "@matrix-platform/vue-lint": "github:matrix-platform/vue-lint#main",
    "eslint": "^10.8.0",
    "stylelint": "^17.14.1"
}
```

## 用法

`eslint.config.js`:

```js
import lint from "@matrix-platform/vue-lint";

export default lint({
    browserFiles: ["src/**/*.js"],
    ignores: ["**/__screenshots__/**"]
});
```

`stylelint.config.js`:

```js
export { default } from "@matrix-platform/vue-lint/stylelint";
```

### 工廠參數

四個都可省略。

| 參數 | 型別 | 作用 |
| --- | --- | --- |
| `browserFiles` | `string[]` | 哪些 `.js` 吃 browser 全域。空值時該段 config 不輸出 |
| `browserGlobals` | `object` | browser 全域的增補 |
| `ignores` | `string[]` | 附加的 ignore(`**/node_modules/**`、`**/dist/**` 已內建) |
| `nodeGlobals` | `object` | node 全域的增補 |

`.vue` 一律吃 browser 全域,不受 `browserFiles` 影響。

## 開發

```
pnpm test     # 三支自訂規則的 RuleTester 案例
pnpm lint     # 用自己的設定 lint 自己(含 fixtures/)
```
