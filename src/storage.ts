import { StorageConfig } from "./types"

export function saveToLocalStorage<Config>(
    key: keyof Config,
    value: any,
    storageConfig: StorageConfig<Config>
) {
    if (storageConfig.keys.includes(key)) {
        localStorage.setItem((storageConfig.localStoragePrefix ?? '') + key, JSON.stringify(value))
    }
}

export function getFromLocalStorage<Config>(
    key: keyof Config,
    init: any,
    storageConfig?: StorageConfig<Config>
) {
    if (!storageConfig) return init
    if (storageConfig.keys.includes(key)) {
        const valueString = localStorage.getItem((storageConfig.localStoragePrefix ?? '') + key)
        if (valueString !== null) {
            return JSON.parse(valueString)
        }
    }
    return init
}