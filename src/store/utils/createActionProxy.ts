export const createActionProxy = <T extends object>(actions: object[]): T =>
  new Proxy({} as T, {
    get: (_target, prop) => {
      for (const action of actions) {
        if (prop in action) {
          const value = (action as any)[prop];
          return typeof value === 'function' ? value.bind(action) : value;
        }
      }
      return undefined;
    },
    getOwnPropertyDescriptor: (_target, prop) => {
      for (const action of actions) {
        const ownDescriptor = Object.getOwnPropertyDescriptor(action, prop);
        if (ownDescriptor) return ownDescriptor;
        if (prop in action) {
          let proto = Object.getPrototypeOf(action);
          while (proto && proto !== Object.prototype) {
            const protoDescriptor = Object.getOwnPropertyDescriptor(proto, prop);
            if (protoDescriptor) {
              return {
                ...protoDescriptor,
                configurable: true,
                enumerable: true,
              };
            }
            proto = Object.getPrototypeOf(proto);
          }
        }
        if (prop in action) {
          return {
            configurable: true,
            enumerable: true,
            value: (action as any)[prop],
            writable: false,
          };
        }
      }
      return undefined;
    },
    has: (_target, prop) => actions.some((action) => prop in action),
    ownKeys: () => {
      const keys = new Set<string | symbol>();
      for (const action of actions) {
        let current: object | null = action;
        while (current && current !== Object.prototype) {
          for (const key of Reflect.ownKeys(current)) {
            if (key !== 'constructor') keys.add(key);
          }
          current = Object.getPrototypeOf(current);
        }
      }
      return [...keys];
    },
  });
