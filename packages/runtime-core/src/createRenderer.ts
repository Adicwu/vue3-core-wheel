import { effect } from "@avue/reactivity";
import { RederOptions } from "@avue/runtime-dom";
import { ShapeFlags } from "@avue/shared";
import { createAppAPI } from "./apiCreatApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { createVnode, isSameVnode, Text } from "./vnode";

export const createRenderer = (rederOptions: RederOptions) => {
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = rederOptions;

  const normalize = (children, i) => {
    if (typeof children[i] === "string") {
      const vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };
  const renderComponentRoot = (instance) => {
    const proxy = instance.proxy;
    const subTree = (instance.subTree = instance.render.call(proxy, proxy));
    return subTree;
  };
  const setupRenderEffect = (instance, container) => {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          patch(null, renderComponentRoot(instance), container);
          instance.isMounted = true;
        } else {
          const prevTree = instance.subTree;
          patch(prevTree, renderComponentRoot(instance), container);
        }
      },
      () => queueJob(instance.update)
    );
  };

  const mountChildren = (children, container) => {
    children.forEach((_, i) => {
      patch(null, normalize(children, i), container);
    });
  };
  const mountElement = (vnode, container, anchor = null) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  const mountComponent = (initVnode, container) => {
    const instance = (initVnode.component = createComponentInstance(initVnode));
    setupComponent(instance);
    setupRenderEffect(instance, container);
  };

  const unmountChildren = (c) => {
    c.forEach((item) => {
      unmount(item);
    });
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
      //
    }
  };
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processElement = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0,
      e1 = c1.length - 1,
      e2 = c2.length - 1;

    // 同头向尾
    while (i <= e1 && i <= e2) {
      const n1 = c1[i],
        n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }

    // 同尾向头
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1],
        n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    if (i > e1) {
      if (i <= e2) {
        // 前后插入
        while (i <= e2) {
          const nextPos = e2 + 1,
            anchor = nextPos < c2.length ? c2[nextPos].el : null; // 判断其后面有没有内容，如果有 为前插，反之 为后插
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        // 前后删除
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }

    // 乱序
    let s1 = i,
      s2 = i;
    const keyMap = new Map();
    for (let i = s2; i <= e2; i++) {
      keyMap.set(c2[i].key, i);
    }
    const toBePatched = e2 - s2 + 1;
    const n2oIndexMap = new Array(toBePatched).fill(0);
    for (let i = s1; i <= e1; i++) {
      const old = c1[i];
      const newI = keyMap.get(old.key);
      if (typeof newI === "undefined") {
        unmount(old);
      } else {
        n2oIndexMap[newI - s2] = i + 1;
        patch(old, c2[newI], el);
      }
    }

    // https://www.bilibili.com/video/BV1m64y1B75J?p=2&vd_source=c5594576f1a683147cded7c857af2b39
    // 最长序列优化

    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2,
        current = c2[index],
        anchor = index + 1 < c2.length ? c2[index + 1].el : null;
      if (n2oIndexMap[i] === 0) {
        patch(null, current, el, anchor);
      } else {
        // console.log(current.el, el, anchor);
        hostInsert(current.el, el, anchor);
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children,
      c2 = n2.children,
      prevShapFlag = n1.shapeFlag,
      shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 之前是文本 现在是数组
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        // 之前和现在都是文本
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 之前和现在都是数组 diff
          // console.log("diff");
          patchKeyedChildren(c1, c2, el);
        } else {
          // 之前是数组 现在是空
          unmountChildren(c1);
        }
      } else {
        if (prevShapFlag & ShapeFlags.TEXT_CHILDREN) {
          // 之前是文本 现在是空
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 之前是文本 现在是数组
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;

    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    switch (n2.type) {
      case Text: {
        processText(n1, n2, container);
        break;
      }
      default: {
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (n2.shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container);
        }
      }
    }
  };

  const render = (vnode, container) => {
    if (vnode == null) {
      container._vnode && unmount(container._vnode);
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
};
