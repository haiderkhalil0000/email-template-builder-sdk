# @circles/email-builder-sdk

A lightweight React wrapper that mounts the Circles email builder inside an iframe and manages a secure `postMessage` bridge for INIT/READY/CHANGE/SAVE/UPLOAD/UPLOAD_SUCCESS events.

## Installation

```bash
npm install @circles/email-builder-sdk
# or
yarn add @circles/email-builder-sdk
```

Install directly from Bitbucket (monorepo path install):

```bash
npm install git+ssh://git@bitbucket.org/venndii/circles.git#path=email-builder-sdk
```

## Usage

```tsx
import { EmailBuilder } from '@circles/email-builder-sdk';

export function MarketingEmailEditor() {
  return (
    <EmailBuilder
      src="https://builder.circles.app/iframe"
      initialHtml="<h1>Hello</h1>"
      config={{ theme: 'light' }}
      onChange={(html) => console.log('live html', html)}
      onSave={(html) => console.log('persist', html)}
      onUpload={async (file) => {
        const body = new FormData();
        body.append('asset', file);
        const response = await fetch('/api/uploads', { method: 'POST', body });
        const data = await response.json();
        return data.url;
      }}
    />
  );
}
```

## Development & Build

```bash
cd email-builder-sdk
npm install
npm run dev   # watch mode (tsup)
npm run build # production bundle
```

`dist/` contains CommonJS + ESM bundles plus `.d.ts` files. Publish via:

```bash
npm run build
npm publish --access public
```

## Message Contract

The SDK re-exports the shared protocol so host apps can import the `Message` union directly:

```ts
import type { Message } from '@circles/email-builder-sdk';
```

The handshake is: iframe emits `READY`, the SDK responds with `INIT`, and all other events flow through the bridge with origin validation.
