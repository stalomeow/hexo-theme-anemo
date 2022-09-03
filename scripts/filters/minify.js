/* global hexo */

'use strict';

const fs = require('fs');
const path = require('path');
const Fontmin = require('fontmin');
const through = require('through2');
const concat = require('concat-stream');
const CleanCSS = require('clean-css');
const htmlMinify = require('html-minifier').minify;
const uglifyJS = require('uglify-js');

const glyph2Readable = through.ctor(
  { objectMode: true },
  (file, enc, cb) => cb(null, file.contents) // 注：glyph 不支持 streaming
);

async function getUniqueChars(ext) {
  let chars = new Set();
  let files = hexo.route.list().filter(v => v.endsWith(ext));
  let promises = files.map(file => new Promise((resolve, reject) => {
    let stream = hexo.route.get(file);
    stream.on('error', reject);
    stream.pipe(concat({ encoding: 'string' }, buf => {
      let text = buf.replace(/<[^<>]+>/g, '');
      for (let c of text) {
        chars.add(c);
      }
      resolve();
    }));
  }));

  await Promise.all(promises);
  return Array.from(chars);
}

function findFile(file) {
  let possibleArgs = [
    [hexo.source_dir, file],
    [hexo.theme_dir, 'source', file]
  ];

  for (let args of possibleArgs) {
    let src = path.join(...args);
    if (fs.existsSync(src)) {
      return src;
    }
  }
  return null;
}

function minifyHTML(str, data) {
  const config = hexo.theme.config.minify.html;
  if (!config.enable) {
    return;
  }

  let options = Object.assign({}, config.options);

  if (options.ignoreCustomComments) {
    options.ignoreCustomComments = options.ignoreCustomComments.map(v => new RegExp(v, 'g'));
  }

  return htmlMinify(str, options);
}

// html
hexo.extend.filter.register('after_render:html', minifyHTML);

// js
hexo.extend.filter.register('after_render:js', (str, data) => {
  const config = hexo.theme.config.minify.js;
  if (!config.enable) {
    return;
  }

  let options = Object.assign({}, config.options);
  return uglifyJS.minify(str, options).code;
});

// css
hexo.extend.filter.register('after_render:css', (str, data) => {
  const config = hexo.theme.config.minify.css;
  if (!config.enable) {
    return;
  }

  let options = Object.assign({}, config.options);
  delete options.returnPromise;
  return new CleanCSS(options).minify(str).styles;
});

// local fonts
hexo.extend.filter.register('after_generate', async () => {
  const config = hexo.theme.config.minify.local_fonts;
  if (!config.enable || !config.includes || config.includes.length === 0) {
    return;
  }

  let htmlChars = await getUniqueChars('.html');

  for (let font of config.includes) {
    let src = findFile(font.path);
    if (!src) {
      hexo.log.error('Can not find font: ' + font.path);
      continue;
    }

    let chars = [];
    config.preserved_chars && chars.push(...config.preserved_chars);
    font.preserved_chars.html && chars.push(...htmlChars);
    font.preserved_chars.custom && chars.push(...font.preserved_chars.custom);
    let text = Array.from(new Set(chars)).join('');

    let stream = new Fontmin()
      .src(src)
      .use(Fontmin.glyph({
        text: text,
        hinting: false
      }))
      .use(glyph2Readable) // convert to normal readable stream
      .createStream();

    let buf = await new Promise((resolve, reject) => {
      stream.on('error', err => {
        hexo.log.error(`Minimizing ${font.path}, ${err}.`);
        reject(err);
      });
      stream.pipe(concat(buf => {
        hexo.log.info(`Minimized: ${font.path} [${text.length} Chars, ${buf.byteLength} Bytes].`);
        resolve(buf);
      }));
    });

    hexo.route.set(font.export_path, buf);
  }
});
