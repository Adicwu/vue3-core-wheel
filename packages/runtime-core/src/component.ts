import { isFunction, isObject, ShapeFlags } from "@avue/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    props: {},
    attrs: {},
    slots: {},
    setupState: {},
    ctx: null,
    isMounted: false,
  };
  instance.ctx = { _: instance };
  return instance;
}
export function setupComponent(instance) {
  const { props, children } = instance.vnode;

  instance.props = props;
  instance.children = children;

  const isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (isStateful) {
    setupStatefulComponent(instance);
  }
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  const Component = instance.type;
  const { setup } = Component;

  if (setup) {
    const setupCtx = createSetupContext(instance);
    const setupResult = setup(instance.props, setupCtx);
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  let Component = instance.type;

  if (!instance.render) {
    if (!Component.render && Component.template) {
      // 模板处理
    }
    instance.render = Component.render;
  }
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    props: instance.props,
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  };
}
