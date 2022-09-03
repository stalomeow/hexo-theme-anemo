import musicUtils, { MusicInfo } from '../utils/musicUtils';
import $ from '../$';
import { IComponent } from '../component';
import TopLayerPanel from '../miscellaneous/topLayerPanel';
import anemoUtils from '../utils/anemoUtils';
import configManager from '../managers/configManager';
import debugUtils from '../utils/debugUtils';
import userPref from '../utils/userpref';

// TODO: playlist 滚动至元素
// TODO: 解决长时间后链接失效问题

// lyric
const lyricSelector = '.bg-music-lyric';

// progress bar
const progressBarTimeCurrentSelector = '.bg-music-time span[data=current]';
const progressBarTimeLengthSelector = '.bg-music-time span[data=length]';
const progressBarSelector = '.bg-music-progress';
const progressBarSliderSelector = '.bg-music-progress>div';

// playlist
const playlistButtonSelector = '#bg-music-playlist-button';
const playlistSelector = '.bg-music-playlist';
const playlistMaskSelector = '.bg-music-playlist-mask';
const playlistULSelector = '.bg-music-playlist-item-container>ul';

// play mode
const playModeButtonSelector = '#bg-music-play-mode-button';
const playModeUserPrefKey = 'anemo-bg-music-play-mode';
const playModeDefaultValue = 'loop';

// other control buttons
const previousButtonSelector = '#bg-music-previous-button';
const nextButtonSelector = '#bg-music-next-button';
const playPauseButtonSelector = '#bg-music-play-pause-button';

// music player
const panelSelector = '#bg-music-panel';
const panelOpenButtonSelector = '#bg-music-btn';
const audioSelector = '#bg-music-panel audio';
const musicTitleSelector = '.bg-music-title';
const musicSubtitleSelector = '.bg-music-subtitle';
const musicDiscSelector = '.bg-music-disc img';
const pcScreenMinWidthExclusive = 540; // px
const musicCoverControlSelector = '.bg-music-cover-control';
const musicCoverSelector = '.bg-music-cover';
const musicInfoSelector = '.bg-music-info';


interface LyricData {
  time: number;
  text: string;
  translation?: string;
}

class Lyric {
  private _container: HTMLElement;
  private _containerParent: HTMLElement;
  private _data: LyricData[];
  private _index: number;
  private _lines: HTMLElement[];

