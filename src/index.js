import house from "./rules/index.js";
import json from "@eslint/json";
import perfectionist from "eslint-plugin-perfectionist";
import stylistic from "@stylistic/eslint-plugin";
import vue from "eslint-plugin-vue";

const ASCII_ALPHABET = Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index)).join("");

const BROWSER_GLOBALS = {
    CustomEvent: "readonly",
    DataTransfer: "readonly",
    DragEvent: "readonly",
    Event: "readonly",
    FocusEvent: "readonly",
    InputEvent: "readonly",
    KeyboardEvent: "readonly",
    MouseEvent: "readonly",
    Node: "readonly",
    NodeFilter: "readonly",
    PointerEvent: "readonly",
    ResizeObserver: "readonly",
    document: "readonly",
    getComputedStyle: "readonly",
    performance: "readonly",
    requestAnimationFrame: "readonly",
    window: "readonly"
};

const STANDARD_GLOBALS = {
    AbortController: "readonly",
    File: "readonly",
    URL: "readonly",
    console: "readonly"
};

const correctnessRules = {
    "no-dupe-keys": "error",
    "no-undef": "error",
    "no-unreachable": "error",
    "no-unused-vars": "error"
};

const layoutRules = {
    "@stylistic/comma-dangle": ["error", "never"],
    "@stylistic/indent": ["error", 4],
    "@stylistic/max-len": ["error", {
        code: 180,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true
    }],
    "@stylistic/object-curly-newline": ["error", {
        ObjectExpression: {
            consistent: true,
            minProperties: 3,
            multiline: true
        },
        ObjectPattern: "never"
    }],
    "@stylistic/object-property-newline": ["error", {
        allowAllPropertiesOnSameLine: true
    }],
    "@stylistic/quotes": ["error", "double"],
    "@stylistic/semi": ["error", "always"]
};

const syntaxRules = {
    "@stylistic/brace-style": ["error", "1tbs"],
    "@stylistic/nonblock-statement-body-position": ["error", "below"],
    curly: ["error", "all"],
    "house/sort-import-clauses": "error",
    "no-restricted-syntax": ["error", {
        message: "Prefer arrow functions: const foo = () => {}. When there is a valid reason such as hoisting, add eslint-disable-next-line with the reason",
        selector: "FunctionDeclaration"
    }, {
        message: "Use || for nullish fallback. When 0 / \"\" / false must pass through, add eslint-disable-next-line with the reason",
        selector: "LogicalExpression[operator='??']"
    }, {
        message: "Write object methods as key: () => {}, except getters and setters",
        selector: "Property[method=true][kind='init']"
    }],
    "perfectionist/sort-named-imports": ["error", {
        alphabet: ASCII_ALPHABET,
        ignoreCase: false,
        order: "asc",
        type: "custom"
    }]
};

const vueEssentialEntry = vue.configs["flat/essential"].find((entry) => entry.name === "vue/essential/rules");

if (!vueEssentialEntry) {
    throw new Error("vue essential config structure changed: no entry named \"vue/essential/rules\", update src/index.js.");
}

const vueEssentialRules = vueEssentialEntry.rules;

export default ({ browserFiles = [], browserGlobals = {}, ignores = [], nodeGlobals = {} } = {}) => [
    {
        ignores: ["**/node_modules/**", "**/dist/**", ...ignores]
    },
    ...vue.configs["flat/base"],
    {
        files: ["**/*.json"],
        language: "json/json",
        plugins: {
            json
        },
        rules: {
            "json/no-duplicate-keys": "error",
            "json/no-empty-keys": "error",
            "json/no-unsafe-values": "error"
        }
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...STANDARD_GLOBALS,
                ...nodeGlobals
            },
            sourceType: "module"
        },
        plugins: {
            "@stylistic": stylistic,
            house,
            perfectionist
        },
        rules: {
            ...correctnessRules,
            ...layoutRules,
            ...syntaxRules,
            "house/sort-module-declarations": "error"
        }
    },
    ...(browserFiles.length > 0 ? [{
        files: browserFiles,
        languageOptions: {
            globals: {
                ...BROWSER_GLOBALS,
                ...browserGlobals,
                ...STANDARD_GLOBALS,
                ...nodeGlobals
            }
        }
    }] : []),
    {
        files: ["**/*.vue"],
        plugins: {
            "@stylistic": stylistic,
            house,
            perfectionist,
            vue
        },
        languageOptions: {
            globals: {
                ...BROWSER_GLOBALS,
                ...browserGlobals,
                ...STANDARD_GLOBALS,
                ...nodeGlobals
            }
        },
        rules: {
            ...correctnessRules,
            ...layoutRules,
            ...syntaxRules,
            ...vueEssentialRules,
            "@stylistic/indent": "off",
            "house/require-v-for-parentheses": "error",
            "house/sort-template-attributes": "error",
            "vue/no-mutating-props": "error",
            "vue/multi-word-component-names": "off",
            "vue/no-reserved-component-names": "off",
            "vue/no-undef-components": "error",
            "vue/no-unused-components": "error",
            "vue/block-order": ["error", {
                order: ["template", "style", "script"]
            }],
            "vue/html-indent": ["error", 4, {
                baseIndent: 1
            }],
            "vue/html-self-closing": ["error", {
                html: {
                    component: "never",
                    normal: "never",
                    void: "never"
                },
                svg: "never"
            }],
            "vue/max-attributes-per-line": ["error", {
                multiline: {
                    max: 1
                },
                singleline: {
                    max: 5
                }
            }],
            "vue/script-indent": ["error", 4, {
                baseIndent: 1
            }],
            "vue/singleline-html-element-content-newline": ["error", {
                ignoreWhenNoAttributes: false
            }]
        }
    }
];
