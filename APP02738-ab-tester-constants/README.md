# AB Tester Constants

Shared constants, TypeScript types, and API contracts used by the AB Tester
packages. The package publishes compiled JavaScript and declaration files from
`dist/`.

## Requirements

- Node.js 26 (the version specified in [`.nvmrc`](./.nvmrc))
- npm

## Development

Install dependencies, then run the checks and build:

```bash
npm ci
npm run lint
npm run build
```

The build generates the `dist/` files referenced by the package exports.
`npm publish --access public` runs the build before publishing.

Install the published package in another project with:

```bash
npm install @ab-tester/constants
```
