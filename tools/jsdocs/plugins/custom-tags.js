const tableBuilder = require('../helpers/table-builder');

exports.defineTags = function(dictionary) {
  dictionary.defineTag('decorator', {
    mustHaveValue: false,
    mustNotHaveDescription: false,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      if (!doclet.decorators) {
        doclet.decorators = [];
      }

      doclet.decorators.push({
        'name': tag.value.name,
        'type': tag.value.type ? (tag.value.type.names.length === 1 ? tag.value.type.names[0] : tag.value.type.names) : '',
        'description': tag.value.description || '',
      });
    }
  });
};

exports.handlers = {
  newDoclet: function(e) {
    const parameters = e.doclet.decorators;
    if (parameters) {
      const table = tableBuilder.build('Decorator', parameters);

      e.doclet.description = `${e.doclet.description}
                              ${table}`;
    }
  }
};
