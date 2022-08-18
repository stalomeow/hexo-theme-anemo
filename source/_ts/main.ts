import './extensions'; // 拓展模块
import assetManager from './anemo/managers/assetManager';
import colorSchemeManager from './anemo/managers/colorSchemeManager';
import componentManager from './anemo/managers/componentManager';
import configManager from './anemo/managers/configManager';
import loadingBox from './anemo/miscellaneous/loadingBox';
import pjaxManager from './anemo/managers/pjaxManager';
import requiredComponents from './anemo/requiredComponents';


async function refreshPageAsync(): Promise<void> {
  loadingBox.display(0.7, 'loading assets...');
  await assetManager.loadPageAssetsAsync();

  loadingBox.display(0.94, 'refreshing...'); // 卡半岩
  await componentManager.refreshAllComponentsAsync();

  loadingBox.display(1, 'success');
}


// 进入站点后立刻初始化配色方案
colorSchemeManager.initialize();

// 等网页加载完后初始化其他
document.addEventListener('DOMContentLoaded', async () => {
  await configManager.initializeAsync();

  const loadingConfig = configManager.siteConfig.loading_box;
  loadingBox.initialize(loadingConfig.enable, loadingConfig.image_src);

  loadingBox.display(0.45, 'initializing site...');
  await componentManager.registerComponentsAsync(...requiredComponents);

  pjaxManager.initialize(
    configManager.siteConfig.pjax.enable,
    configManager.siteConfig.pjax.options,
    /* pjaxSendCallback */ () => {
      loadingBox.display(0.45, 'changing page...');
      componentManager.cleanupAllComponents();
    },
    /* pjaxSuccessCallback */ () => {
      refreshPageAsync();
    }
  );
});