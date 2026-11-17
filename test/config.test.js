import lint from "../src/index.js";
import stylelint from "stylelint";
import stylelintConfig from "../src/stylelint.js";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const cwd = new URL("..", import.meta.url).pathname;

const ruleIdsOf = async (code, filePath, options) => {
    const eslint = new ESLint({
        cwd,
        overrideConfig: lint(options),
        overrideConfigFile: true
    });
    const [result] = await eslint.lintText(code, { filePath });

    return [...new Set(result.messages.map((message) => message.ruleId))].sort();
};

const styleRulesOf = async (code, filePath) => {
    const { results } = await stylelint.lint({
        code,
        codeFilename: `${cwd}${filePath}`,
        config: stylelintConfig
    });

    return [...new Set(results[0].warnings.map((warning) => warning.rule))].sort();
};

const vue = ({ script = "", style = "", template = "    <div></div>" }) => [
    `<template>\n${template}\n</template>\n`,
    style && `<style lang="scss">\n${style}\n</style>\n`,
    script && `<script setup>\n${script}\n</script>\n`
].filter(Boolean).join("\n");

describe("eslint config", () => {
    it.each([
        ["clean module", "probe/clean.js", "import { tmpdir } from \"node:os\";\n\nconst Alpha = 1;\n\nexport const dir = () => tmpdir() + Alpha;\n"],
        ["sort-objects stays off", "probe/objects.js", "export const scale = {\n    100: \"a\",\n    50: \"b\",\n    zebra: 1,\n    alpha: 2\n};\n"],
        ["standard globals", "probe/standard.js", "console.log(new URL(\"x\"), new AbortController(), File);\n"],
        ["clean json", "probe/clean.json", "{\"a\": 1}\n"],
        ["clean vue", "probe/clean.vue", vue({
            script: "    const label = \"sample\";\n    const visible = true;",
            template: "    <div class=\"sample\" id=\"sample\">\n        <span :title=\"label\" v-if=\"visible\">\n            {{ label }}\n        </span>\n    </div>"
        })],
        ["empty renderless template", "probe/renderless.vue", "<template></template>\n\n<script setup>\n    document.title = \"renderless\";\n</script>\n"]
    ])("passes %s", async (_, filePath, code) => {
        expect(await ruleIdsOf(code, filePath)).toEqual([]);
    });

    it.each([
        ["no-undef", "fetch outside the allowlist", "probe/fetch.js", "fetch(\"x\");\n"],
        ["no-undef", "browser global in a node file", "probe/node.js", "document.title = \"x\";\n"],
        ["no-restricted-syntax", "function declaration", "probe/function.js", "export function run() {}\n"],
        ["no-restricted-syntax", "nullish coalescing", "probe/nullish.js", "export const pick = (value) => value ?? 1;\n"],
        ["no-restricted-syntax", "method shorthand", "probe/method.js", "export const api = { run() {} };\n"],
        ["@stylistic/quotes", "single quotes", "probe/quotes.js", "export const name = 'x';\n"],
        ["@stylistic/semi", "missing semicolon", "probe/semi.js", "export const name = \"x\"\n"],
        ["@stylistic/indent", "two space indent", "probe/indent.js", "export const run = () => {\n  return 1;\n};\n"],
        ["house/sort-import-clauses", "unsorted imports", "probe/imports.js", "import \"b\";\nimport \"a\";\n"],
        ["house/sort-module-declarations", "unsorted declarations", "probe/declarations.js", "const b = 1;\nconst a = 2;\n\nexport { a, b };\n"],
        ["perfectionist/sort-named-exports", "lowercase before uppercase export", "probe/exports.js", "export { delta, Delta } from \"./x.js\";\n"],
        ["perfectionist/sort-named-imports", "lowercase before uppercase import", "probe/named.js", "import { delta, Delta } from \"./x.js\";\n\nexport const all = [delta, Delta];\n"],
        ["json/no-duplicate-keys", "duplicate json key", "probe/duplicate.json", "{\"a\": 1, \"a\": 2}\n"],
        ["house/require-v-for-parentheses", "bare v-for alias", "probe/vfor.vue", vue({ template: "    <div :key=\"item\" v-for=\"item in 3\">\n        {{ item }}\n    </div>" })],
        ["house/sort-template-attributes", "unsorted attributes", "probe/attributes.vue", vue({ template: "    <div id=\"a\" class=\"b\"></div>" })],
        ["house/sort-import-clauses", "unsorted imports in vue", "probe/imports.vue", vue({ script: "    import \"b\";\n    import \"a\";" })],
        ["vue/block-order", "script before template", "probe/order.vue", "<script setup>\n    const a = 1;\n</script>\n\n<template>\n    <div>\n        {{ a }}\n    </div>\n</template>\n"],
        ["vue/html-self-closing", "self-closing element", "probe/closing.vue", vue({ template: "    <div />" })],
        ["vue/script-indent", "script without base indent", "probe/indent.vue", vue({ script: "const a = 1;\nconsole.log(a);" })],
        ["vue/no-undef-components", "unknown component", "probe/component.vue", vue({ template: "    <Missing></Missing>" })]
    ])("reports %s for %s", async (ruleId, _, filePath, code) => {
        expect(await ruleIdsOf(code, filePath)).toEqual([ruleId]);
    });

    it("leaves module declaration order unchecked in vue", async () => {
        const code = vue({
            script: "    const b = 1;\n    const a = 2;",
            template: "    <div>\n        {{ a + b }}\n    </div>"
        });

        expect(await ruleIdsOf(code, "probe/declarations.vue")).toEqual([]);
    });

    it("gives browser globals to browserFiles on top of node globals", async () => {
        const code = "document.title = process.title;\n";
        const options = {
            browserFiles: ["probe/browser/**/*.js"],
            nodeGlobals: { process: "readonly" }
        };

        expect(await ruleIdsOf(code, "probe/browser/page.js", options)).toEqual([]);
        expect(await ruleIdsOf(code, "probe/node/task.js", options)).toEqual(["no-undef"]);
    });

    it("adds browserGlobals to vue files", async () => {
        const code = vue({ script: "    fetch(\"x\");" });

        expect(await ruleIdsOf(code, "probe/fetch.vue")).toEqual(["no-undef"]);
        expect(await ruleIdsOf(code, "probe/fetch.vue", { browserGlobals: { fetch: "readonly" } })).toEqual([]);
    });

    it("ignores node_modules, dist and caller ignores", async () => {
        const eslint = new ESLint({
            cwd,
            overrideConfig: lint({ ignores: ["**/__screenshots__/**"] }),
            overrideConfigFile: true
        });

        expect(await eslint.isPathIgnored("node_modules/x/index.js")).toBe(true);
        expect(await eslint.isPathIgnored("dist/index.js")).toBe(true);
        expect(await eslint.isPathIgnored("probe/__screenshots__/a.js")).toBe(true);
        expect(await eslint.isPathIgnored("probe/a.js")).toBe(false);
    });
});

