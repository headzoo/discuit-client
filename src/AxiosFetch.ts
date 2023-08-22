import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IFetch, FetchResponse, Method, Headers, HeaderValue } from './types';
import { ILogger } from '@/ILogger';

/**
 * Fetcher that uses axios.
 */
export class AxiosFetch implements IFetch {
  /**
   * The base url for the api.
   */
  public static readonly baseURL = 'https://discuit.net/api';

  /**
   * Used to make http requests.
   */
  public axiosInstance: AxiosInstance;

  /**
   * The current csrf token.
   */
  protected csrfToken: string | null = null;

  /**
   * The session cookie.
   */
  protected cookie: string | null = null;

  /**
   * Constructor
   *
   * @param logger a logger that will be used to log messages.
   */
  constructor(public logger: ILogger | null) {
    const headers: HeadersInit = {};
    if (!this.isBrowser()) {
      headers['Referer'] = 'https://discuit.net/';
      headers['User-Agent'] =
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    }

    this.axiosInstance = axios.create({
      baseURL: AxiosFetch.baseURL,
      headers,
    });
  }

  /**
   * @inheritDoc
   */
  public setLogger = (logger: ILogger) => {
    this.logger = logger;
  };

  /**
   * @inheritdoc
   */
  public hasToken = (): boolean => {
    return !!this.csrfToken;
  };

  /**
   * Fetches a csrf token from the server.
   *
   * Also stores the token internally for future requests.
   */
  public getToken = async (): Promise<string | null> => {
    return await this.request<string | null>('GET', '/_initial').then((resp) => {
      if (!resp) {
        if (this.logger) {
          this.logger.debug(`Got null response from /_initial`);
        }

        return null;
      }

      return this.formatToken(resp.headers['csrf-token']);
    });
  };

  /**
   * @inheritdoc
   */
  public request = async <T>(
    method: Method,
    path: string,
    body: any = null,
  ): Promise<FetchResponse<T> | null> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.csrfToken) {
      headers['X-Csrf-Token'] = this.csrfToken;
    }
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const config: AxiosRequestConfig = {
      url: path,
      method,
      headers,
    };
    if (method === 'POST' && body) {
      config.data = body;
    }

    if (this.logger) {
      this.logger.debug(`Making ${method} request to ${path}`, config);
    }

    try {
      return await this.axiosInstance
        .request(config)
        .then((res) => {
          const { headers } = res;

          if (!this.cookie && headers['set-cookie']) {
            this.cookie = (headers['set-cookie'] || '').toString();
          }
          if (!this.csrfToken && headers['csrf-token']) {
            this.csrfToken = this.formatToken(headers['csrf-token']);
          }

          return {
            statusCode: res.status,
            data: res.data,
            headers: {
              'set-cookie': headers['set-cookie'],
              'csrf-token': headers['csrf-token'],
            } as Headers,
          };
        })
        .catch((error) => {
          if (this.logger) {
            this.logger.error(
              `${error.response}: Error making ${method} request to ${path}`,
              error,
            );
          }

          throw error;
        });
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Error making ${method} request to ${path}`, error);
      }

      throw error;
    }
  };

  /**
   * Formats a csrf token.
   *
   * @param token The token to format.
   */
  private formatToken = (token: HeaderValue): string => {
    if (!token) {
      return '';
    }

    if (Array.isArray(token)) {
      return token[0];
    }
    if (typeof token === 'number') {
      return token.toString();
    }

    return token.toString();
  };

  /**
   * Returns a boolean indicating whether the code is being run in a browser.
   */
  private isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
