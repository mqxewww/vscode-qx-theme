# Contributing

## Running the theme locally

1. Open the repository in VS Code and press `F5`. An Extension Development
   Host window opens with the theme loaded.
2. In that window, run **Preferences: Color Theme** (`Ctrl+K Ctrl+T`) and
   select **QX Theme**.
3. Edit `themes/qx-theme-color-theme.json`: changes apply on save. The files
   in `samples/` cover every language the theme is tuned for.

Before opening a PR, check the theme file (JSON, color format, contrast and
italics). The CI runs the same check:

```sh
node scripts/check-theme.mjs
```

To build the `.vsix` package, as the CI does:

```sh
npx @vscode/vsce@4 package
```

## Pull requests

- PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat: …`, `fix: …`, `docs: …`). The CI rejects any other title.
- PRs are **squash merged** only: the PR title becomes the commit message on
  `main`, which drives the version number and the changelog.
- Never edit the version in `package.json` or `CHANGELOG.md` by hand. A release
  PR handles both.
