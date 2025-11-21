---
title: Using Optics for UI in Frontend Development
description: Some thoughts about using optics and lenses from functional programming in Preact applications.
tags: ['webdev', 'lang-en']
publish_date: 2025/11/20
draft: true
---

**Outline.** First an introduction to optics and lenses from functional programming with some reference videos and articles, then a discussion on how easily they can be implemented in JS and TS and finally a discussion on how they can be used in (P)react applications as an alternative to state management libraries Immer, Zustand, Jotai, etc.

The final goal of this post is to go from the following:

```tsx
const TodoApp = () => {
    const [todos, setTodos] = useState<Todo[]>([])

    return (
        <div class="todo-app">
            <div class="add-todo">
                <input
                    type="text"
                    placeholder="What needs to be done?"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            setTodos(todos => [
                                ...todos,
                                {
                                    text: e.currentTarget.value,
                                    completed: false,
                                },
                            ])
                            e.currentTarget.value = ''
                        }
                    }}
                />
            </div>
            <ul class="todo-list">
                {todos.map((todo, index) => (
                    <li
                        class={todo.completed ? 'completed' : ''}
                        onClick={() =>
                            setTodos(
                                todos.map((todo, i) =>
                                    i === index
                                        ? {
                                              ...todo,
                                              completed: !todo.completed,
                                          }
                                        : todo,
                                ),
                            )
                        }
                    >
                        {todo.text}
                    </li>
                ))}
            </ul>
        </div>
    )
}
```

to a more optics/lens based approach:

```tsx
const TodoApp = () => {
    const [todos, todosOptic] = useOpticState<Todo[]>([])

    return (
        <div class="todo-app">
            <div class="add-todo">
                <input
                    type="text"
                    placeholder="What needs to be done?"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            todosOptic.set(arrayEnd, {
                                text: e.currentTarget.value,
                                completed: false,
                            })
                            e.currentTarget.value = ''
                        }
                    }}
                />
            </div>
            <ul class="todo-list">
                {todosOptic.items().map(([todo, todoOptic], index) => (
                    <li
                        class={todo.completed ? 'completed' : ''}
                        onClick={() => todoOptic.update(objectProps.completed, c => !c)}
                    >
                        {todo.text}
                    </li>
                ))}
            </ul>
        </div>
    )
}
```
