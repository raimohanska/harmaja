import * as B from "baconjs"
import { h, mount, ListView, atom, Atom } from "../../src/index"
import { search } from "./search-engine"

const Root = () =>
    <div id="root">
        <Search/>
    </div>

type SearchState = { state: "initial" } | { state: "searching", searchString: string } | { state: "done", searchString: string, results: string[] }

const Search = () => {
    const searchString = atom("")
    const searchStringChange: B.EventStream<string> = searchString.changes().debounce(500)
    const searchResult: B.EventStream<string[]> = searchStringChange.flatMapLatest(s => B.fromPromise(search(s)))
    const state: B.Property<SearchState> = B.update(
        { state: "initial"} as SearchState,
        [searchStringChange, (state, searchString) => ({ state: "searching", searchString })],
        [searchResult, searchString, (state, results, searchString) => ({ state: "done", results, searchString})]
    )
    return <div>
        <h1>Cobol search</h1>
        <TextInput value={searchString} placeholder="Enter text to start searching"/>
        <SearchResults state={state} />
    </div>
}


const SearchResults = ({ state } : { state: B.Property<SearchState> }) => {
    const currentResults: B.Property<string[] | null> = state.map(s => s.state === "done" ? s.results : null)
    const latestResults: B.Property<string[]> = currentResults.filter(results => results !== null).startWith([])

    const message = B.combine(state, latestResults, (s, r) => {
        if (s.state == "done" && r.length === 0) return "Nothing found"
        if (s.state === "searching" && r.length === 0) return "Searching..."
        return ""
    })
    const style = B.combine(state, latestResults, (s, r) => {
        if (s.state === "searching" && r.length > 0) return { opacity: 0.5 }
        return {}
    })
    
    return <div>
        { message }
        <ul style={style}><ListView
            observable={latestResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>

    </div>
}

const SearchResultsSimplest = ({ state } : { state: B.Property<SearchState> }) => {
    const currentResults: B.Property<string[]> = state.map(s => s.state === "done" ? s.results : [])
    const message: B.Property<string> = currentResults.map(r => r.length === 0 ? "Nothing found" : null)
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}

const SearchResults2 = ({ state } : { state: B.Property<SearchState> }) => {
    const currentResults: B.Property<string[]> = state.map(s => s.state === "done" ? s.results : [])
    const message: B.Property<string> = state.map(s => {
        if (s.state === "searching") return "Searching..."
        if (s.state === "done" && s.results.length === 0) return "Nothing found."
        return ""
    })
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}

const TextInput = (props: { value: Atom<string> } & any) => {
    return <input {...{ 
            type: "text", 
            onInput: e => { 
                props.value.set(e.target.value)
            },
            ...props, 
            checked: props.checked 
          }} />  
  };

mount(<Root/>, document.getElementById("root")!)



