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
export class TestingFetch implements IFetch {
  /**
   * Number of times the fetch method was called.
   */
  public requestCount = 0;

  /**
   * Constructor
   *
   * @param method
   * @param path
   * @param callback
   */
  constructor(
    private method: string,
    private path: string,
    private callback: Callback,
  ) {}

  /**
   * @inheritdoc
   */
  public setLogger = () => {};

  /**
   * @inheritdoc
   */
  public request = async <T>(
    method: Method,
    path: string,
    body: any,
  ): Promise<FetchResponse<T> | null> => {
    this.requestCount++;

    const req = {
      method,
      path,
      body,
    };

    if (method === this.method && path === this.path) {
      return {
        statusCode: 200,
        data: await this.callback(req),
        headers: {},
      };
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  /**
   * @inheritdoc
   */
  public getToken = async (): Promise<string | null> => {
    return Promise.resolve('xxxxxx');
  };

  /**
   * @inheritdoc
   */
  public hasToken = (): boolean => {
    return true;
  };
}
