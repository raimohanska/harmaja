import { h, mount, ListView, Signal, atomFromValue, signalFromPromise, switchSignal, combineSignals, Atom } from "../../src/index"
import { search } from "./search-engine"

const Root = () =>
    <div id="root">
        <Search/>
    </div>

type SearchState = { state: "initial" } | 
    { state: "searching", searchString: string } | 
    { state: "done", searchString: string, results: string[] }

function searchSignal(s: string): Signal<SearchState> {
    return signalFromPromise(search(s)).map(state => {
        if (s.length === 0) {
            return { state: "initial" }
        }
        if (state.state !== "resolved") {
            return {
                state: "searching",
                searchString: s
            }
        }
        return {
            state: "done",
            searchString: s,
            results: state.state === "resolved" ? state.value : []
        }
    })
}


const Search = () => {
    const searchString = atomFromValue("")
    
    const debouncedSearch = searchString.debounce(500)
    const searchResult = switchSignal(debouncedSearch, searchSignal)
    
    return <div>
        <h1>Cobol search</h1>
        <TextInput value={searchString} placeholder="Enter text to start searching"/>
        <SearchResults state={searchResult} />
    </div>
}

const SearchResults = ({ state } : { state: Signal<SearchState> }) => {
    const latestResults = atomFromValue<string[]>([])
    
    // TODO: how to scope component side-effects? Here it's not strictly needed
    // Maybe an "useEffect" thing would make sense. Applies to all onChange usages
    
    state.onChange(s => {
        if (s.state === "done") latestResults.set(s.results)
        if (s.state === "initial") latestResults.set([])
    })

    const message = combineSignals([state, latestResults], (s, r) => {
        if (s.state == "done" && r.length === 0) return "Nothing found"
        if (s.state === "searching" && r.length === 0) return "Searching..."
        return ""
    })

    const style = combineSignals([state, latestResults], (s, r) => {
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

const SearchResultsSimplest = ({ state } : { state: Signal<SearchState> }) => {
    const currentResults: Signal<string[]> = state.map(s => s.state === "done" ? s.results : [])
    const message: Signal<string> = currentResults.map(r => r.length === 0 ? "Nothing found" : "")
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}

const SearchResults2 = ({ state } : { state: Signal<SearchState> }) => {
    const currentResults = state.map(s => s.state === "done" ? s.results : [])

    const message: Signal<string> = state.map(s => {
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
                props.value.set(e.currentTarget.value)
            },
            ...props, 
            value: props.value 
          }} />  
  };

mount(<Root/>, document.getElementById("root")!)



