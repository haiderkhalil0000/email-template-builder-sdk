import React, { CSSProperties } from 'react';

declare const EMAIL_BUILDER_PROTOCOL_VERSION = "1.0.0";
type MessageType = 'INIT' | 'READY' | 'CHANGE' | 'SAVE' | 'UPLOAD' | 'UPLOAD_SUCCESS';
interface MessageMeta {
    id: string;
    correlationId?: string;
    version: string;
    sentAt: number;
}
type BuilderConfig = Record<string, unknown> | undefined;
interface InitPayload {
    html: string;
    config?: BuilderConfig;
}
interface ChangePayload {
    html: string;
}
interface SavePayload {
    html: string;
}
interface UploadPayload {
    file: File;
}
interface UploadSuccessPayload {
    url: string;
}
type Message = {
    type: 'INIT';
    payload: InitPayload;
    meta?: MessageMeta;
} | {
    type: 'READY';
    meta?: MessageMeta;
} | {
    type: 'CHANGE';
    payload: ChangePayload;
    meta?: MessageMeta;
} | {
    type: 'SAVE';
    payload: SavePayload;
    meta?: MessageMeta;
} | {
    type: 'UPLOAD';
    payload: UploadPayload;
    meta?: MessageMeta;
} | {
    type: 'UPLOAD_SUCCESS';
    payload: UploadSuccessPayload;
    meta?: MessageMeta;
};
type BuilderToHostMessage = Extract<Message, {
    type: 'READY' | 'CHANGE' | 'SAVE' | 'UPLOAD';
}>;
type HostToBuilderMessage = Extract<Message, {
    type: 'INIT' | 'UPLOAD_SUCCESS';
}>;
declare function isMessageLike(value: unknown): value is Message;
declare function createMessageMeta(correlationId?: string): MessageMeta;

type UploadHandler = (file: File) => Promise<string>;
type EmailBuilderStatus = 'idle' | 'loading' | 'ready' | 'error';
interface EmailBuilderProps {
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
interface EmailBuilderHandle {
    reload: () => void;
}

declare const EmailBuilder: React.ForwardRefExoticComponent<EmailBuilderProps & React.RefAttributes<EmailBuilderHandle>>;

export { type BuilderConfig, type BuilderToHostMessage, type ChangePayload, EMAIL_BUILDER_PROTOCOL_VERSION, EmailBuilder, type EmailBuilderHandle, type EmailBuilderProps, type EmailBuilderStatus, type HostToBuilderMessage, type InitPayload, type Message, type MessageMeta, type MessageType, type SavePayload, type UploadHandler, type UploadPayload, type UploadSuccessPayload, createMessageMeta, isMessageLike };
