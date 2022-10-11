import { isObject } from "@avue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

function travelsal<T>(v: T, set = new Set()) {
  if (!isObject(v) || set.has(v)) return v;
  set.add(v);
  Object.keys(v).forEach((k) => {
    travelsal(v[k], set);
  });
  return v;
}

type OnCleanup = (e: () => void) => void;
export function watch(source, cb: (n, o, onCleanup?: OnCleanup) => void) {
  let getter = !isReactive(source) ? source : () => travelsal(source);
  let oldV;

  let cleanup: () => void;
  /** 上一次watch触发结束与下一次watch触发执行时 执行的回调 */
  const onCleanup: OnCleanup = (cb) => {
    cleanup = cb;
  };

  const effect = new ReactiveEffect(getter, () => {
    cleanup && cleanup();
    const newV = effect.run();
    cb(newV, oldV, onCleanup);
    oldV = newV;
  });
  oldV = effect.run();
}