  private constructor(data: LyricData[]) {
    this._container = $.assert(lyricSelector);
    this._containerParent = this._container.parentElement!;
    this._data = data;
    this._index = 0;
    this._lines = [];

    // init all lines
    this._container.innerHTML = '';
    this._data.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line.text;

      if (line.translation) {
        p.innerHTML += ('<br>' + line.translation);
      }

      this._container.appendChild(p);
      this._lines.push(p);
    });

    this.setCurrent(0);
  }

  private setCurrent(index: number): void {
    if (index < 0 || index >= this._data.length) {
      debugUtils.warning(`can not set current lyric, because index(${index}) is out of range: [0, ${this._data.length})`);
      return;
    }

    this._lines[this._index].attr('current', null); // 清除旧的

    this._index = index;
    this._lines[index].attr('current', ''); // 设置新的

    // 计算歌词 div 偏移量
    const offset = this._lines.reduce<number>((sum, line, i) => {
      if (i > index) {
        return sum;
      }

      if (i === index) {
        return sum + (0.8 * line.offsetHeight);
      }

      // i < index
      return sum + line.offsetHeight;
    }, 0);

    const halfDisplayHeight = this._containerParent.offsetHeight * 0.5;
    const translateY = `translateY(${halfDisplayHeight - offset}px)`;
    this._container.css({
      'transform': translateY,
      '-webkit-transform': translateY
    });
  }

  public update(time: number, force: boolean): void {
    if (this._data.length === 0) {
      return;
    }

    if (!force && this._containerParent.offsetHeight === 0) {
      // debugUtils.info('lyric is hidden so updating is unnecessary')
      return;
    }

    const i = this._index;
    const data = this._data;
    const flag0 = (i < 0) || (i > data.length - 1); // out of range
    const flag1 = time < data[i].time;
    const flag2 = data[i + 1] && (time >= data[i + 1].time);

    if (force || flag0 || flag1 || flag2) {
      for (let j = 0; j < data.length; j++) {
        if (time >= data[j].time && (((j + 1) >= data.length) || (time < data[j + 1].time))) {
          this.setCurrent(j);
          return;
        }
      }

      // fallback
      this.setCurrent(0);
      debugUtils.warning('lyric update fallback');
    }

    // 无需更新
  }

  public static async downloadAsync(url: string): Promise<Lyric> {
    const res = await fetch(url);
    let rawText = await res.text();
    let data: LyricData[] = [];

    if (rawText.length > 0) {
      // 开始解析
      rawText = rawText.replace(/([^\]^\n])\[/g, (_, p1) => (p1 + '\n['));
      const lyricText = rawText.split('\n');

      for (let i = 0; i < lyricText.length; i++) {
        // 匹配时间
        const lrcTimes = lyricText[i].match(/\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g);

        if (!lrcTimes) {
          continue;
        }

        // 匹配歌词
        let lrcText = lyricText[i].replace(/.*\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g, '')
          .replace(/<(\d{2}):(\d{2})(\.(\d{2,3}))?>/g, '')
          .replace(/^\s+|\s+$$/g, '');

        // 如果有翻译就匹配翻译
        let lrcTranslation: string | undefined;
        const index = lrcText.lastIndexOf(' (');
        if (index > -1 && lrcText.endsWith(')')) {
          lrcTranslation = lrcText.substring(index + 2, lrcText.length - 1);
          lrcText = lrcText.substring(0, index);
        }

        // 可能有多个时间标签，依次添加
        for (let j = 0; j < lrcTimes.length; j++) {
          const oneTime = /\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/.exec(lrcTimes[j])!;
          const min2sec = parseInt(oneTime[1]) * 60;
          const sec2sec = parseInt(oneTime[2]);
          const msec2sec = oneTime[4] ? parseInt(oneTime[4]) / ((oneTime[4] + '').length === 2 ? 100 : 1000) : 0;
          const lrcTime = min2sec + sec2sec + msec2sec;
          data.push({
            time: lrcTime,
            text: lrcText,
            translation: lrcTranslation
          });
        }
      }
    }

    if (data.length === 0) {
      // 加一个无歌词的提示，不然啥也没有不好看
      data.push({
        time: 0,
        text: 'This music has no lyrics now',
        translation: '该音乐暂无歌词'
      });
    } else {
      // 根据时间排序
      data = data.filter(item => item.text).sort((a, b) => a.time - b.time);

      // 处理时间相同的重复元素
      for (let i = data.length - 1; i >= 1; i--) {
        if (data[i - 1].time !== data[i].time) {
          continue;
        }

        if (typeof data[i].translation === 'undefined') {
          continue;
        }

        // 在两者都有翻译且翻译相同时，删除后一个
        // 因为这种情况下，后一个很可能就是发音（比如罗马音）
        if (data[i].translation === data[i - 1].translation) {
          data.splice(i, 1);
        }
      }

      // 如果第一个歌词时间不是 0，就加一个空歌词提示还在前奏部分
      if (data[0].time > 0) {
        data.unshift({
          time: 0,
          text: '...'
        });
      }
    }

    return new Lyric(data);
  }
}

interface ProgressBarEvents {
  seekStart: () => boolean;
  seeking: (progress: number) => void;
  seekEnd: (progress: number) => void;
}

class ProgressBar {
  private _timeCurrent: HTMLElement;
  private _timeLength: HTMLElement;
  private _progressBar: HTMLElement;
  private _progressSlider: HTMLElement;
  private _events: ProgressBarEvents;
  private _progress: number;

  public constructor(events: ProgressBarEvents) {
    this._timeCurrent = $.assert(progressBarTimeCurrentSelector);
    this._timeLength = $.assert(progressBarTimeLengthSelector);
    this._progressBar = $.assert(progressBarSelector);
    this._progressSlider = $.assert(progressBarSliderSelector);
    this._events = events;
    this._progress = 0;

    this.update(0, 0); // init view

    // register events
    this._progressBar.addEventListener('mousedown', this.startSeekingMouse.bind(this));
    this._progressBar.addEventListener('touchstart', this.startSeekingTouch.bind(this), { passive: false });
  }

