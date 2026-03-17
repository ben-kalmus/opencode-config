## Quick start

Symlink to opencode directory with stow:

```sh
stow -t ~ opencode
``` 

## Prereq

Add a key to your environment variables:

```sh
#.env
export OPENROUTER_API_KEY=...

```

Enable web search in opencode:
 
```sh 
# .zshrc / .bashrc
export OPENCODE_ENABLE_EXA=1 
```

## Plugins

Already configured:
- [DCP](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning): Dynamic Context Pruning: significantly reduces context usage by removing tool calls, errors and repeat mistakes. 
- [Snip](https://github.com/VincentHardouin/opencode-snip) (experimental): Reduces token usage massively for common commands like go test by reducing unnecessary output from tool.

Consider [superpowers](https://github.com/obra/superpowers). A set of skills to guide development, careful planning, incorporating best practices and without making the same mistakes.
Navigate to [this page](https://github.com/obra/superpowers/blob/main/docs/README.opencode.md)

See more [on this page](https://github.com/awesome-opencode/awesome-opencode).
