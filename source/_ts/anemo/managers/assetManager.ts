import $ from '../$';
import debugUtils from '../utils/debugUtils';

const loadedAssets = new Set<string>();


function loadJS(url: string): Promise<void> {
  const script = $.create('script', {
    'src': url,
    'type': 'text/javascript',
    'charset': 'UTF-8'
  });
  script.async = false;

  // 这里和 css 的统一一下。
  document.body.insertAdjacentElement('beforeend', script);

  return new Promise(resolve => {
    script.addEventListener('load', () => resolve());
  });
}

function loadCSS(url: string): Promise<void> {
  const link = $.create('link', {
    'rel': 'stylesheet',
    'type': 'text/css',
    'href': url
  });

  // 直接插在最后面，覆盖掉以前加载的 css 里的样式。
  // 至少要放在 main.css 后面。
  // 之前不小心把这些 css 放 main.css 前面，
  // 导致代码块颜色被 main.css 里的样式给覆盖了。
  document.body.insertAdjacentElement('beforeend', link);

  return new Promise(resolve => {
    link.addEventListener('load', () => resolve());
  });
}

function loadAny(url: string): Promise<void> {
  const i = url.lastIndexOf('.');
  const ext = url.substring(i + 1);

  switch (ext) {
    case 'js': return loadJS(url);
    case 'css': return loadCSS(url);
    default: return Promise.reject('unknown asset');
  }
}


export default {
  async loadAssetAsync(url: string): Promise<void> {
    if (loadedAssets.has(url)) {
      return;
    }

    await loadAny(url);
    debugUtils.info('load asset: ' + url);
    loadedAssets.add(url);
  },

  loadAssetsAsync(assets: string[]): Promise<unknown> {
    const promises: Promise<void>[] = [];

    for (const url of assets) {
      if (loadedAssets.has(url)) {
        continue;
      }

      const promise = loadAny(url).then(() => {
        debugUtils.info('load asset: ' + url);
        loadedAssets.add(url);
      });
      promises.push(promise);
    }

    return Promise.allSettled(promises);
  }
};