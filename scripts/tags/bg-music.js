/* global hexo */

'use strict';

const yaml = require('js-yaml');

/*
  {% bgmusic [autoplay] %}
  yaml data
  {% endbgmusic %}
 */
hexo.extend.tag.register('bgmusic', (args, content) => {
  const list = yaml.load(content);
  const autoplay = (args[0] === 'autoplay') ? args[0] : '';
  const notice = hexo.theme.config.bgMusic.notice[autoplay ? 'autoplay' : 'normal'];
  return `<div class="bg-music-override note-info" playlist='${JSON.stringify(list)}' ${autoplay}>` +
    notice + '</div>';
}, { ends: true });
