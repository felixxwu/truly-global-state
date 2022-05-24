# Truly Global State for React

A pub/sub-based global state management library for React with almost no boilerplate code and access to state from anywhere.

```bash
npm install truly-global-state # or yarn add truly-global-state
```

## Create the store

Configure your store using a simple object, with initial values for all store keys. Actions can also be defined, these are just functions in the object where you can use `this` to modify the state. If you are using [arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) you will have to use `store.state` instead, as your function will not have access to the correct `this`

```jsx
// store.ts

import { createStore } from "truly-global-state"

export const store = createStore({
    count: 0,
    // actions are just normal functions
    double() {
        this.count *= 2
    },
    // or with arrow function expressions:
    triple: () => {
        store.state.count *= 3
    }
})
```

## Use in your React components

Components that read from the store will need to subscribe to it. Every time the value changes, subscribed components will re-render themselves along with all their children. Use the `subscribeTo(keys: string[])` method to listen to changes for specific keys in the store, or use the `subscribeToAll()` method to update whenever anything changes.

```jsx
// DisplayCount.tsx

import { store } from "./store"

export function DisplayCount() {
    store.subscribeTo(['count'])
    
    return (
        <div>
            Count: {store.state.count}
        </div>
    )
}
```

A quick and dirty way to get started for small projects would be to use `subscribeToAll` on your root-level component, this way you won't have to worry about subscribing each component separately. However, beware that as your app grows this could cause performance issues, since everything re-renders every time anything is changed.

```jsx
// App.tsx

import { store } from "./store"
import { Buttons } from "./Buttons.tsx"
import { DisplayCount } from "./DisplayCount.tsx"

export function App() {
    store.subscribeToAll()

    return (
        <>
            <Buttons />
            <DisplayCount />
        </>
    )
}

```

Components that write to the store don't need to be subscribed to it (unless they also read from it!), this means that the component will not be re-rendered when store values are changed.

To change a store value, just set it!

To submit an action, just call it!

```jsx
// Buttons.tsx

import { store } from "./store"

export function Buttons() {
    return (
        <>
            <button onClick={() => store.state.count += 1}>
                increment
            </button>
            <button onClick={() => store.state.double()}>
                double
            </button>
        </>
    )
}
```

## Use in your functions!

Because the store has been exposed globally, you can use it in functions that don't qualify as React components. (Something you can't do with hooks!)

```jsx
// increaseBy5.ts

import { store } from "./store"

export function increaseBy5() {
    store.state.count += 5
}
```

## Fully type safe

Typescript will give you correct type annotations for all store values, or shout at you if you mispell one of the store keys.

```jsx
const count = store.state.count // count: number
```

```jsx
// Property 'cont' does not exist on type '{ count: number; double: () => void; }'. Did you mean 'count'?
const count = store.state.cont
```

When subscribing a component, typescript will also check your store keys.

```jsx
// Type '"cont"' is not assignable to type '"count" | "double"'. Did you mean '"count"'?
store.subscribeTo(['cont'])
```

## Reactivity for deeply nested state and arrays

Updates to the children of store values are automatically detected.

```jsx
// store.ts

export const store = defineStore({
    array1: [1, 2, 3],
    array2: [[5, 6], [7, 8]],
    deeply: {
        nested: {
            object: 'change me!'
        }
    },
})
```

```jsx
// udpateComplexValues.ts

export function udpateComplexValues() {
    store.state.array1.push(4)
    store.state.array2[0][0] = 10
    store.state.deeply.nested.object = 'changed!'
}
```

## Built-in localStorage support

Specify an array of key names for all the store values you want to save into localStorage. When the user comes back in a new session, saved values will be restored.

```jsx
// store.ts

import { createStore } from "truly-global-state"

export const store = createStore(
    {
        count: 0,
        double() {
            this.count *= 2
        },
    },
    {
        // count will be saved in localStorage every time it is updated
        localStorage: {
            keys: ['count']
            localStoragePrefix: 'prefix-', // optional: prepend a string to the localStorage key name, useful if there could be collisions with existing key names in your app
        }
    }
)
```

## Built-in undo/redo support

Specify an array of key names for all the store values you want to save into the history. Call `store.saveHistory()` whenever you want to add the current state to the history stack. Call `store.undo()` or `store.redo()` to undo/redo, and call `store.canUndo()` or `store.canRedo()` to give user feedback about the history.

```jsx
// store.ts

import { createStore } from "truly-global-state"

export const store = createStore(
    {
        count: 0,
        double() {
            this.count *= 2
        },
    },
    {
        localStorage: { keys: ['count'] }
        // count will be added to the history whenever store.saveHistory() is called
        undoRedo: {
            keys: ['count'],
            useLocalStorage: true, // optional (default = false): save the history stack to localStorage
            localStorageKey: 'myHistory', // optional (default = 'history'): specify the localStorage key in case you are already using 'history' for something
            maxLength: 10, // optional (default = unlimited): specify how many times the user can undo
        }
    }
)
```
