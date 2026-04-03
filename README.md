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

## Remote Opencode-

### Discord bot

1. Create a service file (replace path and username)
2. Perform `npx remote-opencode setup`
3. Symlink the **user** service file:

```sh 
ln -snf $(pwd)/remote-opencode.service ~/.config/systemd/user/remote-opencode.service
```

4. Start and enable the service:

```sh
systemctl --user daemon-reload

systemctl --user start remote-opencode.service
systemctl --user enable remote-opencode.service

# Troubleshooting logs:
journalctl --user -u remote-opencode.service -f
```

### Telegram bot

Uses [opencode-telegram-bot](https://github.com/grinev/opencode-telegram-bot). Runs both `opencode serve` and the Telegram bot in a single service.

1. Install the bot's dependencies and run initial config wizard:

```sh
npx @grinev/opencode-telegram-bot
```

2. Symlink the service file:

```sh
ln -snf $(pwd)/opencode-telegram.service ~/.config/systemd/user/opencode-telegram.service
```

3. Start and enable:

```sh
systemctl --user daemon-reload
systemctl --user enable --now opencode-telegram

# Allow service to run without an active login session:
loginctl enable-linger $(whoami)
```

4. Check status / logs:

```sh
systemctl --user status opencode-telegram
journalctl --user -u opencode-telegram -f
```

