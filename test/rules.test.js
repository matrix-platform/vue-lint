import requireVForParentheses from "../src/rules/require-v-for-parentheses.js";
import sortImportClauses from "../src/rules/sort-import-clauses.js";
import sortModuleDeclarations from "../src/rules/sort-module-declarations.js";
import sortTemplateAttributes from "../src/rules/sort-template-attributes.js";
import vue from "eslint-plugin-vue";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

const jsRuleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    }
});

const vueParser = vue.configs["flat/base"].find((entry) => entry.languageOptions?.parser)?.languageOptions.parser;

const vueRuleTester = new RuleTester({
    languageOptions: {
        parser: vueParser,
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module"
        }
    }
});

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

jsRuleTester.run("sort-import-clauses", sortImportClauses, {
    invalid: [{
        code: "import { zebra } from \"zebra\";\nimport Alpha from \"alpha\";\n",
        errors: [{ messageId: "unsorted" }],
        output: "import Alpha from \"alpha\";\nimport { zebra } from \"zebra\";\n"
    }, {
        code: "import Charlie from \"c\";\nimport Bravo from \"b\";\nimport Alpha from \"a\";\n",
        errors: [{ messageId: "unsorted" }, { messageId: "unsorted" }],
        output: "import Bravo from \"b\";\nimport Charlie from \"c\";\nimport Alpha from \"a\";\n"
    }, {
        code: "import { zebra } from \"zebra\";\n// note\nimport Alpha from \"alpha\";\n",
        errors: [{ messageId: "unsorted" }],
        output: null
    }],
    valid: [
        "import \"side-effect\";\nimport * as namespace from \"namespace\";\nimport Alpha from \"alpha\";\nimport { zebra } from \"zebra\";\n",
        "import Alpha, { beta } from \"alpha\";\nimport { gamma as delta } from \"gamma\";\n"
    ]
});

jsRuleTester.run("sort-module-declarations", sortModuleDeclarations, {
    invalid: [{
        code: "export const Zebra = 1;\nconst Alpha = 2;\n",
        errors: [{ messageId: "exportedLast" }]
    }, {
        code: "const Zebra = 1;\nconst Alpha = 2;\n",
        errors: [{ messageId: "unsorted" }]
    }, {
        code: "const Local = 1;\nexport default function Zebra() {}\nexport const Alpha = 2;\n",
        errors: [{ messageId: "valueBeforeFunction" }]
    }, {
        code: "const captureClass = () => {};\nconst roots = new WeakMap();\n",
        errors: [{ messageId: "valueBeforeFunction" }]
    }, {
        code: "const zebra = () => {};\nconst alpha = function () {};\n",
        errors: [{ messageId: "unsorted" }]
    }],
    valid: [
        "const Alpha = 1;\nconst Zebra = 2;\nexport const Beta = 3;\nexport const Omega = 4;\n",
        "const roots = new WeakMap();\nconst captureClass = () => {};\nexport const policy = {};\nexport const useRootTheme = () => {};\n",
        "const { alpha } = source;\nexport { alpha };\n",
        "const Alpha = 1, Beta = 2;\nexport default { Alpha, Beta };\n"
    ]
});

vueRuleTester.run("require-v-for-parentheses", requireVForParentheses, {
    invalid: [{
        code: "<template><div v-for=\"item in items\"></div></template>",
        errors: [{ messageId: "missingParentheses" }],
        filename: "Probe.vue",
        output: "<template><div v-for=\"(item) in items\"></div></template>"
    }, {
        code: "<template><div v-for=\"item, index in items\"></div></template>",
        errors: [{ messageId: "missingParentheses" }],
        filename: "Probe.vue",
        output: "<template><div v-for=\"(item, index) in items\"></div></template>"
    }, {
        code: "<template><div v-for=\"n in 8\"></div></template>",
        errors: [{ messageId: "missingParentheses" }],
        filename: "Probe.vue",
        output: "<template><div v-for=\"(n) in 8\"></div></template>"
    }, {
        code: "<template><div v-for=\"{ id } in items\"></div></template>",
        errors: [{ messageId: "missingParentheses" }],
        filename: "Probe.vue",
        output: "<template><div v-for=\"({ id }) in items\"></div></template>"
    }],
    valid: [{
        code: "<template><div v-for=\"(item) in items\"></div></template>",
        filename: "Probe.vue"
    }, {
        code: "<template><div v-for=\"(item, index) in items\"></div></template>",
        filename: "Probe.vue"
    }, {
        code: "<template><div v-for=\"(value, key, index) in object\"></div></template>",
        filename: "Probe.vue"
    }, {
        code: "<template><div v-for=\"(item) of items\"></div></template>",
        filename: "Probe.vue"
    }]
});

vueRuleTester.run("sort-template-attributes", sortTemplateAttributes, {
    invalid: [{
        code: "<template><div id=\"probe\" class=\"subject\"></div></template>",
        errors: [{ messageId: "unsorted" }],
        filename: "Probe.vue"
    }, {
        code: "<template><div v-if=\"shown\" :class=\"classes\"></div></template>",
        errors: [{ messageId: "directiveLast" }],
        filename: "Probe.vue"
    }],
    valid: [{
        code: "<template><div :class=\"classes\" @click=\"click\" #default id=\"probe\" v-if=\"shown\"></div></template>",
        filename: "Probe.vue"
    }, {
        code: "<template><div :[name]=\"value\" v-for=\"(item) in items\" v-if=\"item\"></div></template>",
        filename: "Probe.vue"
    }]
});
