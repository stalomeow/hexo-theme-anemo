/* global hexo */

hexo.extend.helper.register('prev_post', function prev_post(post) {
  const prev = post.prev;
  if (!prev) {
    return null;
  }
  if (prev.hide) {
    return prev_post(prev);
  }
  return prev;
});

hexo.extend.helper.register('next_post', function next_post(post) {
  const next = post.next;
  if (!next) {
    return null;
  }
  if (next.hide) {
    return next_post(next);
  }
  return next;
});

hexo.extend.helper.register('static_banner_img_url', function static_banner_img_url(post) {
  let img = post.banner_img;
  let result = null;

  if (img) {
    if (typeof img === 'string') {
      // 单图 banner，直接赋值
      result = img;
    } else if (Array.isArray(img)) {
      // 多图 banner，选第一张
      result = img.length > 0 ? (img[0].pic || img[0]) : null;
    } else {
      // 如果是单图 banner，直接赋值
      // 如果是视频 banner，选用 poster
      result = img.pic || img.poster;
    }
  }

  if (typeof result !== 'string') {
    result = null;
  }

  // 实在没有就用首页的缩略图 thumbnail 将就一下
  return this.url_for(result || post.thumbnail || this.theme.missing_image);
});