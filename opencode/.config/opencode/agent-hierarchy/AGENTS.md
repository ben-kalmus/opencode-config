# Go Project Rules

These rules supplement the global AGENTS.md. They apply to all agents working on Go projects.

## Project Structure

- Standard Go layout: `/cmd` for binaries, `/internal` for private packages, `/pkg` for public packages.
- One package per directory. Package name matches directory name.
- `main.go` in `/cmd/<app>/main.go`, minimal — delegates to a library package.

## Testing

- Table-driven tests with `t.Run` subtests.
- Use `testify/require` for halting assertions, `testify/assert` for non-halting.
- Test files go next to the implementation: `foo.go` → `foo_test.go`.
- Test function naming: `TestPackage_Function` or `TestFunction`.

## Code Style

- `gofmt` or `go vet` must pass before any commit.
- Errors are values. Return them, don't panic.
- `context.Context` is the first parameter in functions that accept it.
- Zero-value initialization is preferred: `var s T` not `s := T{}`.
- No init() functions unless absolutely required by the stdlib interface.

## Imports

- Group stdlib, third-party, internal. Separate groups with blank lines.
- No unused imports. No `_` imports unless required by driver pattern.
- Import paths use the module root, not relative paths.
