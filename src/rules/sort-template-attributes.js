const DIRECTIVE = /^v-/;

const PREFIX = /^[@:#]/;

const keyOf = (sourceCode, attribute) => sourceCode.getText(attribute.key).replace(PREFIX, "");

export default {
    create: (context) => {
        const services = context.sourceCode.parserServices;

        if (!services?.defineTemplateBodyVisitor) {
            return {};
        }

        const sourceCode = context.sourceCode;

        return services.defineTemplateBodyVisitor({
            VStartTag: (node) => {
                const keys = node.attributes.map((attribute) => {
                    const name = keyOf(sourceCode, attribute);

                    return {
                        attribute,
                        directive: DIRECTIVE.test(name),
                        name
                    };
                });

                for (let index = 1; index < keys.length; index += 1) {
                    const previous = keys[index - 1];
                    const current = keys[index];

                    if (previous.directive && !current.directive) {
                        context.report({
                            data: { current: current.name },
                            messageId: "directiveLast",
                            node: current.attribute
                        });
                    } else if (!current.directive && !previous.directive && current.name < previous.name) {
                        context.report({
                            data: {
                                current: current.name,
                                previous: previous.name
                            },
                            messageId: "unsorted",
                            node: current.attribute
                        });
                    }
                }
            }
        });
    },
    meta: {
        docs: {
            description: "Sort tag attributes in ASCII order, ignoring a leading @ / : / # prefix; v-* attributes always come last, in any order among themselves"
        },
        messages: {
            directiveLast: "Attribute \"{{current}}\" should come before every v-* attribute",
            unsorted: "Attribute \"{{current}}\" should come before \"{{previous}}\""
        },
        schema: [],
        type: "layout"
    }
};
