PACKAGES := opencode
PLUGIN_DIR := opencode/.config/opencode/plugin

.PHONY: all init stow unstow restow adopt vendor clean

all: init vendor stow

init:
	@echo "Initializing submodules..."
	@git submodule update --init --recursive

stow: init
	@for pkg in $(PACKAGES); do \
		echo "Stowing $$pkg..."; \
		stow -v -R -t $(HOME) $$pkg; \
	done

unstow:
	@for pkg in $(PACKAGES); do \
		echo "Unstowing $$pkg..."; \
		stow -v -D -t $(HOME) $$pkg; \
	done

restow: unstow stow

adopt:
	@for pkg in $(PACKAGES); do \
		echo "Adopting $$pkg..."; \
		stow -v --adopt -t $(HOME) $$pkg; \
	done

vendor:
	@echo "Installing context plugin tokenizer deps..."
	@cd $(PLUGIN_DIR) && npm install js-tiktoken@latest --prefix vendor --ignore-scripts 2>&1 | tail -1

clean:
	@echo "WARNING: This will remove opencode config symlinks from \$$HOME."
	@printf "Proceed? [y/N] "; read ans; case "$$ans" in [yY]|[yY][eE][sS]) ;; *) echo "Aborted."; exit 1;; esac
	@echo "Removing old symlinks..."
	@for pkg in $(PACKAGES); do \
		stow -v -D -t $(HOME) $$pkg 2>/dev/null; \
	done
	@rm -f $(HOME)/.config/opencode/AGENTS.md \
		$(HOME)/.config/opencode/dcp.jsonc \
		$(HOME)/.config/opencode/opencode.json \
		$(HOME)/.config/opencode/tui.json
	@rm -rf $(HOME)/.config/opencode/command \
		$(HOME)/.config/opencode/commands \
		$(HOME)/.config/opencode/plugin \
		$(HOME)/.config/opencode/skills \
		$(HOME)/.config/opencode/plugins
	@echo "Clean. Run 'make stow' to deploy."