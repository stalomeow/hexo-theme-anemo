import $ from '../../$';
import { IComponent } from '../../component';
import componentManager from '../../managers/componentManager';
import configManager from '../../managers/configManager';

const commentImageSelector = '#twikoo .tk-content img:not(.tk-owo-emotion)';

const component_comment_twikoo: IComponent = {
  name: 'twikoo',

  initialize(): boolean {
    // return false;

    const {
      comments,
      twikoo
    } = configManager.siteConfig;

    // 判断是否启用该组件
    if (!comments.enable || comments.type !== 'twikoo') {
      return false;
    }

    // 注册获取最新评论的 API
    componentManager.registerAPI(this, 'latestComments', (count, includeReply) => {
      return window.twikoo.getRecentComments({
        envId: twikoo.envId,
        region: twikoo.region,
        pageSize: count,
        includeReply: includeReply
      });
    });

    return true;
  },

  refresh(): void {
    if (!$('#comments') || !window.twikoo) {
      return;
    }

    const { twikoo } = configManager.siteConfig;

    window.twikoo.init({
      envId: twikoo.envId,
      region: twikoo.region,
      path: twikoo.path,
      el: '#twikoo',
      onCommentLoaded: () => {
        const images = $.all<HTMLImageElement>(commentImageSelector);
        componentManager.invokeAPI('imageViewer', images);
      }
    });
  }
};

export default component_comment_twikoo;