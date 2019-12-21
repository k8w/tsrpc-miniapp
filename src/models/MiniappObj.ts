export interface MiniappObj {
    request(options: RequestOptions): RequestTask;
    connectSocket(options: ConnectWebSocketOptions): SocketTask;

}

export interface RequestOptions {
    url: string,
    data?: string | object | ArrayBuffer,
    header?: object,
    method?: 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT',
    dataType?: 'json'|'arraybuffer',
    responseType?: 'text' | 'arraybuffer',
    success?: (res: {
        data: string | object | ArrayBuffer,
        statusCode: number,
        header: object
    }) => void;
    fail?: (res: any) => void;
    complete?: (res: any) => void;
}

export interface RequestTask {
    abort(): void;
    onHeadersReceived(callback: (res: { header: object }) => void): void;
    offHeadersReceived(callback: Function): void;
}

export interface ConnectWebSocketOptions {
    url: string,
    header?: object,
    protocols?: string[],
    tcpNoDelay?: boolean,
    perMessageDeflate?: boolean,
    success?: (res: any) => void,
    fail?: (res: any) => void,
    complete?: (res: any) => void
}

export interface SocketTask {
    send(options: {
        data: string | ArrayBuffer,
        success?: (res: any) => void,
        fail?: (res: any) => void,
        complete?: (res: any) => void
    }): void;
    close(
        code?: number,
        reason?: string,
        success?: (res: any) => void,
        fail?: (res: any) => void,
        complete?: (res: any) => void
    ): void;
    onOpen(callback: (res: { header: object }) => void): void;
    onClose(callback: (res: { code: number, reason: string }) => void): void;
    onError(callback: (res: { errMsg: string }) => void): void;
    onMessage(callback: (res: { data: string | ArrayBuffer }) => void): void;
}