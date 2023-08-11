import { IFetch, FetchResponse, Method } from './types';

type Callback = (body: any) => Promise<FetchResponse<any> | null>;

/**
 * Fetcher used for testing.
 */
export class TestingFetch implements IFetch {
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
  public request = async <T>(
    method: Method,
    path: string,
    body: any,
  ): Promise<FetchResponse<T> | null> => {
    if (method === this.method && path === this.path) {
      return await this.callback(body);
    }

    return Promise.resolve({
      statusCode: 404,
      data: {},
      headers: {},
    });
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
