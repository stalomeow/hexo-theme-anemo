/**
 * 表示一个组件
 */
export interface IComponent {
  /**
   * 组件名称
   */
  readonly name: string;

  /**
   * 初始化组件（在第一次进入网站时调用）
   * @returns 如果希望启用该组件，请返回 `true`，否则返回 `false`
   */
  initialize(): Promise<boolean> | boolean;

  /**
   * 刷新组件（在网站页面刷新时调用，包括第一次进入网站）
   */
  refresh?(): Promise<void> | void;

  /**
   * 清理组件（在网页切换*前*调用）
   */
  cleanup?(): void;
}

/**
 * 评论信息
 */
export interface ICommentInfo {
  /**
   * 评论 ID
   */
  id: string;

  /**
   * 评论地址
   */
  url: string;

  /**
   * 昵称
   */
  nick: string;

  /**
   * 邮箱的 MD5 值，可用于展示头像
   */
  mailMd5: string;

  /**
   * 网址
   */
  link: string;

  /**
   * HTML 格式的评论内容
   */
  comment: string;

  /**
   * 纯文本格式的评论内容
   */
  commentText: string;

  /**
   * 评论时间，格式为毫秒级时间戳
   */
  created: number;

  /**
   * 头像地址
   */
  avatar?: string;

  /**
   * 相对评论时间，如 “1 小时前”
   */
  relativeTime?: string;
}

/**
 * 组件 API 名称和对应函数原型的映射
 */
export interface IComponentAPIMap {
  /**
   * 获取最新的评论
   * @param count
   * @param includeReply
   */
  latestComments: (
    this: IComponent,
    count: number,
    includeReply: boolean
  ) => Promise<ICommentInfo[]>;

  /**
   * 使指定的一系列图片可以被放大查看
   * @param images
   */
  imageViewer: (
    this: IComponent,
    images: ArrayLike<HTMLImageElement>
  ) => void;
}

/**
 * 表示组件 API 的调用结果
 */
export type ComponentAPIResult<T extends keyof IComponentAPIMap> = {
  success: true;
  value: ReturnType<IComponentAPIMap[T]>;
} | {
  success: false;
};