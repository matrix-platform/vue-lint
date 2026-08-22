const clauseOf = (sourceCode, node) => {
    const importToken = sourceCode.getFirstToken(node);
    const fromToken = sourceCode.getTokenBefore(node.source, (token) => token.type === "Identifier" && token.value === "from");

    if (!fromToken) {
        return sourceCode.getText(node.source);
    }

    return sourceCode.getText().slice(importToken.range[1], fromToken.range[0]).trim();
};

const swap = (fixer, sourceCode, previous, current) => {
    if (sourceCode.getCommentsBefore(current).length > 0) {
        return null;
    }

    return [
        fixer.replaceText(previous, sourceCode.getText(current)),
        fixer.replaceText(current, sourceCode.getText(previous))
    ];
};

export default {
    create: (context) => {
        const sourceCode = context.sourceCode;

        return {
            Program: (program) => {
                const imports = program.body.filter((node) => node.type === "ImportDeclaration");

                for (let index = 1; index < imports.length; index += 1) {
                    const previous = clauseOf(sourceCode, imports[index - 1]);
                    const current = clauseOf(sourceCode, imports[index]);

                    if (current < previous) {
                        context.report({
                            data: {
                                current,
                                previous
                            },
                            fix: (fixer) => swap(fixer, sourceCode, imports[index - 1], imports[index]),
                            messageId: "unsorted",
                            node: imports[index]
                        });
                    }
                }
            }
        };
    },
    meta: {
        docs: {
            description: "Sort imports by the raw text after the import keyword in ASCII order, so \" and * come before letters and { comes after"
        },
        fixable: "code",
        messages: {
            unsorted: "\"{{current}}\" should come before \"{{previous}}\""
        },
        schema: [],
        type: "layout"
    }
};
