import type { BuilderConfig } from './protocol';
import type { CSSProperties } from 'react';

export type UploadHandler = (file: File) => Promise<string>;

export type EmailBuilderStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface EmailBuilderProps {
  src: string;
  initialHtml?: string;
  config?: BuilderConfig;
  className?: string;
  style?: CSSProperties;
  iframeTitle?: string;
  sandbox?: string;
  onChange?: (html: string) => void;
  onSave?: (html: string) => void;
  onUpload?: UploadHandler;
  onReady?: () => void;
  onStatusChange?: (status: EmailBuilderStatus) => void;
  /**
   * Optionally override the derived origin (defaults to src origin)
   */
  allowedOrigin?: string;
}

export interface EmailBuilderHandle {
  reload: () => void;
}
