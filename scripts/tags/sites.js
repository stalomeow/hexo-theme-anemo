/* global hexo */

'use strict';

/*
 * {% mermaid %}
 * text
 * {% endmermaid %}
 */
hexo.extend.tag.register('sites', (args, content) => {
  return `<div>${content}</div>`;
}, { ends: true });