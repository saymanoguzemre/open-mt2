### Code Comments

Keep production code comments concise and focused on **domain intent or non-obvious behavior**, not on the reasoning process used to arrive at the implementation.

Do:

* Explain **why** a non-obvious business/domain rule exists.
* Explain behavior that would otherwise be misleading or difficult to understand from the code itself.
* Keep comments short and factual.
* Prefer self-explanatory code and meaningful names over comments.

Do not:

* Add comments describing the AI's reasoning, implementation decisions, or thought process.
* Add comments explaining obvious code.
* Add long multi-line comments to justify a simple implementation.
* Describe what the code does line-by-line when the code is already clear.
* Add speculative comments about why the original developer/system may have behaved a certain way.
* Use comments as a substitute for proper abstraction, naming, or architecture.

For example, avoid:

```ts
// The original interprets a leading '/' before looking at chat type, so
// COMMAND-typed /skillup from the client still runs.
```

Avoid:

```ts
// Dropped silently, the way the original handles a client talking too
// fast: closing the connection would punish a burst of legitimate
// typing, and a spam module gets nothing out of either.
```

Prefer:

```ts
// Client-side UI commands remain available during chat cooldown.
```

If the reason for the behavior can be expressed cleanly through code structure, naming, or a domain abstraction, **do not add a comment at all**.

When modifying existing code, preserve the existing comment style and avoid introducing unnecessary comments unless the new behavior genuinely requires explanation.