  public get progress(): number {
    return this._progress;
  }

  public update(progress: number, duration: number): void {
    this._progress = progress;
    this._timeCurrent.textContent = musicUtils.formatTime(progress * duration);
    this._timeLength.textContent = musicUtils.formatTime(duration);
    this._progressSlider.css('width', (progress * 100).toFixed(2) + '%');
  }

  private calcSeekProgress(clientX: number): number {
    const rect = this._progressBar.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    return Math.min(Math.max(percentage, 0), 1);
  }

  private startSeekingMouse(e: MouseEvent): void {
    e.preventDefault();

    if (!this._events.seekStart()) {
      return;
    }

    const seeking = (e: MouseEvent) => {
      e.preventDefault();

      const progress = this.calcSeekProgress(e.clientX);
      this._events.seeking(progress);
    };

    const endSeeking = (e: MouseEvent) => {
      e.preventDefault();

      const progress = this.calcSeekProgress(e.clientX);
      this._events.seekEnd(progress);

      document.removeEventListener('mousemove', seeking);
      document.removeEventListener('mouseup', endSeeking);
    };

    document.addEventListener('mousemove', seeking);
    document.addEventListener('mouseup', endSeeking);
  }

  private startSeekingTouch(e: TouchEvent): void {
    if (!e.cancelable) {
      return; // 有些 touchstart 不能被 cancel
    }

    e.preventDefault();

    if (!this._events.seekStart()) {
      return;
    }

    const seeking = (e: TouchEvent) => {
      e.preventDefault();

      const progress = this.calcSeekProgress(e.changedTouches[0].clientX);
      this._events.seeking(progress);
    };

    const endSeeking = (e: TouchEvent) => {
      e.preventDefault();

      const progress = this.calcSeekProgress(e.changedTouches[0].clientX);
      this._events.seekEnd(progress);

      document.removeEventListener('touchmove', seeking);
      document.removeEventListener('touchend', endSeeking);
    };

    document.addEventListener('touchmove', seeking, { passive: false });
    document.addEventListener('touchend', endSeeking, { passive: false });
  }
}

type PlayMode = 'loop' | 'loop-one' | 'random';
type SwitchDirection = 'forward' | 'backward';

interface MusicPlaylistEvents {
  switchMusic: (music: MusicInfo, time: number, playImmediately: boolean) => Promise<void>;
}

class Playlist {
  private _ul: HTMLElement;
  private _musics: MusicInfo[];
  private _playIndex: number;
  private _events: MusicPlaylistEvents;
  private _switchMusicLock: boolean;

  private constructor(musics: MusicInfo[], events: MusicPlaylistEvents) {
    this._ul = $.assert(playlistULSelector);
    this._musics = musics;
    this._playIndex = -1; // invalid value
    this._events = events;
    this._switchMusicLock = false;
  }

  public updateWidgetView(): void {
    // 清除所有子元素
    this._ul.innerHTML = '';

    // 生成列表
    this._musics.forEach((music, index) => {
      // icon
      const i = $.create('i', {
        'class': configManager.siteConfig.bgMusic.playing_icon
      });

      // title
      const title = $.create('div');
      title.textContent = music.title;

      // author
      const subtitle = $.create('div');
      subtitle.textContent = music.author;

      const li = $.create('li');
      li.appendChild(i);
      li.appendChild(title);
      li.appendChild(subtitle);

      // 把 index 缓存，方便后面读取
      li.attr('index', index.toString());

      // 被点击时切换歌曲
      li.addEventListener('click', () => {
        // 读取之前缓存的 index
        const musicIndex = parseInt(li.attr('index')!);
        // 立即播放。但如果点击的歌曲已经在播放了，不强制重新播放
        this.switchToMusicAsync(musicIndex, 0, true, false);
      });

      this._ul.appendChild(li);
    });
  }

  public get musicCount(): number {
    return this._ul.childElementCount;
  }

  public get playIndex(): number {
    return this._playIndex;
  }

