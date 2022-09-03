import $ from '../$';
import debugUtils from '../utils/debugUtils';

export type TopLayerPanelState = 'opening' | 'opened' | 'closing' | 'closed';

export type TopLayerPanelEvents = {
  beforeOpen?: () => void,
  afterOpen?: () => void,
  beforeClose?: () => void,
  afterClose?: () => void
};

/**
 * 顶层面板 FSM
 */
export default class TopLayerPanel {
  private _panel: HTMLElement;
  private _openButton: HTMLElement;
  private _closeButton: HTMLElement;
  private _state: TopLayerPanelState;

  public constructor(panelSelector: string, openButtonSelector: string, events?: TopLayerPanelEvents) {
    this._panel = $.assert(panelSelector);
    this._openButton = $.assert(openButtonSelector);
    this._closeButton = $.assert('.top-layer-panel-close-btn', this._panel);
    this._state = 'closed';

    this.setState();

    this._openButton.addEventListener('click', () => {
      events?.beforeOpen?.();
      this.openAsync().then(events?.afterOpen);
    });

    this._closeButton.addEventListener('click', () => {
      events?.beforeClose?.();
      this.closeAsync().then(events?.afterClose);
    });
  }

  private setState(value?: TopLayerPanelState): void {
    if (value) {
      this._state = value;
    }

    this._panel.attr('state', this._state);
  }

  private resetTransition(transitionTime: number /* ms */): void {
    const rect = this._openButton.getBoundingClientRect();
    const x = 0.5 * (rect.left + rect.right);
    const y = 0.5 * (rect.top + rect.bottom);
    this._panel.css({
      'transform-origin': `${x}px ${y}px`,
      '-webkit-transform-origin': `${x}px ${y}px`,
      'animation-duration': `${transitionTime / 1000}s`,
      '-webkit-animation-duration': `${transitionTime / 1000}s`
    });
  }

  public get state(): TopLayerPanelState {
    return this._state;
  }

  public get panelElement(): HTMLElement {
    return this._panel;
  }

  public get openBtnElement(): HTMLElement {
    return this._openButton;
  }

  public get closeBtnElement(): HTMLElement {
    return this._closeButton;
  }

  public openAsync(animate = true, force = false): Promise<void> {
    if (this._state !== 'closed') {
      if (!force) {
        debugUtils.warning('can not open panel, because it is ' + this._state);
      }
      return Promise.resolve();
    }

    document.body.css('overflow', 'hidden');

    if (animate) {
      const transitionTime = 200; // ms
      this.resetTransition(transitionTime);
      this.setState('opening');

      return new Promise(resolve => setTimeout(() => {
        this.setState('opened');
        resolve();
      }, transitionTime));
    } else {
      this.setState('opened');
      return Promise.resolve();
    }
  }

  public closeAsync(animate = true, force = false): Promise<void> {
    if (this._state !== 'opened') {
      if (!force) {
        debugUtils.warning('can not close panel, because it is ' + this._state);
      }
      return Promise.resolve();
    }

    document.body.css('overflow', null);

    if (animate) {
      const transitionTime = 200; // ms
      this.resetTransition(transitionTime);
      this.setState('closing');

      return new Promise(resolve => setTimeout(() => {
        this.setState('closed');
        resolve();
      }, transitionTime));
    } else {
      this.setState('closed');
      return Promise.resolve();
    }
  }
}