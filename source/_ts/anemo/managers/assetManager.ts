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

  const e = $('script') || document.head;
  e.parentElement!.insertBefore(script, e);

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

  const e = $('link') || document.head;
  e.parentElement!.insertBefore(link, e);

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

  loadPageAssetsAsync(): Promise<unknown> {
    const assets = Object.values(window.PAGE_ASSETS).flat();
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