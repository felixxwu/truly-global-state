import { HistoryConfig, Store } from './types'

type History<T> = {
    position: number
    states: Partial<T>[]
}

const defaultKey = 'history'
const emptyHistory = {
    position: 0,
    states: [],
}
let nonPermanentHistory: any

function getCurrentState<Config>(store: Store<Config>, historyConfig?: HistoryConfig<Config>) {
    const state: Partial<Config> = {}
    for (const key in store.state) {
        if (historyConfig && historyConfig?.keys.includes(key)) {
            // store key should be saved to history
            state[key] = store.state[key]
        }
    }
    return state
}

export function saveHistory<Config>(store: Store<Config>, historyConfig: HistoryConfig<Config>) {
    const history = getOrInitHistory<Config>(historyConfig)
    history.states = history.states.slice(0, history.position + 1)
    history.states.push(getCurrentState(store, historyConfig))
    if (historyConfig?.maxLength && historyConfig.maxLength < history.states.length) {
        history.states.shift() // remove first element
    }
    history.position = history.states.length - 1
    setHistory(historyConfig, history)
}

export function canUndo<Config>(historyConfig: HistoryConfig<Config>, history = getOrInitHistory(historyConfig)) {
    return history.position > 0
}

export function canRedo<Config>(historyConfig: HistoryConfig<Config>, history = getOrInitHistory(historyConfig)) {
    return history.position < history.states.length - 1
}

export function undo<Config>(store: Store<Config>, historyConfig: HistoryConfig<Config>) {
    const history = getOrInitHistory(historyConfig)
    if (canUndo(historyConfig, history)) history.position--
    setHistory(historyConfig, history)
    loadHistory(store, historyConfig)
}

export function redo<Config>(store: Store<Config>, historyConfig: HistoryConfig<Config>) {
    const history = getOrInitHistory(historyConfig)
    if (canRedo(historyConfig, history)) history.position++
    setHistory(historyConfig, history)
    loadHistory(store, historyConfig)
}

export function initHistory<Config>(store: Store<Config>, historyConfig: HistoryConfig<Config>) {
    const history = getOrInitHistory(historyConfig)
    if (history.states.length <= 0) {
        saveHistory(store, historyConfig)
    } else {
        loadHistory(store, historyConfig)
    }
}

function loadHistory<Config>(store: Store<Config>, historyConfig: HistoryConfig<Config>) {
    const history = getOrInitHistory<Config>(historyConfig)
    if (history.states.length <= 0) return
    const state = history.states[history.position]
    for (const key in state) {
        store.state[key] = state[key]!
    }
}

function setHistory<Config>(historyConfig: HistoryConfig<Config>, history: History<Config>) {
    if (historyConfig.useLocalStorage) {
        localStorage.setItem(historyConfig.localStorageKey ?? defaultKey, JSON.stringify(history))
    } else {
        nonPermanentHistory = history
    }
}

function getOrInitHistory<Config>(historyConfig: HistoryConfig<Config>) {
    if (historyConfig.useLocalStorage) {
        const string = localStorage.getItem(historyConfig.localStorageKey ?? defaultKey)
        if (string === null) return emptyHistory
        return JSON.parse(string) as History<Config>
    } else {
        if (nonPermanentHistory) {
            return nonPermanentHistory as History<Config>
        } else {
            return emptyHistory
        }
    }
}
