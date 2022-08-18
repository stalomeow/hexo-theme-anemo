/* global hexo */

'use strict';

const url = require('url');

hexo.extend.generator.register("_anemo_config", () => {
  const theme = hexo.theme.config;
  const ts_exports = hexo.theme.config.export_config; // an array

  const exportConfig = {
    hostname: url.parse(hexo.config.url).hostname || hexo.config.url,
    root: hexo.config.root,
  };

  function setConfig(keys, configs, obj) {
    for (let key of keys) {
      if (typeof key === 'string') {
        if (key in obj) {
          hexo.log.warn(`Key '${key}' has already existed in exported configs.`);
        }
        obj[key] = configs[key];
      } else {
        let k = Object.keys(key)[0];
        let o = {};
        obj[k] = o;
        setConfig(key[k], configs[k], o);
      }
    }
  }

  setConfig(ts_exports, theme, exportConfig);

  return {
    path: 'site-config.json',
    data: JSON.stringify(exportConfig)
  };
});
