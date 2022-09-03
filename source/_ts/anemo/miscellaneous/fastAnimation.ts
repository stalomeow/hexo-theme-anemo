import anemoUtils from '../utils/anemoUtils';

export type FastAnimationTransition = keyof typeof anemoUtils.timingFunctions;
export type FastAnimationTimingFunc = (a: number, b: number) => number;

export interface FastAnimationKeyframe<T> {
  progress: number;
  value: T;
}

export interface FastAnimationData<T> {
  keyframes: FastAnimationKeyframe<T>[];
  transitions: FastAnimationTransition[];
  delay: number;
  time: number;
}

export default class FastAnimation<T> {
  private _keyframes: FastAnimationKeyframe<T>[];
  private _transitions: FastAnimationTransition[];
  private _delay: number;
  private _time: number;

  public constructor(data: FastAnimationData<T>) {
    this._keyframes = data.keyframes;
    this._transitions = data.transitions;
    this._delay = data.delay;
    this._time = data.time;
  }

  public get delay(): number {
    return this._delay;
  }

  public get time(): number {
    return this._time;
  }

  public update(
    progress: number,
    interpolate: (a: T, b: T, timing: FastAnimationTimingFunc) => T
  ): T {
    let start: FastAnimationKeyframe<T> | null = null;
    let end: FastAnimationKeyframe<T> | null = null;
    let transition: FastAnimationTransition | null = null;

    // find keyframe
    for (let i = this._keyframes.length - 1; i >= 0; i--) {
      const frame = this._keyframes[i];

      if (frame.progress <= progress) {
        start = frame;

        if (i === this._keyframes.length - 1) {
          end = frame;
          progress = 1;
        } else {
          end = this._keyframes[i + 1];
          transition = this._transitions[i];
          progress = (progress - start.progress) / (end.progress - start.progress);
        }

        break;
      }
    }

    if (!start || !end) {
      throw new Error('can not find keyframe.');
    }

    if (transition) {
      const timing = anemoUtils.timingFunctions[transition].bind(null, progress);
      return interpolate(start.value, end.value, timing);
    }

    return end.value;
  }
}