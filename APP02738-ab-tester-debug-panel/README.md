# AB Tester Debug Panel

The debug panel is a small React widget bundled as a standalone browser script.
It reads campaign and variation data from `window.ab_tester.campaignsData` and
lets a developer select a variation and copy or apply its debug URL parameters.

## Requirements

- Node.js 26 (the version specified in [`.nvmrc`](./.nvmrc))
- npm
- Access to the AB Tester script, which provides `window.ab_tester.campaignsData`

## Development

Install dependencies and run the local Vite development server:

```bash
npm ci
npm run dev
```

Run the available quality checks and create the distributable bundle with:

```bash
npm run lint
npm test
npm run build
```

The build produces `dist/script.js` and copies the package manifest into
`dist/`. To publish the distributable, run `npm publish --access public` from
the `dist/` directory.