describe("stylelint config", () => {
    const sorted = ".x {\n    --gap: 1px;\n\n    color: red;\n    gap: var(--gap);\n\n    &:hover {\n        color: blue;\n    }\n\n    @media (min-width: 1px) {\n        color: green;\n    }\n}\n";
    const unsortedProperties = ".x {\n    z-index: 1;\n    color: red;\n}\n";
    const ruleBeforeDeclaration = ".x {\n    &:hover {\n        color: blue;\n    }\n\n    color: red;\n}\n";

    it.each([
        ["css", "probe/a.css", sorted.replace("&:hover", ".x:hover")],
        ["scss", "probe/a.scss", sorted],
        ["vue style block", "probe/a.vue", vue({ style: sorted })]
    ])("passes sorted %s", async (_, filePath, code) => {
        expect(await styleRulesOf(code, filePath)).toEqual([]);
    });

    it.each([
        ["order/properties-alphabetical-order", "css", "probe/a.css", unsortedProperties],
        ["order/properties-alphabetical-order", "scss", "probe/a.scss", unsortedProperties],
        ["order/properties-alphabetical-order", "vue style block", "probe/a.vue", vue({ style: unsortedProperties })],
        ["order/order", "scss", "probe/a.scss", ruleBeforeDeclaration],
        ["order/order", "vue style block", "probe/a.vue", vue({ style: ruleBeforeDeclaration })]
    ])("reports %s in %s", async (rule, _, filePath, code) => {
        expect(await styleRulesOf(code, filePath)).toEqual([rule]);
    });
});
