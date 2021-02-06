let idCounter = 1
export type Id = number
export type TodoItem = {
    name: string
    id: Id
    completed: boolean
}
// The domain object constructor
export function todoItem(
    name: string,
    id: number = idCounter++,
    completed: boolean = false
): TodoItem {
    return {
        name,
        completed,
        id,
    }
}
