import { useState } from 'react'
import { canRedo, canUndo, initHistory, redo, saveHistory, undo } from './history'
import { getFromLocalStorage, saveToLocalStorage } from './storage'
import { HistoryConfig, StorageConfig, Store } from './types'

const proxyObject = {} as any
const subscribers = {} as any
const storeNotInitialised =
    'Store was not initialised before use! Make sure to call store.init() in your top-level component.'
const historyNotInialised =
    'Undo/redo features were used without enabling them, please configure the store to use these features.'

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
                return reactiveObject((object as any)[key], (value: any) => {
                    const newObject = constructNewObject(object, key, value)
                    object = newObject
                    setter(newObject)
                })
            },
            set(_, key, value) {
                const newObject = constructNewObject(object, key, value)
                object = newObject
                setter(newObject)
                return true
            },
        }) as T
    } else {
        return object
    }
}

export function createStore<Config, K extends (keyof Config)[]>(
    config: Config,
    features?: {
        localStorage?: StorageConfig<Config>
        undoRedo?: HistoryConfig<Config>
    }
) {
    for (const key of <K>Object.keys(config)) {
        const initValue = getFromLocalStorage(key, config[key], features?.localStorage)
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

    const store: Store<Config> = {
        state: new Proxy<{ [key in K[number]]: Config[key] }>(config, {
            get(_, key: string) {
                const storeValue = proxyObject[<K[number]>key]
                if (storeValue === undefined) throw new Error(`${storeNotInitialised} (Trying to get ${key})`)
                return reactiveObject(storeValue.get, storeValue.set)
            },
            set(_, key: string, value) {
                const storeValue = proxyObject[<K[number]>key]
                if (storeValue === undefined) throw new Error(`${storeNotInitialised} (Trying to set ${key})`)
                proxyObject[<K[number]>key].set(value)
                if (features?.localStorage) saveToLocalStorage(key as keyof Config, value, features?.localStorage)
                return true
            },
        }),
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
        saveHistory() {
            if (features?.undoRedo) {
                saveHistory(store, features?.undoRedo)
            } else {
                console.error(historyNotInialised)
            }
        },
        undo() {
            if (features?.undoRedo) {
                undo(store, features?.undoRedo)
            } else {
                console.error(historyNotInialised)
            }
        },
        redo() {
            if (features?.undoRedo) {
                redo(store, features?.undoRedo)
            } else {
                console.error(historyNotInialised)
            }
        },
        canUndo() {
            if (features?.undoRedo) {
                return canUndo(features?.undoRedo)
            } else {
                console.error(historyNotInialised)
                return false
            }
        },
        canRedo() {
            if (features?.undoRedo) {
                return canRedo(features?.undoRedo)
            } else {
                console.error(historyNotInialised)
                return false
            }
        },
    }

    if (features?.undoRedo) {
        initHistory(store, features?.undoRedo)
    }

    return store
}
