const hasParentheses = (sourceCode, alias) => {
    const text = sourceCode.text;

    let index = alias.range[0] - 1;

    while (index >= 0 && /\s/.test(text[index])) {
        index -= 1;
    }

    return text[index] === "(";
};

export default {
    create: (context) => {
        const services = context.sourceCode.parserServices;

        if (!services?.defineTemplateBodyVisitor) {
            return {};
        }

        const sourceCode = context.sourceCode;

        return services.defineTemplateBodyVisitor({
            VForExpression: (node) => {
                const first = node.left[0];

                if (!first || hasParentheses(sourceCode, first)) {
                    return;
                }

                const last = node.left[node.left.length - 1];

                context.report({
                    fix: (fixer) => [
                        fixer.insertTextBeforeRange(first.range, "("),
                        fixer.insertTextAfterRange(last.range, ")")
                    ],
                    messageId: "missingParentheses",
                    node
                });
            }
        });
    },
    meta: {
        docs: {
            description: "Require parentheses around the v-for alias, as in (item) in items"
        },
        fixable: "code",
        messages: {
            missingParentheses: "The v-for alias must be wrapped in parentheses, as in (item) in items"
        },
        schema: [],
        type: "layout"
    }
};
