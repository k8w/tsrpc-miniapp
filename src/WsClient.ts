import { BaseClient, BaseClientOptions, defaultBaseClientOptions, PendingApiItem, TransportOptions } from "tsrpc-base-client";
import { BaseServiceType, ServiceProto, TsrpcError, TsrpcErrorType } from "tsrpc-proto";
import { MiniappObj, SocketTask } from "./MiniappObj";

/**
 * WebSocket Client for TSRPC.
 * It uses native `miniappObj.connectSocket` of mini app.
 * @typeParam ServiceType - `ServiceType` from generated `proto.ts`
 */
export class WsClient<ServiceType extends BaseServiceType = any> extends BaseClient<ServiceType> {

    readonly type = 'LONG';

    /** @internal */
    miniappObj: MiniappObj;

    readonly options!: WsClientOptions;
    constructor(proto: ServiceProto<ServiceType>, options?: Partial<WsClientOptions>) {
        super(proto, {
            ...defaultWsClientOptions,
            ...options
        });

        this.miniappObj = this.options.miniappObj;
        if (!this.miniappObj) {
            throw new Error('options.miniappObj is not set');
        }

        this.logger?.log('TSRPC WebSocket Client :', this.options.server);
    }

    protected async _sendBuf(buf: Uint8Array, options: TransportOptions, serviceId: number, pendingApiItem?: PendingApiItem): Promise<{ err?: TsrpcError; }> {
        // Pre Flow
        let pre = await this.flows.preSendBufferFlow.exec({ buf: buf, sn: pendingApiItem?.sn }, this.logger);
        if (!pre) {
            return {};
        }
        buf = pre.buf;

        if (!this._ws) {
            return {
                err: new TsrpcError('WebSocket is not connected', {
                    code: 'WS_NOT_OPEN',
                    type: TsrpcErrorType.ClientError
                })
            };
        }

        // Do Send
        this.options.debugBuf && this.logger?.debug('[SendBuf]' + (pendingApiItem ? (' #' + pendingApiItem.sn) : ''), `length=${buf.byteLength}`, buf);
        let data: ArrayBuffer;
        if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
            data = buf.buffer;
        }
        else {
            data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }

        return new Promise(rs => {
            this._ws!.send({
                data: data,
                success: () => { rs({}) },
                fail: res => {
                    rs({
                        err: new TsrpcError({
                            message: 'Network Error',
                            type: TsrpcErrorType.NetworkError,
                            innerErr: res
                        })
                    })
                }
            });
        })
    }

    private _status: WsClientStatus = WsClientStatus.Closed;
    public get status(): WsClientStatus {
        return this._status;
    }
    public set status(v: WsClientStatus) {
        if (this._status === v) {
            return;
        }
        this._status = v;
        this.options.onStatusChange?.(v);
    }

    private _ws?: SocketTask;

    private _promiseConnect?: Promise<{ isSucc: true } | { isSucc: false, errMsg: string }>;
    /**
     * Start connecting, you must connect first before `callApi()` and `sendMsg()`.
     * @throws never
     */
    async connect(): Promise<{ isSucc: true } | { isSucc: false, errMsg: string }> {
        // 已连接中
        if (this._promiseConnect) {
            return this._promiseConnect;
        }

        // 已连接成功
        if (this._ws) {
            return { isSucc: true };
        }

        this.logger?.log(`Start connecting ${this.options.server}...`)
        this._promiseConnect = new Promise(rs => {
            let ws = this.miniappObj.connectSocket({
                ...this.options.connectSocketOptions,
                url: this.options.server,
                fail: (res: any) => {
                    this.logger?.error(res);
                    rs({
                        isSucc: false,
                        errMsg: 'Connect WebSocket Error'
                    })
                }
            });

            ws.onOpen(header => {
                this._promiseConnect = undefined;
                rs({ isSucc: true });
                this._ws = ws;
                this.logger?.log('WebSocket connected succ');
                this.status = WsClientStatus.Opened;
            })

            ws.onError(res => {
                this.logger?.error('[WebSocket Error]', res);
                // 还在连接中，则连接失败
                if (this._promiseConnect) {
                    this._promiseConnect = undefined;
                    rs({ isSucc: false, errMsg: res.errMsg || 'WebSocket Connect Error' });
                }
            })

            ws.onClose(e => {
                if (this._promiseConnect) {
                    this._promiseConnect = undefined;
                    rs({ isSucc: false, errMsg: 'WebSocket Closed' });
                }

                // 解引用
                this._ws = undefined;
                this.status = WsClientStatus.Closed;

                if (this._rsDisconnecting) {
                    this._rsDisconnecting();
                    this._rsDisconnecting = undefined;
                    this.logger?.log('Disconnected succ', `code=${e.code} reason=${e.reason}`);
                }
                // 已连接上 非主动关闭 触发掉线
                else {
                    this.logger?.log(`Lost connection to ${this.options.server}`, `code=${e.code} reason=${e.reason}`);
                    this.options.onLostConnection?.();
                }
            });

            ws.onMessage(e => {
                if (typeof e.data === 'string') {
                    this.logger?.error('[Unresolved Data]', e.data)
                }
                else {
                    this._onRecvBuf(new Uint8Array(e.data))
                }
            });
        });

        this.status = WsClientStatus.Opening;
        return this._promiseConnect;
    }

    private _rsDisconnecting?: () => void;
    /**
     * Disconnect immediately
     * @throws never
     */
    async disconnect() {
        // 连接不存在
        if (!this._ws) {
            return;
        }

        this.logger?.log('Disconnecting...');
        this.status = WsClientStatus.Closing;
        return new Promise<void>(rs => {
            this._rsDisconnecting = rs;
            this._ws!.close();
        })
    }
}

const defaultWsClientOptions: WsClientOptions = {
    ...defaultBaseClientOptions,
    miniappObj: typeof wx !== 'undefined' ? wx : undefined as any,
    server: 'ws://127.0.0.1:3000'
}

export interface WsClientOptions extends BaseClientOptions {
    /** Server URL, starts with `ws://` or `wss://`. */
    server: string;

    /**
     * MiniApp API Object
     * Wechat: wx
     * QQ MiniApp: qq
     * ByteDance MiniApp: tt
     */
    miniappObj: any;
    /** Extra options to wx.connectSocket */
    connectSocketOptions?: object;

    // Events
    /** Event when connection status is changed */
    onStatusChange?: (newStatus: WsClientStatus) => void;
    /** Event when the connection is closed accidently (not manually closed). */
    onLostConnection?: () => void;
}

export enum WsClientStatus {
    Opening = 'OPENING',
    Opened = 'OPENED',
    Closing = 'CLOSING',
    Closed = 'CLOSED'
}