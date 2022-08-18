import $ from '../$';
import { IComponent } from '../component';
import configManager from '../managers/configManager';
import debugUtils from '../utils/debugUtils';

const component_mermaid: IComponent = {
  name: 'mermaid',

  initialize(): boolean {
    // TODO: temp, 需要导出综合了 specific 的 enable
    //return configManager.siteConfig.mermaid.enable;
    return false;
  },

  refresh(): void {
    if (!window.mermaid || !$('.mermaid')) {
      debugUtils.warning('no mermaid.');
      return;
    }

    window.mermaid.initialize(configManager.siteConfig.mermaid.options);
  }
};

export default component_mermaid;