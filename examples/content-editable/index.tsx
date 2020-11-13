import * as L from "lonna"
import { h, mount, ListView, componentScope } from "../../src/index"

export type EditableSpanProps = { 
    value: L.Atom<string>, 
    editingThis: L.Atom<boolean>, 
    showIcon?: boolean,
    commit?: () => void, 
    cancel?: () => void 
} & JSX.DetailedHTMLProps<JSX.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>

export const EditableSpan = ( props : EditableSpanProps) => {
    let { value, editingThis, commit, cancel, ...rest } = props    
    const nameElement = L.atom<HTMLSpanElement | null>(null)
    const onClick = (e: JSX.MouseEvent) => {
        if (e.shiftKey) return
        editingThis.set(true)
        e.preventDefault()
        e.stopPropagation()
    }  
    editingThis.pipe(L.changes, L.filter(e => !!e), L.applyScope(componentScope())).forEach(() =>  { 
        setTimeout(() => {
            nameElement.get()!.focus() 
            document.execCommand('selectAll',false)    
        }, 1)
    })

    const endEditing = () => {
        editingThis.set(false)
    }
    const onKeyPress = (e: JSX.KeyboardEvent) => {
        if (e.keyCode === 13){ 
            e.preventDefault(); 
            commit && commit()
            editingThis.set(false)
        } else if (e.keyCode === 27) { // esc           
           cancel && cancel()
           editingThis.set(false)
           nameElement.get()!.textContent = value.get()
        }
        e.stopPropagation() // To prevent propagating to higher handlers which, for instance prevent defaults for backspace
    }
    const onKey = (e: JSX.KeyboardEvent) => {
        e.stopPropagation() // To prevent propagating to higher handlers which, for instance prevent defaults for backspace
    }
    const onInput = (e: JSX.InputEvent<HTMLSpanElement>) => {
        value.set(e.currentTarget!.textContent || "")
    }    

    return <span 
        onClick={onClick} 
        style={{ cursor: "pointer" }}
        {...rest }
    >
        { !!props.showIcon && <span className="icon edit" style={{ marginRight: "0.3em", fontSize: "0.8em" }}/> }
        <span 
            onBlur={endEditing}
            contentEditable={editingThis} 
            ref={ nameElement.set } 
            onKeyPress={onKeyPress}
            onKeyUp={onKeyPress}
            onKeyDown={onKey}
            onInput={onInput}
        >
            { props.value }
        </span>
    </span>
}
const Root = () => {
    const value = L.atom("Edit me")
    const editing = L.atom(false)
    return <div id="root">
        <EditableSpan value={value} editingThis={editing} onClick={() => editing.set(true)}/>
        <button onClick={(e: JSX.MouseEvent) => { e.preventDefault(); value.set("Edit me")}}>Reset</button>
    </div>
}

mount(<Root/>, document.getElementById("root")!)