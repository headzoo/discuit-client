import { IFetch, FetchResponse, Method } from './types';
type Callback = (body: any) => Promise<FetchResponse<any> | null>;
/**
 * Fetcher used for testing.
 */
export declare class TestingFetch implements IFetch {
    private method;
    private path;
    private callback;
    /**
     * Constructor
     *
     * @param method
     * @param path
     * @param callback
     */
    constructor(method: string, path: string, callback: Callback);
    /**
     * @inheritdoc
     */
    request: <T>(method: Method, path: string, body: any) => Promise<FetchResponse<T> | null>;
    /**
     * @inheritdoc
     */
    getToken: () => Promise<string | null>;
    /**
     * @inheritdoc
     */
    hasToken: () => boolean;
}
export {};
