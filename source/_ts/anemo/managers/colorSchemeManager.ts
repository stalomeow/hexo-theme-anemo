import $ from '../$';
import debugUtils from '../utils/debugUtils';
import userPref from '../utils/userpref';


export type ColorScheme = 'light' | 'dark';
export type ColorSchemeChangedCallback = (scheme: ColorScheme) => void;


const colorSchemeAttrName = 'data-color-scheme';
const defaultColorSchemeAttrName = 'data-default-color-scheme';
const colorSchemeUserPrefKey = 'anemo-color-scheme';
const mediaQuery = '(prefers-color-scheme: dark)';
const colorSchemeButtonSelector = '#color-scheme-btn';


let _changeable = true;
let _autoChange = true;
let _scheme: ColorScheme = 'light';
const _callbacks: ColorSchemeChangedCallback[] = [];


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initMediaQueryEvent(self: any): void {
  if (!_changeable) {
    return;
  }

  // 支持自动切换
  window.matchMedia(mediaQuery).addEventListener('change', e => {
    if (_autoChange) {
      self.currentScheme = e.matches ? 'dark' : 'light';
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initSwitchButton(self: any): void {
  const button = $.assert<HTMLElement>(colorSchemeButtonSelector);

  if (_changeable) {
    // 点击按钮时，切换颜色方案
    button.addEventListener('click', () => self.change());
  } else {
    // 隐藏按钮
    button.css('display', 'none');
  }
}

function applyScheme(scheme: ColorScheme): void {
  _scheme = scheme;

  // apply attr
  document.documentElement.attr(colorSchemeAttrName, scheme);

  // execute callbacks
  _callbacks.forEach(cb => cb(scheme));

  debugUtils.info('color scheme -> %s', scheme);
}

function isValid(scheme: unknown): scheme is ColorScheme {
  return scheme === 'dark' || scheme === 'light';
}

function getDefault(): ColorScheme | null {
  const scheme = document.documentElement.attr(defaultColorSchemeAttrName);
  return isValid(scheme) ? scheme : null;
}

function getStored(): ColorScheme | null {
  const scheme = userPref(colorSchemeUserPrefKey);
  return isValid(scheme) ? scheme : null;
}

function getMediaQuery(): ColorScheme {
  const match = window.matchMedia(mediaQuery).matches;
  return match ? 'dark' : 'light';
}


export default {
  get currentScheme(): ColorScheme {
    return _scheme;
  },

  set currentScheme(value: ColorScheme) {
    if (!_changeable) {
      debugUtils.error('can not change color scheme because it is not changeable');
      return;
    }

    if (_scheme === value) {
      return;
    }

    applyScheme(value);

    // 保存颜色方案
    if (value === getMediaQuery()) {
      // 设置为自动模式
      userPref(colorSchemeUserPrefKey, null);
      _autoChange = true;
    } else {
      userPref(colorSchemeUserPrefKey, value);
      _autoChange = false;
    }
  },

  initialize(): void {
    let scheme: ColorScheme | null = null;
    let changeable = true;
    let autoChange = true;

    const defaultScheme = getDefault();
    if (defaultScheme) {
      scheme = defaultScheme;
      changeable = false;
      autoChange = false;
    } else {
      const storedScheme = getStored();
      if (isValid(storedScheme)) {
        scheme = storedScheme;
        autoChange = false;
      }
    }

    _changeable = changeable;
    _autoChange = autoChange;
    applyScheme(scheme ?? getMediaQuery());

    initMediaQueryEvent(this);
    initSwitchButton(this);
  },

  change(): void {
    // 反转颜色方案
    switch (this.currentScheme) {
      case 'light': this.currentScheme = 'dark'; break;
      case 'dark': this.currentScheme = 'light'; break;
    }
  },

  registerCallback(callback: ColorSchemeChangedCallback): void {
    _callbacks.push(callback);
  }
};