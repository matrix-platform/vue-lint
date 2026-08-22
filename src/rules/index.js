import sortImportClauses from "./sort-import-clauses.js";
import sortModuleDeclarations from "./sort-module-declarations.js";
import sortTemplateAttributes from "./sort-template-attributes.js";

export default {
    rules: {
        "sort-import-clauses": sortImportClauses,
        "sort-module-declarations": sortModuleDeclarations,
        "sort-template-attributes": sortTemplateAttributes
    }
};