  private async switchToMusicAsync(index: number, time: number, playImmediately: boolean, force: boolean): Promise<void> {
    if (this.musicCount === 0) {
      return;
    }

    if (this._switchMusicLock) {
      debugUtils.warning('to avoid violation, you can not switch music now');
      return;
    }

    // 防止下标越界
    index %= this.musicCount;
    index = (index < 0) ? (index + this.musicCount) : index;

    if (index !== this._playIndex) {
      // 去除旧信息（_playIndex 可能为 -1）
      this._ul.children[this._playIndex]?.attr('current', null);
      // 显示为正在播放
      this._ul.children[index].attr('current', '');
    } else if (!force) {
      // 如果不强制切换，并且目标音乐与当前一致，则啥也不干
      return;
    }

    // 当前音乐切换完前禁止再切换其他音乐
    this._switchMusicLock = true;
    {
      this._playIndex = index;
      const music = this._musics[index];
      await this._events.switchMusic(music, time, playImmediately);

      // 滚动至元素
      // const itemOffsetTop = this._items[index].offset()!.top;
      // const offsetTop = this._container.offset()!.top;
      // const scrollTop = this._container.scrollTop()!;
      // this._container.animate({
      //   scrollTop: itemOffsetTop - offsetTop + scrollTop,
      //   behavior: 'swing'
      // });

      // this._ul.parentElement!.scrollTo({
      //   top: (this._ul.children[index] as HTMLElement).offsetTop,
      //   behavior: 'smooth'
      // });
    }
    this._switchMusicLock = false;
  }

  public switchToNextMusic(
    direction: SwitchDirection,
    random: boolean,
    playImmediately: boolean,
    force: boolean
  ): void {
    let index = this._playIndex;
    const step = (direction === 'forward') ? 1 : -1;

    if (random) {
      const ri = anemoUtils.randomInt(0, this.musicCount);
      index = (ri === index) ? (ri + step) : ri; // 保证是不同歌曲
    } else {
      index += step;
    }

    this.switchToMusicAsync(index, 0, playImmediately, force);
  }

  public switchToSpecificMusic(
    index: number,
    time: number,
    playImmediately: boolean,
    force: boolean
  ): void {
    this.switchToMusicAsync(index, time, playImmediately, force);
  }

  // static part

  private static _widgetRoot: HTMLElement;

  public static initializeWidget(): void {
    this._widgetRoot = $.assert<HTMLElement>(playlistSelector);

    // 点击打开按钮打开
    const openButton = $.assert<HTMLElement>(playlistButtonSelector);
    openButton.addEventListener('click', () => Playlist.showWidget());

    // 点击空白区域关闭
    const mask = $.assert<HTMLElement>(playlistMaskSelector);
    mask.addEventListener('click', () => Playlist.hideWidget());
  }

  public static showWidget(): void {
    this._widgetRoot.attr('show', '');
  }

  public static hideWidget(): void {
    this._widgetRoot.attr('show', null);
  }

  public static async downloadAsync(links: string[], events: MusicPlaylistEvents): Promise<Playlist> {
    if (links.length === 0) {
      return new Playlist([], events);
    }

    const musics = await musicUtils.requestAPIAsync(links);
    return new Playlist(musics, events);
  }
}

class PlayModeController {
  private _button: HTMLElement;
  private _playMode: PlayMode;

  public constructor() {
    this._button = $.assert(playModeButtonSelector);
    // 点击按钮后切换至下一个播放模式
    this._button.addEventListener('click', () => this.switchPlayMode());

    const storedMode = userPref(playModeUserPrefKey);
    this._playMode = (storedMode || playModeDefaultValue) as PlayMode;
    this.updateButton();
  }

  public get playMode(): PlayMode {
    return this._playMode;
  }

  public switchPlayMode(): void {
    this._playMode = PlayModeController.nextPlayMode(this._playMode);
    userPref(playModeUserPrefKey, this._playMode); // save
    this.updateButton();
  }

  private updateButton(): void {
    this._button.attr('mode', this._playMode);
  }

  private static nextPlayMode(current: PlayMode): PlayMode {
    switch (current) {
      case 'loop': return 'loop-one';
      case 'loop-one': return 'random';
      case 'random': return 'loop';
    }
  }
}


