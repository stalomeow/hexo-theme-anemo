/* global hexo */

'use strict';

// 生成前过滤文章
hexo.extend.filter.register('before_generate', function() {
  this._bindLocals();

  const allPosts = this.locals.get('posts');
  const hidePosts = allPosts.filter(post => post.hide);
  const normalPosts = allPosts.filter(post => !post.hide);

  this.locals.set('all_posts', allPosts);
  this.locals.set('hide_posts', hidePosts);
  this.locals.set('posts', normalPosts);
});

const original_post_generator = hexo.extend.generator.get('post');

hexo.extend.generator.register('post', function(locals) {
  // 发送时需要把过滤的页面也加入
  return original_post_generator.bind(this)({
    posts: new locals.posts.constructor(
      locals.posts.data.concat(locals.hide_posts.data)
    )
  });
});
