import {useState} from "react"

const proxyObject = {} as any
const subscribers = {} as any
const storeNotInitialised = 'Store was not initialised before use! Make sure to call store.init() in your top-level component.'

function constructNewObject(target: any, key: any, value: any) {
    if (Array.isArray(target)) {
        const newObject = target.slice()
        newObject[key] = value
        return newObject
    } else {
        return { ...target, [key]: value }
    }
}

function reactiveObject<T>(object: T, setter: (object: T) => void): T {
    if (typeof object === 'object' && object !== null) {
        return new Proxy(object as any, {
            get(_, key) {
                return reactiveObject(
                    (object as any)[key],
                    (value: any) => {
                        const newObject = constructNewObject(object, key, value)
                        object = newObject
                        setter(newObject)
                    }
                )
            },
            set(_, key, value) {
                const newObject = constructNewObject(object, key, value)
                object = newObject
                setter(newObject)
                return true
            }
        }) as T
    } else {
        return object
    }
}

export function createStore<Config, K extends (keyof Config)[]>(config: Config) {
    for (const key of <K>Object.keys(config)) {
        const initValue = config[key]
        subscribers[key] = []
        if (typeof initValue === 'function') {
            proxyObject[key] = { get: initValue, set: () => {} }
        } else {
            const setValue = (v: Config[keyof Config]) => {
                proxyObject[key].get = v
                for (const updateFunction of subscribers[key]) {
                    updateFunction((count: number) => count + 1)
                }
            }
            proxyObject[key] = { get: initValue, set: setValue }
        }
    }
    
    return {
        subscribeTo(keys: K) {
            for (const key of keys) {
                const [_, setCount] = useState(0)
                if (!subscribers[key].includes(setCount)) {
                    subscribers[key].push(setCount)
                }
            }
        },
        subscribeToAll() {
            this.subscribeTo(<K>Object.keys(config))
        },
        state: new Proxy<{[key in K[number]]: Config[key]}>(config, {
            get(_, key: string) {
                const storeValue = proxyObject[<K[number]>key]
                if (storeValue === undefined) throw new Error(`${storeNotInitialised} (Trying to get ${key})`)
                return reactiveObject(storeValue.get, storeValue.set)
            },
            set(_, key: string, value) {
                const storeValue = proxyObject[<K[number]>key]
                if (storeValue === undefined) throw new Error(`${storeNotInitialised} (Trying to set ${key})`)
                proxyObject[<K[number]>key].set(value)
                return true
            },
        })
    }
}
