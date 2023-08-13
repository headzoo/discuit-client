import { IFetch, FetchResponse, Method } from './types';
export interface Request {
    method: Method;
    path: string;
    body: any;
}
type Callback = (req: Request) => Promise<any>;
/**
 * Fetcher used for testing.
 */
export declare class TestingFetch implements IFetch {
    private method;
    private path;
    private callback;
    /**
     * Number of times the fetch method was called.
     */
    requestCount: number;
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
