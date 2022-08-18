/* global DOMHighResTimeStamp */

import $ from '../$';
import anemoUtils from '../utils/anemoUtils';
import colorSchemeManager from '../managers/colorSchemeManager';
import debugUtils from '../utils/debugUtils';

const canvasSelector = '#loading-box canvas';
const textAreaSelector = '#loading-box p';
const bgSelector = '#loading-box .loading-bg';
const timeout = 5; // unit: sec
const greyColor = [102, 102, 102];
const elementsColors = [
  [255, 102, 64], // 火
  [0, 192, 255], // 水
  [51, 215, 160], // 风
  [204, 128, 255], // 雷
  [170, 255, 41], // 草（这个颜色我不确定）
  [122, 242, 242], // 冰
  [255, 176, 13] // 岩
];

let enabled: boolean;
let startTime: DOMHighResTimeStamp | undefined;
let lastUpdateTime: DOMHighResTimeStamp | undefined;
let isTimeout: boolean;
let displayProgress: number;
let targetProgress: number;
let displayCanvas: HTMLCanvasElement;
let displayCtx: CanvasRenderingContext2D;
let cachedCanvas: HTMLCanvasElement;
let cachedCtx: CanvasRenderingContext2D;
let cachedImageData: ImageData | undefined;
let windowWidth: number | undefined;
let windowHeight: number | undefined;
let imageLoaded: boolean;
let image: HTMLImageElement;

function updateView(time: DOMHighResTimeStamp): void {
  if (displayProgress === 1) {
    document.body.attr('loaded', ''); // 加载结束
    return;
  }

  if (!isTimeout) {
    if (startTime) {
      const accumulatedTime = (time - startTime) * 0.001; // to unit: sec

      // 为了避免长时间等待，超时后提供手动关闭加载界面的方法
      if (accumulatedTime >= timeout) {
        isTimeout = true;
        $.assert(textAreaSelector).addClass('active');
      }
    } else {
      startTime = time;
    }
  }

  if (lastUpdateTime) {
    const deltaTime = (time - lastUpdateTime) * 0.001; // to unit: sec
    const t = Math.min(deltaTime * 10, 0.5);
    displayProgress = anemoUtils.lerp(displayProgress, targetProgress, t);
  } else {
    // 从零开始，如果直接设成 _targetProgress 的话，
    // 有时候速度太快看不见加载页面
    displayProgress = 0;
  }
  if (displayProgress >= 0.99) {
    displayProgress = 1; // 做一个近似，不然永远到不了
  }
  lastUpdateTime = time;

  // 在图像加载完成并且加载界面还可见时进行画面更新
  if (imageLoaded && !document.body.hasClass('loaded')) {
    // 绘制两倍大小的图像，提高清晰度
    const canvasWidth = document.body.clientWidth * 2;
    const canvasHeight = document.body.clientHeight * 2;

    const dw = Math.max(canvasWidth * 0.25, 264 * 2);
    const dh = dw * image.height / image.width;
    const dx = (canvasWidth - dw) * 0.5;
    const dy = (canvasHeight - dh) * 0.5;

    if (windowWidth !== canvasWidth || windowHeight !== canvasHeight || !cachedImageData) {
      // 利用双缓存绘制，减少闪屏
      cachedCanvas.width = canvasWidth;
      cachedCanvas.height = canvasHeight;
      displayCanvas.width = canvasWidth;
      displayCanvas.height = canvasHeight;
      windowWidth = canvasWidth;
      windowHeight = canvasHeight;

      cachedCtx.drawImage(image, dx, dy, dw, dh);
      cachedImageData = cachedCtx.getImageData(dx, dy, dw, dh);
      debugUtils.warning('resize loading box canvas.');
    }

    const lenX = dw * 4; // x 维度的长度
    const fillLenX = lenX * displayProgress; // x 维度需要填充的长度
    const data = cachedImageData.data;

    let singleColor: boolean; // 如果为 false，那么七种元素会使用不同颜色
    let backRGB: [number, number, number];

    // 根据当前颜色模式选择颜色
    if (colorSchemeManager.currentScheme === 'light') {
      singleColor = true;
      backRGB = [255, 255, 255];
    } else {
      singleColor = false;
      backRGB = [102, 102, 102];
    }

    // 上色
    for (let x = 0; x < lenX; x += 4) {
      for (let y = 0; y < dh; y++) {
        const i = x + y * lenX;
        let rgb: number[];

        if (x < fillLenX) {
          if (singleColor) {
            rgb = greyColor;
          } else {
            // 根据进度选择颜色
            const index = Math.floor(x * elementsColors.length / lenX);
            rgb = elementsColors[index];
          }
        } else {
          rgb = backRGB;
        }

        // 只对 alpha > 0 的地方上色
        if (data[i + 3] > 0) {
          data[i] = rgb[0];
          data[i + 1] = rgb[1];
          data[i + 2] = rgb[2];
        }
      }
    }

    displayCtx.putImageData(cachedImageData, dx, dy);
  }

  // 继续更新
  requestAnimationFrame(updateView);
}

export default {
  initialize(enable: boolean, imageSrc: string): void {
    enabled = enable;

    if (!enabled) {
      return;
    }

    isTimeout = false;
    displayProgress = 1; // 默认加载完成状态
    targetProgress = 1;
    displayCanvas = $.assert(canvasSelector);
    displayCtx = displayCanvas.getContext('2d')!;
    cachedCanvas = document.createElement('canvas');
    cachedCtx = cachedCanvas.getContext('2d', { willReadFrequently: true })!;
    imageLoaded = false;
    image = new Image();

    // load the image immediately
    image.onload = () => imageLoaded = true;
    image.onerror = () => debugUtils.error('download genshin loading image failed, because an error occurred.');
    image.onabort = () => debugUtils.error('download genshin loading image failed, because download is aborted.');
    image.src = imageSrc;

    $.assert<HTMLElement>(bgSelector).addEventListener('click', () => {
      if (!isTimeout) {
        return;
      }

      document.body.attr('loaded', ''); // 隐藏加载界面，后台继续加载
      debugUtils.warning('loading box is forced to be hidden.');
    });
  },

  display(progress: number, text?: string): void {
    if (!enabled) {
      return;
    }

    targetProgress = progress;
    debugUtils.info(text);

    // 如果显示的进度没到 1，说明之前的一轮更新还没结束，
    // 不需要再重新开始一轮更新
    if (displayProgress < 1) {
      return;
    }

    // 如果上次超时，那么清空之前注册的事件并隐藏文本
    if (isTimeout) {
      $.assert(textAreaSelector).removeClass('active');
    }

    startTime = undefined;
    lastUpdateTime = undefined;
    isTimeout = false;
    displayProgress = 0;
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    requestAnimationFrame(updateView);
    document.body.attr('loaded', null); // 显示加载页面
  }
};