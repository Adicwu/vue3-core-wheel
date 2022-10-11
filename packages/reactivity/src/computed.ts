import { isFunction } from "@avue/shared";
import { ReactiveEffect, trackEffect, Dep, triggerEffect } from "./effect";

type Getter = <T>() => T;
type Setter = <T>(e: T) => void;
// type ComputedOp<T> = T extends Function
//   ? Getter
//   : {
//       set?: Setter;
//       get: Getter;
//     };

class ComputedRefImpl<T> {
  private effect: ReactiveEffect;
  private _dirty = true;
  public _v_isReadonly = true;
  public _v_isRef = true;
  private _value;
  private dep: Dep = new Set();
  constructor(private getter: Getter, private setter: Setter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerEffect(this.dep);
      }
    });
  }
  get value() {
    trackEffect(this.dep);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(e) {
    this.setter(e);
  }
}

export function computed(getterOrOptions: any) {
  const onlyGet = isFunction(getterOrOptions);
  let getter, setter;
  if (onlyGet) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("without set");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