class MusicPlayer {
  private _enableTimeUpdating: boolean;
  private _coverModeOnMobileDevice: boolean;

  private _audio: HTMLAudioElement;
  private _musicTitle: HTMLElement;
  private _musicSubtitle: HTMLElement;
  private _musicDisc: HTMLImageElement;

  private _panel: TopLayerPanel;
  private _playModeController: PlayModeController;
  private _progressBar: ProgressBar;
  private _playlist?: Playlist;
  private _lyric?: Lyric;

  public constructor() {
    this._enableTimeUpdating = true;
    this._coverModeOnMobileDevice = true; // default is true

    this._audio = $.assert(audioSelector);
    this._musicTitle = $.assert(musicTitleSelector);
    this._musicSubtitle = $.assert(musicSubtitleSelector);
    this._musicDisc = $.assert(musicDiscSelector);

    this._panel = new TopLayerPanel(panelSelector, panelOpenButtonSelector, {
      beforeOpen: () => this._enableTimeUpdating = true, // 打开前就允许更新
      afterOpen: () => {
        // 为了良好体验，打开页面后立刻更新一次
        if (this.isAudioLoaded()) {
          this.updateProgressBar();
          this.updateLyric(true);
        }
      },
      afterClose: () => this._enableTimeUpdating = false // 关闭后没必要更新
    });
    this._playModeController = new PlayModeController();
    this._progressBar = new ProgressBar({
      seekStart: () => {
        // 只要有加载音乐，即使不在播放也允许调整
        if (this.isAudioLoaded()) {
          // 禁止进度条、歌词的自动更新
          this._enableTimeUpdating = false;
          return true;
        }
        return false;
      },
      seeking: progress => {
        // 只更新歌词和进度条来预览
        this.updateProgressBar(progress);
        this.updateLyric(false, progress * this._audio.duration);
      },
      seekEnd: progress => {
        this._audio.currentTime = progress * this._audio.duration; // 更新进度
        this._enableTimeUpdating = true; // 开启进度条、歌词的自动更新
      }
    });

    this.initAudioEvents();
    this.initCtrlButtonEvents();
    this.initMobileDeviceEvents();

    Playlist.initializeWidget();
  }

  private initAudioEvents(): void {
    // 加载完毕后更新进度条信息
    this._audio.addEventListener('load', () => {
      this.updateProgressBar();
      this.updateLyric(true);
    });

    // 更新进度条和歌词
    this._audio.addEventListener('timeupdate', () => {
      if (this._enableTimeUpdating) {
        this.updateProgressBar();
        this.updateLyric(false);
      }
    });

    // 一首歌播完后，自动连播
    this._audio.addEventListener('ended', () => this.playNextMusic('forward'));
  }

  private initCtrlButtonEvents(): void {
    const playPauseButton = $.assert<HTMLElement>(playPauseButtonSelector);
    const prevButton = $.assert<HTMLElement>(previousButtonSelector);
    const nextButton = $.assert<HTMLElement>(nextButtonSelector);

    // 点击播放/暂停按钮时，切换播放状态
    playPauseButton.addEventListener('click', () => {
      if (this._audio.paused) {
        this.playCurrentMusic();
      } else {
        this.pauseCurrentMusic();
      }
    });

    // 切换为前一首歌
    prevButton.addEventListener('click', () => this.playNextMusic('backward'));

    // 切换为后一首歌
    nextButton.addEventListener('click', () => this.playNextMusic('forward'));
  }

  private initMobileDeviceEvents(): void {
    const coverControl = $.assert<HTMLElement>(musicCoverControlSelector);
    const cover = $.assert(musicCoverSelector);
    const info = $.assert(musicInfoSelector);

    // 点击封面切换为歌词
    // 点击歌词切换为封面
    coverControl.addEventListener('click', e => {
      if (document.documentElement.clientWidth > pcScreenMinWidthExclusive) {
        return;
      }

      // 做一次筛选，避免点到进度条或者播放按钮的时候还切换
      if (e.target !== coverControl) {
        return;
      }

      this._coverModeOnMobileDevice = !this._coverModeOnMobileDevice;

      if (this._coverModeOnMobileDevice) {
        cover.attr('mobile-active', '');
        info.attr('mobile-active', null);
      } else {
        cover.attr('mobile-active', null);
        info.attr('mobile-active', '');
      }
    });
  }

