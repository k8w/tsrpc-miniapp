import 'k8w-extend-native';
import { HttpClient } from './src/HttpClient';
import { Logger, PrefixLogger } from './src/models/Logger';
import { MiniappObj } from './src/models/MiniappObj';
import { WsClient } from './src/WsClient';

export { Logger, PrefixLogger, MiniappObj }
export { HttpClient, WsClient };
    
export { HttpClient as TsrpcClient };