export function patchClass(el: HTMLElement, next: string) {
  if (next == null) {
    el.removeAttribute("class");
  } else {
    el.className = next;
  }
}
