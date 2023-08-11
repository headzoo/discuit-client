"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingFetch = void 0;
/**
 * Fetcher used for testing.
 */
class TestingFetch {
    /**
     * Constructor
     *
     * @param method
     * @param path
     * @param callback
     */
    constructor(method, path, callback) {
        this.method = method;
        this.path = path;
        this.callback = callback;
        /**
         * @inheritdoc
         */
        this.request = (method, path, body) => __awaiter(this, void 0, void 0, function* () {
            if (method === this.method && path === this.path) {
                return yield this.callback(body);
            }
            return Promise.resolve({
                statusCode: 404,
                data: {},
                headers: {},
            });
        });
        /**
         * @inheritdoc
         */
        this.getToken = () => __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve('xxxxxx');
        });
        /**
         * @inheritdoc
         */
        this.hasToken = () => {
            return true;
        };
    }
}
exports.TestingFetch = TestingFetch;
