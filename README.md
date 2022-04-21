# Truly Global State for React

A global state management library for React with almost no boilerplate code and access to state from anywhere.

```bash
npm install truly-global-state # or yarn add truly-global-state
```

## Define your store

Configure your store using a simple object, with initial values for all keys. Actions can also be defined, these are just functions in the object where you can use `this` to modify the state. If you are using [arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) you will have to use `store.state` instead, as your function will not have access to the correct `this`

```jsx
// store.ts

import { defineStore } from "truly-global-state"

export const store = defineStore({
    count: 0,
    double() {
        this.count *= 2
    },
    // or with arrow function expressions:
    double: () => {
        store.state.count *= 2
    }
})
```

## Initialise the store

Initialise the store in your top-level component, so that all of its children can update when the store changes.

```jsx
// App.tsx

import { store } from "./store"
import { Buttons } from "./Buttons.tsx"
import { DisplayCount } from "./DisplayCount.tsx"

export function App() {
    store.init()

    // child components don't need to be passed the store
    return (
        <>
            <Buttons />
            <DisplayCount />
        </>
    )
}

```

## Use in your React components

Simply import your store and start using it in your components, no need for hooks!

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

```jsx
// DisplayCount.tsx

import { store } from "./store"

export function DisplayCount() {
    return (
        <div>
            Count: {store.state.count}
        </div>
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

Typescript will shout at you if you mispell one of the store keys.
```jsx
// Property 'cont' does not exist on type '{ count: number; double: () => void; }'. Did you mean 'count'?
const count = store.state.cont
```
