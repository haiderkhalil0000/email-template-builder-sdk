export const EMAIL_BUILDER_PROTOCOL_VERSION = '1.0.0';

export type MessageType =
  | 'INIT'
  | 'READY'
  | 'CHANGE'
  | 'SAVE'
  | 'UPLOAD'
  | 'UPLOAD_SUCCESS';

export interface MessageMeta {
  id: string;
  correlationId?: string;
  version: string;
  sentAt: number;
}

export type BuilderConfig = Record<string, unknown> | undefined;

export interface InitPayload {
  html: string;
  config?: BuilderConfig;
}

export interface ChangePayload {
  html: string;
}

export interface SavePayload {
  html: string;
}

export interface UploadPayload {
  file: File;
}

export interface UploadSuccessPayload {
  url: string;
}

export type Message =
  | { type: 'INIT'; payload: InitPayload; meta?: MessageMeta }
  | { type: 'READY'; meta?: MessageMeta }
  | { type: 'CHANGE'; payload: ChangePayload; meta?: MessageMeta }
  | { type: 'SAVE'; payload: SavePayload; meta?: MessageMeta }
  | { type: 'UPLOAD'; payload: UploadPayload; meta?: MessageMeta }
  | { type: 'UPLOAD_SUCCESS'; payload: UploadSuccessPayload; meta?: MessageMeta };

export type BuilderToHostMessage = Extract<
  Message,
  { type: 'READY' | 'CHANGE' | 'SAVE' | 'UPLOAD' }
>;

export type HostToBuilderMessage = Extract<
  Message,
  { type: 'INIT' | 'UPLOAD_SUCCESS' }
>;

const VALID_TYPES: MessageType[] = ['INIT', 'READY', 'CHANGE', 'SAVE', 'UPLOAD', 'UPLOAD_SUCCESS'];

export function isMessageLike(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { type?: unknown; payload?: unknown; meta?: unknown };
  if (typeof candidate.type !== 'string' || !VALID_TYPES.includes(candidate.type as MessageType)) {
    return false;
  }

  if ('meta' in candidate && candidate.meta !== undefined) {
    const meta = candidate.meta as Partial<MessageMeta>;
    if (
      (meta.id && typeof meta.id !== 'string') ||
      (meta.correlationId && typeof meta.correlationId !== 'string') ||
      (meta.version && typeof meta.version !== 'string') ||
      (meta.sentAt && typeof meta.sentAt !== 'number')
    ) {
      return false;
    }
  }

  return true;
}

export function createMessageMeta(correlationId?: string): MessageMeta {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return {
    id,
    correlationId,
    version: EMAIL_BUILDER_PROTOCOL_VERSION,
    sentAt: Date.now(),
  };
}