  private isAudioLoaded(): boolean {
    return isFinite(this._audio.duration);
  }

  private updateProgressBar(progress?: number): void {
    if (typeof progress === 'undefined') {
      progress = this._audio.currentTime / this._audio.duration;
    }
    this._progressBar.update(progress, this._audio.duration);
  }

  private updateLyric(force: boolean, time?: number): void {
    if (typeof time === 'undefined') {
      time = this._audio.currentTime;
    }
    this._lyric!.update(time, force);
  }

  public get isPlaying(): boolean {
    return !this._audio.paused;
  }

  public get currentTime(): number {
    return this._audio.currentTime;
  }

  public get currentMusicIndex(): number {
    if (!this._playlist) {
      return -1;
    }
    return this._playlist.playIndex;
  }

  public playCurrentMusic(time?: number): void {
    if (!this._audio.paused) {
      debugUtils.warning('can not play music because music has been being played');
      return;
    }

    if (typeof this._playlist === 'undefined') {
      debugUtils.error('can not play music because playlist has not been loaded');
      return;
    }

    if (this._playlist.musicCount === 0) {
      debugUtils.error('can not play music because there is no music in the playlist');
      return;
    }

    this._panel.panelElement.attr('playing', '');
    this._panel.openBtnElement.attr('playing', '');
    this._audio.play().then(() => {
      if (typeof time === 'number') {
        this._audio.currentTime = time;
      }
    });
  }

  public pauseCurrentMusic(): void {
    if (this._audio.paused) {
      debugUtils.warning('can not pause music because music has been paused');
      return;
    }

    this._panel.panelElement.attr('playing', null);
    this._panel.openBtnElement.attr('playing', null);
    this._audio.pause();
  }

  public playNextMusic(direction: SwitchDirection): void {
    if (typeof this._playlist === 'undefined') {
      debugUtils.error('can not play next music because playlist has not been loaded');
      return;
    }

    if (this._playlist.musicCount === 0) {
      debugUtils.error('can not play next music because there is no music in the playlist');
      return;
    }

    if (this._playModeController.playMode === 'loop-one') {
      this._audio.currentTime = 0;
      this.playCurrentMusic(0);
    } else {
      this._playlist.switchToNextMusic(
        direction,
        this._playModeController.playMode === 'random',
        true,
        true
      );
    }
  }

  public playSpecificMusic(index: number, time: number): void {
    if (typeof this._playlist === 'undefined') {
      debugUtils.error('can not play next music because playlist has not been loaded');
      return;
    }

    if (this._playlist.musicCount === 0) {
      debugUtils.error('can not play next music because there is no music in the playlist');
      return;
    }

    this._playlist.switchToSpecificMusic(index, time, true, true);
  }

  private async reloadMusicAsync(music: MusicInfo): Promise<void> {
    if (!this._audio.paused) {
      this.pauseCurrentMusic();
    }

    // 加载歌词
    this._lyric = await Lyric.downloadAsync(music.lrc);

    // 显示信息
    this._musicTitle.textContent = music.title;
    this._musicTitle.title = music.title;
    this._musicSubtitle.textContent = music.author;
    this._musicSubtitle.title = music.author;
    this._musicDisc.src = music.pic;
    this._audio.src = music.url;
    this._audio.currentTime = 0;
  }

  public downloadPlaylistAsync(musicLinks: string[]): Promise<Playlist> {
    return Playlist.downloadAsync(musicLinks, {
      switchMusic: async (music, time, playImmediately) => {
        await this.reloadMusicAsync(music);

        if (playImmediately) {
          this.playCurrentMusic(time);
        }
      }
    });
  }

