
# Build

> Tool for building web projects (inspired by GNU Make).

Using `build` is a lot like `make`, but there are some key differences:

 - It uses 2 spaces for indents instead of tabs.
 - The `node_modules/.bin` is automatically in the path.
 - Parallel deps are part of the syntax, not the CLI.
 - Command input can be continued on subsequent lines using a 4 space indent.
 - A lot more simplistic than GNU Make, does not include fancy features.

## Install

```
npm i -D @jamen/build
```

With [`npx`](https://github.com/zkat/npx) you can build projects without installing:

```
npx @jamen/build
```

## Usage

To start, create a `buildfile` at the base of your project (next to `package.json`).  This is where you write the tasks.  Using `build [name]` starts the task by name, or the first task if no name is given.

Tasks are written like this:

```makefile
foo:
  command --foo
  command --bar=123

bar: foo
  command
    --flag='Hello world'
    --flag2='Bar baz qux'
```

Or more formally:

```makefile
name: ...deps
  command ...input
    ...input
    ...
```

Another thing to know is that deps can be run in parallel by prefixing `@`.

```makefile
foo: bar @baz
  echo 'Hello world'
```

Also note you can run groups of parallel tasks by switching in and out of the above:

 - `foo @bar baz qux`
 - `foo @bar @baz qux`
 - `foo @bar @baz @qux`

A dep without `@` makes it wait for all the tasks before it to start.
