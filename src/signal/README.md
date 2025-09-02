## Signal

Inspired by FRP concepts, but

- No stateful transforms or constructors, like `scan` or `interval` as these represent an implicit state storage where ownership is vague. Instead, use Atoms and manipulate them directly
- Signal has the same methods as used in `React.useSyncExternalStore`, i.e. `get` and `subscribe`. It does not de-duplicate values - that will be left for the subscriber. The `cached` method is an exception and can be used as a helper.
