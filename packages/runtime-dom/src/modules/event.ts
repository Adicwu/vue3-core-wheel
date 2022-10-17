type Invoker = ((...arg: any[]) => void) & {
  value: Invoker;
};

// 事件始终执行这个invoker，但invoker内部回去执行最新的绑定内容
export function createInvoker(cb: Invoker) {
  const invoker: Invoker = (e) => invoker.value(e);
  invoker.value = cb;
  return invoker;
}

// invoker事件缓存
export function patchEvent(
  el: HTMLElement & {
    _vei?: {
      [name: string]: Invoker;
    };
  },
  evtName: string,
  handler?: Invoker
) {
  const invokers = el._vei || (el._vei = {});
  const exits = invokers[evtName];
  if (exits && handler) {
    exits.value = handler;
  } else {
    const evt = evtName.slice(2).toLowerCase();
    if (handler) {
      const invoker = (invokers[evtName] = createInvoker(handler));
      el.addEventListener(evt, invoker);
    } else if (exits) {
      el.removeEventListener(evt, exits);
      invokers[evtName] = undefined;
    }
  }
}
