import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IFetch, FetchResponse, Method, Headers } from './types';
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
    this.axiosInstance = axios.create({
      baseURL: AxiosFetch.baseURL,
      headers: {
        Referer: 'https://discuit.net/',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });
  }

  /**
   * @inheritdoc
   */
  public hasToken = (): boolean => {
    return !!this.csrfToken;
  };

  /**
   * @inheritdoc
   */
  public request = async <T>(
    method: Method,
    path: string,
    body: any = null,
  ): Promise<FetchResponse<T>> => {
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

    return await this.axiosInstance.request(config).then((res) => {
      const { headers } = res;

      if (headers['set-cookie']) {
        /*this.cookie = res.headers.get('set-cookie');
          if (this.debugging) {
            console.log(`Got cookies: "${this.cookie}"`);
          }*/
      }
      if (headers['csrf-token']) {
        /*this.csrfToken = this.formatToken(res.headers.get('csrf-token'));
          if (this.debugging) {
            console.log(`Got csrf token: "${this.csrfToken}"`);
          }*/
      }

      return {
        statusCode: res.status,
        data: res.data,
        headers: {
          'set-cookie': headers['set-cookie'],
          'csrf-token': headers['csrf-token'],
        } as Headers,
      };
    });
  };
}