  public setPlaylist(playlist: Playlist, playImmediately: boolean): void;
  public setPlaylist(playlist: Playlist, musicIndex: number, time: number): void;
  public setPlaylist(
    playlist: Playlist,
    playImmediatelyOrMusicIndex: boolean | number,
    time?: number
  ): void {
    this._playlist = playlist;

    playlist.updateWidgetView();

    if (playlist.musicCount === 0) {
      // 歌单里没歌曲时隐藏音乐按钮
      this._panel.openBtnElement.css('display', 'none');

      if (!this._audio.paused) {
        this.pauseCurrentMusic();
      }

      return;
    }

    // 歌单里有歌曲时显示音乐按钮
    this._panel.openBtnElement.css('display', null);

    if (typeof playImmediatelyOrMusicIndex === 'boolean') {
      // 歌单加载完成后，立刻加载一首歌
      playlist.switchToNextMusic(
        'forward',
        this._playModeController.playMode === 'random',
        playImmediatelyOrMusicIndex,
        true
      );
    } else {
      // 歌单加载完成后，立刻播放指定的歌
      playlist.switchToSpecificMusic(
        playImmediatelyOrMusicIndex,
        time!,
        true,
        true
      );
    }
  }
}


let musicPlayer: MusicPlayer;
let cancelAutoplayFunc: (() => void) | null = null;
let hasOverriddenPlaylist = false;
let defaultPlaylistTime = 0;
let defaultMusicIndex = -1;
let defaultPlaylistPlaying = false;

const component_bgMusic: IComponent = {
  name: 'background-music',

  async initialize(): Promise<boolean> {
    if (!configManager.siteConfig.bgMusic.enable) {
      return false;
    }

    musicPlayer = new MusicPlayer();
    const musicLinks = configManager.siteConfig.bgMusic.music_links;
    const playlist = await musicPlayer.downloadPlaylistAsync(musicLinks || []);
    musicPlayer.setPlaylist(playlist, false);
    return true;
  },

  cleanup(): void {
    if (!cancelAutoplayFunc) {
      return;
    }

    cancelAutoplayFunc(); // 不管是否自动播放过，都尝试取消
    cancelAutoplayFunc = null;
  },

  async refresh(): Promise<void> {
    // 从没 override 歌单的页面转到
    // case 1 原本就在播放音乐：先加载新歌单，等触发 autoplay 时切歌播放
    // case 2 原本不在播放音乐，设置了 autoplay：加载新歌单，等触发 autoplay 时切歌播放
    // case 3 原本不在播放音乐，未设置 autoplay：加载新歌单
    // 从 override 的界面转到
    // case 1 旧界面原本就在播放音乐：先加载新歌单，等触发 autoplay 时切歌继续播放
    // case 3 旧界面原本不在播放音乐：加载新歌单，暂停播放

    const musicElement = $('.bg-music-override');

    let time: number;
    let musicIndex: number;
    let autoplay: boolean;
    let musicLinks: string[];

    if (!musicElement && hasOverriddenPlaylist) {
      hasOverriddenPlaylist = false;

      time = defaultPlaylistTime;
      musicIndex = defaultMusicIndex;
      autoplay = defaultPlaylistPlaying;
      musicLinks = configManager.siteConfig.bgMusic.music_links || [];
    } else if (musicElement) {
      hasOverriddenPlaylist = true;
      defaultPlaylistTime = musicPlayer.currentTime;
      defaultMusicIndex = musicPlayer.currentMusicIndex;
      defaultPlaylistPlaying = musicPlayer.isPlaying;

      time = 0;
      musicIndex = -1;
      autoplay = musicPlayer.isPlaying || musicElement.hasAttribute('autoplay');
      musicLinks = JSON.parse(musicElement.attr('playlist') || '[]');
      debugUtils.info('override background music.');
    } else {
      return;
    }

    const playlist = await musicPlayer.downloadPlaylistAsync(musicLinks);

    if (autoplay) {
      cancelAutoplayFunc = musicUtils.autoplay(() => {
        if (musicIndex >= 0) {
          musicPlayer.setPlaylist(playlist, musicIndex, time);
        } else {
          musicPlayer.setPlaylist(playlist, true);
        }
        debugUtils.info('auto play background music.');
      });
    } else {
      // 根据上面的归纳，此处不需要对 musicIndex 分类讨论，因为它必是 -1
      musicPlayer.setPlaylist(playlist, false);
    }
  }
};

export default component_bgMusic;
