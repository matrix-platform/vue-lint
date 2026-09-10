const identifierOf = (node) => {
    const target = node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration" ? node.declaration : node;

    if (!target) {
        return node.specifiers?.[0]?.exported?.name || null;
    }

    if (target.type === "VariableDeclaration") {
        return target.declarations[0]?.id?.name || null;
    }

    if (target.type === "FunctionDeclaration" || target.type === "ClassDeclaration") {
        return target.id?.name || null;
    }

    return null;
};

const isDeclaration = (node) => node.type === "VariableDeclaration"
    || node.type === "FunctionDeclaration"
    || node.type === "ClassDeclaration"
    || node.type === "ExportDefaultDeclaration"
    || node.type === "ExportNamedDeclaration";

const isFunction = (node) => {
    const target = node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration" ? node.declaration : node;

    if (target?.type === "FunctionDeclaration") {
        return true;
    }

    if (target?.type !== "VariableDeclaration") {
        return false;
    }

    const initializer = target.declarations[0]?.init;

    return initializer?.type === "ArrowFunctionExpression" || initializer?.type === "FunctionExpression";
};

const isMutable = (node) => {
    const target = node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration" ? node.declaration : node;

    return target?.type === "VariableDeclaration" && target.kind !== "const";
};

export default {
    create: (context) => ({
        Program: (program) => {
            const entries = program.body
                .filter(isDeclaration)
                .map((node) => ({
                    exported: node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration",
                    function: isFunction(node),
                    mutable: isMutable(node),
                    name: identifierOf(node),
                    node
                }))
                .filter((entry) => entry.name !== null);

            let seenExported = false;

            entries.forEach((entry, index) => {
                if (entry.exported) {
                    seenExported = true;
                } else if (seenExported) {
                    context.report({
                        data: { name: entry.name },
                        messageId: "exportedLast",
                        node: entry.node
                    });

                    return;
                }

                const previous = entries[index - 1];

                if (!previous || previous.exported !== entry.exported || previous.mutable !== entry.mutable) {
                    return;
                }

                if (previous.function && !entry.function) {
                    context.report({
                        data: { name: entry.name },
                        messageId: "valueBeforeFunction",
                        node: entry.node
                    });

                    return;
                }

                if (previous.function === entry.function && entry.name < previous.name) {
                    context.report({
                        data: {
                            current: entry.name,
                            previous: previous.name
                        },
                        messageId: "unsorted",
                        node: entry.node
                    });
                }
            });
        }
    }),
    meta: {
        docs: {
            description: "Group module level declarations as non-exported before exported, then non-function before function, sorting each group by identifier in ASCII order. let and var are ordered among themselves and never against const"
        },
        messages: {
            exportedLast: "Non-exported \"{{name}}\" should come before every exported declaration",
            unsorted: "\"{{current}}\" should come before \"{{previous}}\"",
            valueBeforeFunction: "Non-function \"{{name}}\" should come before function declarations"
        },
        schema: [],
        type: "layout"
    }
};
