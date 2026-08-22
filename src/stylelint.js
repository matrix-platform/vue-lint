import order from "stylelint-order";
import postcssHtml from "postcss-html";
import postcssScss from "postcss-scss";

const orderRules = {
    "order/order": [
        "custom-properties",
        "declarations",
        "rules",
        "at-rules"
    ],
    "order/properties-alphabetical-order": true
};

export default {
    overrides: [
        {
            customSyntax: postcssScss,
            files: ["**/*.scss"]
        },
        {
            customSyntax: postcssHtml,
            files: ["**/*.vue"]
        }
    ],
    plugins: [order],
    rules: orderRules
};
