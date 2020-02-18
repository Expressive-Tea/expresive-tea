var replacementToken = '{REPLACE-AT}',
  tokenRegex       = new RegExp(replacementToken, 'g');

function restoreAt( str ) { return str.replace(tokenRegex, '@'); }

exports.handlers = {
  jsdocCommentFound: event => {
    event.comment = event.comment.replace(/\\@/g, replacementToken);
  },

  newDoclet: event => {
    if ( event.doclet.examples ) {
      event.doclet.examples = event.doclet.examples.map(restoreAt);
    }

    if ( event.doclet.classdesc ) {
      event.doclet.classdesc = restoreAt(event.doclet.classdesc);
    }

    if ( event.doclet.description ) {
      event.doclet.description = restoreAt(event.doclet.description);
    }
  }
};
