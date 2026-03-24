import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { BuilderToHostMessage, HostToBuilderMessage } from './protocol';
import { isMessageLike } from './protocol';
import { buildEnvelope, deriveAllowedOrigin, stableSignature } from './utils';
import type { EmailBuilderHandle, EmailBuilderProps, EmailBuilderStatus } from './types';

const DEFAULT_SANDBOX = 'allow-scripts allow-same-origin allow-forms';
const DEFAULT_INITIAL_HTML = '<h1>Hello World</h1><p>Start building your email template.</p>';

type PendingMessage = {
  message: HostToBuilderMessage;
  correlationId?: string;
};

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: 500,
  background: 'linear-gradient(135deg, rgba(9,9,9,0.65), rgba(33,33,33,0.85))',
  color: '#fff',
  zIndex: 2,
};

const iframeStyle: CSSProperties = {
  border: 'none',
  width: '100%',
  height: '100%',
};

function EmailBuilderInner(
  {
    src,
    initialHtml,
    config,
    className,
    style,
    iframeTitle = 'Email Builder',
    sandbox = DEFAULT_SANDBOX,
    onChange,
    onSave,
    onUpload,
    onReady,
    onStatusChange,
    allowedOrigin,
  }: EmailBuilderProps,
  ref: ForwardedRef<EmailBuilderHandle>
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const builderWindowRef = useRef<Window | null>(null);
  const readyRef = useRef(false);
  const statusRef = useRef<EmailBuilderStatus>('loading');
  const [status, setStatus] = useState<EmailBuilderStatus>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const queueRef = useRef<PendingMessage[]>([]);
  const runtimeOriginRef = useRef<string | null>(null);
  const effectiveInitialHtml = initialHtml ?? DEFAULT_INITIAL_HTML;
  const initSignatureRef = useRef(stableSignature({ html: effectiveInitialHtml, config }));
  const latestInitRef = useRef<HostToBuilderMessage>({
    type: 'INIT',
    payload: { html: effectiveInitialHtml, config },
  });

  const expectedOrigin = useMemo(() => deriveAllowedOrigin(src, allowedOrigin), [src, allowedOrigin]);

  const resolveTargetOrigin = useCallback(() => runtimeOriginRef.current ?? expectedOrigin, [expectedOrigin]);

  const setStatusSafely = useCallback(
    (next: EmailBuilderStatus) => {
      if (statusRef.current === next) {
        return;
      }
      statusRef.current = next;
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const postMessage = useCallback(
    (message: HostToBuilderMessage, correlationId?: string) => {
      const target = iframeRef.current?.contentWindow ?? builderWindowRef.current;
      if (target) {
        builderWindowRef.current = target;
      }

      if (!builderWindowRef.current || !readyRef.current) {
        queueRef.current.push({ message, correlationId });
        return;
      }

      builderWindowRef.current.postMessage(buildEnvelope(message, correlationId), resolveTargetOrigin());
    },
    [resolveTargetOrigin]
  );

  const flushQueue = useCallback(() => {
    if (!readyRef.current || !builderWindowRef.current) {
      return;
    }
    const pending = [...queueRef.current];
    queueRef.current = [];
    pending.forEach(({ message, correlationId }) => {
      builderWindowRef.current?.postMessage(
        buildEnvelope(message, correlationId),
        resolveTargetOrigin()
      );
    });
  }, [resolveTargetOrigin]);

  const handleReadyMessage = useCallback(() => {
    readyRef.current = true;
    setStatusSafely('ready');
    onReady?.();
    postMessage(latestInitRef.current);
    flushQueue();
  }, [flushQueue, onReady, postMessage, setStatusSafely]);

  const handleUpload = useCallback(
    async (eventMessage: BuilderToHostMessage) => {
      if (eventMessage.type !== 'UPLOAD') {
        return;
      }
      if (!onUpload) {
        console.warn('[EmailBuilderSDK] Upload requested but no onUpload handler is configured.');
        return;
      }
      try {
        setStatusSafely('loading');
        const url = await onUpload(eventMessage.payload.file);
        postMessage({ type: 'UPLOAD_SUCCESS', payload: { url } }, eventMessage.meta?.id);
      } catch (error) {
        setStatusSafely('error');
        console.error('[EmailBuilderSDK] Upload handler failed', error);
      } finally {
        if (statusRef.current !== 'error') {
          setStatusSafely('ready');
        }
      }
    },
    [onUpload, postMessage, setStatusSafely]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow ?? builderWindowRef.current;
      if (!iframeWindow || event.source !== iframeWindow) {
        return;
      }
      if (!isMessageLike(event.data)) {
        return;
      }
      if (!runtimeOriginRef.current) {
        runtimeOriginRef.current = event.origin;
      } else if (event.origin !== runtimeOriginRef.current) {
        return;
      }
      const message = event.data as BuilderToHostMessage;

      if (event.source && event.source !== builderWindowRef.current) {
        builderWindowRef.current = event.source as Window;
      }

      switch (message.type) {
        case 'READY':
          handleReadyMessage();
          break;
        case 'CHANGE':
          onChange?.(message.payload.html);
          break;
        case 'SAVE':
          onSave?.(message.payload.html);
          break;
        case 'UPLOAD':
          void handleUpload(message);
          break;
        default:
          break;
      }
    },
    [handleReadyMessage, handleUpload, onChange, onSave]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  useEffect(() => {
    const nextPayload = { html: effectiveInitialHtml, config };
    const signature = stableSignature(nextPayload);
    latestInitRef.current = { type: 'INIT', payload: nextPayload };
    if (signature !== initSignatureRef.current && readyRef.current) {
      postMessage(latestInitRef.current);
    }
    initSignatureRef.current = signature;
  }, [config, effectiveInitialHtml, postMessage]);

  const handleIframeLoad = useCallback(() => {
    builderWindowRef.current = iframeRef.current?.contentWindow ?? null;
    readyRef.current = false;
    runtimeOriginRef.current = null;
    setStatusSafely('loading');
  }, [setStatusSafely]);

  useImperativeHandle(
    ref,
    () => ({
      reload() {
        queueRef.current = [];
        readyRef.current = false;
        builderWindowRef.current = null;
        runtimeOriginRef.current = null;
        setStatusSafely('loading');
        setReloadKey((key) => key + 1);
      },
    }),
    [setStatusSafely]
  );

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <iframe
        key={reloadKey}
        ref={iframeRef}
        src={src}
        title={iframeTitle}
        sandbox={sandbox}
        style={iframeStyle}
        loading="lazy"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
      {status !== 'ready' && <div style={overlayStyle}>Connecting to builder…</div>}
    </div>
  );
}

export const EmailBuilder = forwardRef(EmailBuilderInner);
