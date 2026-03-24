# @circles/email-builder-sdk

React SDK for embedding the Circles Email Builder in your app.

## Install

```bash
npm install @circles/email-builder-sdk
```

## Quick Start

```tsx
import { EmailBuilder } from '@circles/email-builder-sdk';

export function EmailEditor() {
  return (
    <div style={{ height: '100vh' }}>
      <EmailBuilder
        src="https://pc-email-template-builder.netlify.app"
        initialHtml="<h1>Welcome</h1><p>Edit this email template</p>"
        onChange={(html) => console.log('changed', html)}
        onSave={(html) => console.log('saved', html)}
        onUpload={async (file) => {
          const body = new FormData();
          body.append('asset', file);
          const response = await fetch('/api/uploads', { method: 'POST', body });
          const data = await response.json();
          return data.url;
        }}
      />
    </div>
  );
}
```

If `initialHtml` is not provided, the editor starts with a default Hello World template.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `src` | `string` | Yes | Absolute URL of the hosted email builder app. |
| `initialHtml` | `string` | No | Initial HTML content to load in the editor. |
| `config` | `Record<string, unknown>` | No | Optional builder configuration object. |
| `className` | `string` | No | Class for the wrapper container. |
| `style` | `React.CSSProperties` | No | Inline styles for the wrapper container. |
| `iframeTitle` | `string` | No | Accessible title for the iframe. |
| `sandbox` | `string` | No | Custom iframe sandbox value. |
| `allowedOrigin` | `string` | No | Override allowed origin for message validation. |
| `onReady` | `() => void` | No | Called when editor is ready. |
| `onStatusChange` | `(status) => void` | No | Called on status changes (`loading`, `ready`, `error`). |
| `onChange` | `(html: string) => void` | No | Called when editor content changes. |
| `onSave` | `(html: string) => void` | No | Called when user saves content. |
| `onUpload` | `(file: File) => Promise<string>` | No | Upload handler that returns a public URL for inserted assets. |

## Ref API

`EmailBuilder` supports a ref with:

- `reload(): void` - Reloads the embedded editor iframe.

## Requirements

- React `>=18.2.0`
- ReactDOM `>=18.2.0`

## License

MIT
