import type { BuilderToHostMessage, HostToBuilderMessage, MessageMeta } from './protocol';
import { createMessageMeta, isMessageLike } from './protocol';

const DEFAULT_BASE_URL = 'https://localhost';

export function deriveAllowedOrigin(src: string, override?: string): string {
  if (override) {
    const parsed = new URL(override);
    if (parsed.origin === 'null') {
      throw new Error('allowedOrigin must resolve to a valid origin');
    }
    return parsed.origin;
  }

  const parsed = new URL(src, DEFAULT_BASE_URL);
  if (!parsed.origin || parsed.origin === 'null') {
    throw new Error('EmailBuilder requires an absolute src URL with a valid origin');
  }
  return parsed.origin;
}

export function buildEnvelope<T extends HostToBuilderMessage>(message: T, correlationId?: string): T {
  const meta: MessageMeta = createMessageMeta(correlationId);
  return { ...message, meta } as T;
}

export function sanitizeIncomingMessage(
  event: MessageEvent,
  allowedOrigin: string,
  iframeWindow: Window | null
): BuilderToHostMessage | null {
  if (event.origin !== allowedOrigin) {
    return null;
  }

  if (!iframeWindow || event.source !== iframeWindow) {
    return null;
  }

  if (!isMessageLike(event.data)) {
    return null;
  }

  return event.data as BuilderToHostMessage;
}

export function stableSignature(value: unknown): string {
  return JSON.stringify(value ?? null);
}
