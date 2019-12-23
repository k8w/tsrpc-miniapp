"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("k8w-extend-native");
var HttpClient_1 = require("./src/HttpClient");
exports.HttpClient = HttpClient_1.HttpClient;
exports.TsrpcClient = HttpClient_1.HttpClient;
var Logger_1 = require("./src/models/Logger");
exports.PrefixLogger = Logger_1.PrefixLogger;
