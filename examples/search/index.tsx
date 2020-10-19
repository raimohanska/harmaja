import * as L from "lonna"
import { h, mount, ListView, componentScope } from "../../src/index"
import { search } from "./search-engine"

const Root = () =>
    <div id="root">
        <Search/>
    </div>

type SearchState = { state: "initial" } | { state: "searching", searchString: string } | { state: "done", searchString: string, results: string[] }

function searchAsProperty(s: string): L.Property<string[]> {
    return L.fromPromise(search(s), () => [], xs => xs, error => [])
}

const Search = () => {
    const searchString = L.atom("")
    const searchStringChange: L.EventStream<string> = searchString.pipe(L.changes, L.debounce(500, componentScope()))
    const searchResult = searchStringChange.pipe(
        L.flatMapLatest<string, string[]>(searchAsProperty), 
    )
    
    const state: L.Property<SearchState> = L.update(
        componentScope(),
        { state: "initial"} as SearchState,
        [searchStringChange, (state, searchString) => ({ state: "searching", searchString })],
        [searchResult, searchString, (state, results, searchString) => ({ state: "done", results, searchString})],
    )
    return <div>
        <h1>Cobol search</h1>
        <TextInput value={searchString} placeholder="Enter text to start searching"/>
        <SearchResults state={state} />
    </div>
}

const SearchResults = ({ state } : { state: L.Property<SearchState> }) => {
    const latestResults = state.pipe(
        L.changes,                                                  // Changes as EventStream
        L.scan([], ((results: string[], newState: SearchState) =>   // Start with [], use a Reducer
          newState.state === "done" ? newState.results : results    // Stick with previous unless "done"
        )),
        L.applyScope(componentScope())                              // Keep up-to-date for component lifetime       
    )
    
    const message = L.view(state, latestResults, (s, r) => {
        if (s.state == "done" && r.length === 0) return "Nothing found"
        if (s.state === "searching" && r.length === 0) return "Searching..."
        return ""
    })


    const style = L.view(state, latestResults, (s, r) => {
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

const SearchResultsSimplest = ({ state } : { state: L.Property<SearchState> }) => {
    const currentResults: L.Property<string[]> = L.view(state, s => s.state === "done" ? s.results : [])
    const message: L.Property<string> = L.view(currentResults, r => r.length === 0 ? "Nothing found" : null)
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}

const SearchResults2 = ({ state } : { state: L.Property<SearchState> }) => {
    const currentResults: L.Property<string[]> = L.view(state, s => s.state === "done" ? s.results : [])

    const message: L.Property<string> = L.map((s: SearchState) => {
        if (s.state === "searching") return "Searching..."
        if (s.state === "done" && s.results.length === 0) return "Nothing found."
        return ""
    })(state)
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}

const TextInput = (props: { value: L.Atom<string> } & any) => {
    return <input {...{ 
            type: "text", 
            onInput: e => { 
                props.value.set(e.currentTarget.value)
            },
            ...props, 
            value: props.value 
          }} />  
  };

mount(<Root/>, document.getElementById("root")!)



