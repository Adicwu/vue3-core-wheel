import { Dep, trackEffect, triggerEffect } from "./effect";
import { isReactive, reactive } from "./reactive";

function toReactive(v) {
  return isReactive(v) ? reactive(v) : v;
}
class RefImpl {
  private _value;
  private dep: Dep = new Set();
  public _v_isRef = true;

  constructor(private rawV) {
    this._value = toReactive(rawV);
  }
  get value() {
    trackEffect(this.dep);
    return this._value;
  }
  set value(newV) {
    if (newV !== this.rawV) {
      this._value = toReactive(newV);
      this.rawV = newV;
      triggerEffect(this.dep);
    }
  }
}
class ObjectRefImpl {
  constructor(private obj, private k) {
    //
  }
  get value() {
    return this.obj[this.k];
  }
  set value(newV) {
    this.obj[this.k] = newV;
  }
}

export function ref<T>(v: T) {
  return new RefImpl(v);
}

export function toRef(obj, k) {
  return new ObjectRefImpl(obj, k);
}

export function toRefs<T>(obj: T) {
  return Object.keys(obj).reduce((totol, k) => {
    totol[k] = toRef(obj, k);
    return totol;
  }, {});
}
