import * as B from "baconjs"

export const valueMissing = {}
export type ValueMissing = typeof valueMissing

export function getCurrentValue<A>(observable: B.Property<A>): A {
    let currentV: any = valueMissing;
    if ((observable as any).get) {
      currentV = (observable as any).get(); // For Atoms
    } else {   
      const unsub = observable.subscribeInternal(e => {
          if (B.hasValue(e)) {
              currentV = e.value;
          }
      })       
      unsub();
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }      
    return currentV;
  };

export function reportValueMissing(observable: B.Observable<any>): never {
    console.log("Current value not found!", observable);
    throw new Error("Current value missing. Cannot render. " + observable);                        
}