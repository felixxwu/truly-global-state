import {useState} from "react"

const proxyObj = {} as any
const storeNotInitialised = 'Store was not initialised before use! Make sure to call store.init() in your top-level component.'

export function defineStore<Config, K extends (keyof Config)[]>(config: Config) {
    return {
        init() {
            for (const key of <K>Object.keys(config)) {
                const [value, setValue] = useState(config[key])
                proxyObj[key] = { get: value, set: setValue }
            }
        },
        state: new Proxy<{[key in K[number]]: Config[key]}>(config, {
            get(_, key: string) {
                try {
                    return proxyObj[<K[number]>key].get
                } catch (e) {
                    console.error(storeNotInitialised, `(Trying to get ${key})`)
                }
            },
            set(_, key: string, value) {
                try {
                    proxyObj[<K[number]>key].set(value)
                } catch (e) {
                    console.error(storeNotInitialised, `(Trying to set ${key})`)
                }
                return true
            },
        })
    }
}
