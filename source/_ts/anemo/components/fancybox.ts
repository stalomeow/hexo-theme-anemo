import $ from '../$';
import { IComponent } from '../component';
import componentManager from '../managers/componentManager';
import configManager from '../managers/configManager';

function getImageUrl(image: HTMLImageElement, rep?: [search: string, replace: string]): string {
  let url = image.attr('src') || '';

  if (rep && rep[0]) {
    if (/^re:/.test(rep[0])) {
      const reg = new RegExp(rep[0].replace(/^re:/, ''), 'gi');
      url = url.replace(reg, rep[1]);
    } else {
      url = url.replace(rep[0], rep[1]);
    }
  }

  return url;
}

function registerImages(images: ArrayLike<HTMLImageElement>) {
  const { fancybox } = configManager.siteConfig;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const url = getImageUrl(image, fancybox.img_url_replace);
    const title = image.attr('title') || image.attr('alt') || 'unknown image';

    // fancybox 容器
    const a = $.create('a', {
      'href': url,
      'title': title,
      'data-fancybox': 'gallery',
      'data-caption': title
    });

    image.wrap(a); // 用 a 包裹 image

    // 创建一个 caption，放在 image 下面
    const p = $.create('p', { 'class': 'image-caption' });
    p.textContent = title;
    a.appendChild(p);
  }
}

const component_fancybox: IComponent = {
  name: 'fancybox',

  initialize: function (): boolean {
    const { fancybox } = configManager.siteConfig;

    if (!fancybox.enable) {
      return false;
    }

    componentManager.registerAPI(this, 'imageViewer', images => {
      // 直接注册，不需要再调用 window.Fancybox.bind
      // 原因写在了 refresh 方法中
      registerImages(images);
    });

    return true;
  },

  refresh(): void {
    if (!window.Fancybox) {
      return;
    }

    // Immediately destroy all instances (without closing animation) and clean up all bindings.
    window.Fancybox.destroy();

    // Attach a click handler function that starts Fancybox to the selected items,
    // as well as to all **future** matching elements.
    window.Fancybox.bind('[data-fancybox]', configManager.siteConfig.fancybox.options || {});

    const images = $.all<HTMLImageElement>('.markdown-body img:not([nofancybox])');
    registerImages(images);
  }
};

export default component_fancybox;