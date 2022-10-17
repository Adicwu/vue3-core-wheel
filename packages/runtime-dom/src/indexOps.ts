export const nodeOps = {
  insert(child: HTMLElement | Text, parent: HTMLElement | Text, anchor = null) {
    parent.insertBefore(child, anchor);
  },
  remove(child: HTMLElement) {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },
  setElementText(el: HTMLElement, text: string) {
    el.textContent = text;
  },
  setText(node: HTMLElement, text: string) {
    node.nodeValue = text;
  },
  querySelector(selector: string) {
    return document.querySelector(selector);
  },
  parentNode(node: HTMLElement) {
    return node.parentNode;
  },
  nextSibling(node: HTMLElement) {
    return node.nextSibling;
  },
  createElement(tag: string) {
    return document.createElement(tag);
  },
  createText(txt: string) {
    return document.createTextNode(txt);
  },
};
