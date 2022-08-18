import { ComponentAPIResult, IComponent, IComponentAPIMap } from '../component';
import debugUtils from '../utils/debugUtils';

const componentAPIMap = new Map<string, CallableFunction>();
const componentList: IComponent[] = [];

/**
 * 组件管理
 */
export default {
  /**
   * 异步注册数个组件
   * @param components 组件对象
   * @returns 传入的组件对象
   */
  async registerComponentsAsync(...components: IComponent[]): Promise<void> {
    for (const component of components) {
      let result: boolean | Promise<boolean>;

      try {
        // 依次初始化，保证顺序
        result = component.initialize();

        if (typeof result !== 'boolean') {
          result = await result;
        }
      } catch (e) {
        debugUtils.error(`failed to initialize and register component '${component.name}'!`, e);
        continue;
      }

      if (!result) {
        debugUtils.warning(`component '${component.name}' is not registered because it is disabled!`);
        continue;
      }

      debugUtils.info(`register component '${component.name}'.`);
      componentList.push(component);
    }
  },

  /**
   * 异步刷新所有组件
   */
  async refreshAllComponentsAsync(): Promise<void> {
    for (const component of componentList) {
      if (!component.refresh) {
        continue;
      }

      try {
        // 依次刷新，保证顺序
        const result = component.refresh();
        result && await result; // 如果是异步任务，则等待完成
        debugUtils.info(`refresh component '${component.name}'.`);
      } catch (e) {
        debugUtils.error(`failed to refresh component '${component.name}'!`, e);
      }
    }
  },

  /**
   * 清理所有组件（注：不是移除所有组件）
   */
  cleanupAllComponents(): void {
    for (const component of componentList) {
      if (!component.cleanup) {
        continue;
      }

      try {
        component.cleanup();
        debugUtils.info(`cleanup component '${component.name}'.`);
      } catch (e) {
        debugUtils.error(`failed to cleanup component '${component.name}'!`, e);
      }
    }
  },

  /**
   * 注册一个组件 API
   * @param thisObj 组件对象
   * @param componentAPIName API 名称
   * @param componentAPIFunc API 函数
   */
  registerAPI<T extends keyof IComponentAPIMap>(
    thisObj: IComponent,
    componentAPIName: T,
    componentAPIFunc: IComponentAPIMap[T]
  ): void {
    // --------------------------------------
    // 如此设计的目的是避免组件与组件之间直接耦合
    // --------------------------------------

    const func = componentAPIFunc.bind(thisObj); // 绑定 component

    if (componentAPIMap.has(componentAPIName)) {
      debugUtils.warning(`component '${thisObj.name}' overrides api '${componentAPIName}'!`);
    } else {
      debugUtils.info(`component '${thisObj.name}' registers api '${componentAPIName}'.`);
    }

    componentAPIMap.set(componentAPIName, func);
  },

  /**
   * 调用一个组件 API
   * @param componentAPIName API 名称
   * @param args API 参数
   * @returns API 调用结果
   */
  invokeAPI<T extends keyof IComponentAPIMap>(
    componentAPIName: T,
    ...args: Parameters<IComponentAPIMap[T]>
  ): ComponentAPIResult<T> {
    // --------------------------------------
    // 如此设计的目的是避免组件与组件之间直接耦合
    // --------------------------------------

    const func = componentAPIMap.get(componentAPIName);

    // try invoking the function
    return func ? {
      success: true,
      value: func(...args)
    } : {
      success: false
    };
  }
};
