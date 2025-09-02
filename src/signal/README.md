## Signal

Inspired by FRP concepts, as in

- Signal is a readonly state store that has the same methods as used in `React.useSyncExternalStore`, i.e. `get` and `subscribe`. It does not de-duplicate values - that will be left for the subscriber. The `cached` method is an exception and can be used as a helper.
- Atom is a readwrite state store
- Combinators such as `map`, `filter`, `combine`, `switch` (aka flatMapLatest) available for Signals

But

- No EventStreams. Especially stateful ones, like `scan` or `interval` are problematic as these represent an implicit state storage where ownership is vague. Instead, use Atoms and manipulate them directly
