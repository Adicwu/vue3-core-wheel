export type Dep = Set<ReactiveEffect>;
type Scheduler = () => void;

let activeEffect: ReactiveEffect | null = null;
let uid = 0;
/**
 * 响应式对象集合总表
 * 对象集合->对象属性集合->对象属性的ReactiveEffect集合
 */
const targetMap: WeakMap<object, Map<string | symbol, Dep>> = new WeakMap();

/**
 * 依赖清除
 * @param effect
 */
function clearEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

export class ReactiveEffect {
  private active = true;
  public deps: Dep[] = [];
  public id;
  /**
   * 收集父级ReactiveEffect实例
   * 用于多effect嵌套的问题，因为执行是内向外的，所以在向外执行时需要知道他自己的ReactiveEffect
   */
  private parent: ReactiveEffect | null = null;
  constructor(private fn: () => void, public scheduler?: Scheduler) {}

  public addDep(dep: Dep) {
    this.deps.push(dep);
  }
  public run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      // clearEffect(this); // 暂时的
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  public stop() {
    if (this.active) {
      this.active = false;
      clearEffect(this);
    }
  }
}

export function effect(
  cb: () => void,
  scheduler?: Scheduler
): () => {
  effect: ReactiveEffect;
} {
  const _effect = new ReactiveEffect(cb, scheduler);
  _effect.id = uid++;
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function trackEffect(dep: Dep) {
  if (!activeEffect) return;
  if (!dep.has(activeEffect)) {
    // 将事件放入 属性对应的事件集
    dep.add(activeEffect);
    activeEffect.addDep(dep);
  }
}
export function triggerEffect(effects: Dep) {
  [...effects].forEach((ef) => {
    if (ef === activeEffect) return;
    if (ef.scheduler) {
      ef.scheduler();
    } else {
      ef.run();
    }
  });
}

export function track<T extends object>(
  target: T,
  type: string,
  key: string | symbol
) {
  if (activeEffect) {
    // 判断并 创建/获取 属性对应的事件集
    const depsMap = targetMap.get(target) || new Map();
    targetMap.set(target, depsMap);

    const dep = depsMap.get(key) || new Set();
    depsMap.set(key, dep);
    trackEffect(dep);
  }
}
export function trigger<T extends object>(
  target: T,
  type: string,
  key: string | symbol
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (effects) {
    triggerEffect(effects);
  }
}
