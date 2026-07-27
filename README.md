# srikanth/ui

The components shadcn/ui doesn't ship. Install with the shadcn CLI — you own the code.

**Docs & demos:** https://srikanth-ui.vercel.app

## Components

| Component | Install |
|---|---|
| Time Picker | `npx shadcn@latest add https://srikanth-ui.vercel.app/r/time-picker.json` |
| Phone Input | `npx shadcn@latest add https://srikanth-ui.vercel.app/r/phone-input.json` |
| Password Input | `npx shadcn@latest add https://srikanth-ui.vercel.app/r/password-input.json` |
| Number Input | `npx shadcn@latest add https://srikanth-ui.vercel.app/r/number-input.json` |

Or add the namespace once to `components.json`:

```json
{ "registries": { "@srikanth": { "url": "https://srikanth-ui.vercel.app/r/{name}.json" } } }
```

Then: `npx shadcn@latest add @srikanth/time-picker`

## Principles

- Same bar as official shadcn components: keyboard accessible, ARIA correct, themable via CSS variables, RTL-safe.
- Zero dependencies unless reinventing is folly (phone parsing uses libphonenumber-js).
- Controlled + uncontrolled. Form-ready.

## Development

```bash
npm i
npm run dev            # docs site
npm run test           # vitest
npm run registry:build # rebuild public/r/*.json
```
