import { AxiosInstance } from 'axios';
import { IFetch, FetchResponse, Method } from './types';
import { ILogger } from '@/ILogger';
/**
 * Fetcher that uses axios.
 */
export declare class AxiosFetch implements IFetch {
    logger: ILogger | null;
    /**
     * The base url for the api.
     */
    static readonly baseURL = "https://discuit.net/api";
    /**
     * Used to make http requests.
     */
    axiosInstance: AxiosInstance;
    /**
     * The current csrf token.
     */
    protected csrfToken: string | null;
    /**
     * The session cookie.
     */
    protected cookie: string | null;
    /**
     * Constructor
     *
     * @param logger a logger that will be used to log messages.
     */
    constructor(logger: ILogger | null);
    /**
     * @inheritDoc
     */
    setLogger: (logger: ILogger) => void;
    /**
     * @inheritdoc
     */
    hasToken: () => boolean;
    /**
     * Fetches a csrf token from the server.
     *
     * Also stores the token internally for future requests.
     */
    getToken: () => Promise<string | null>;
    /**
     * @inheritdoc
     */
    request: <T>(method: Method, path: string, body?: any) => Promise<FetchResponse<T> | null>;
    /**
     * Formats a csrf token.
     *
     * @param token The token to format.
     */
    private formatToken;
    /**
     * Returns a boolean indicating whether the code is being run in a browser.
     */
    private isBrowser;
}
