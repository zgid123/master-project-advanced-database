interface IAuthRequestParams {
  body: string;
  contentType?: string;
}

interface IAuthenticatedRequestParams {
  userId: string;
  authToken: string;
}

interface IProfileParams {
  authToken: string;
}

interface IListSubstacksParams {
  search?: string;
}

export class AuthService {
  readonly #baseUrl: string;

  constructor() {
    this.#baseUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  }

  public async signUp(params: IAuthRequestParams): Promise<Response> {
    return this.#post('/v1/auth/sign-up', params);
  }

  public async signIn(params: IAuthRequestParams): Promise<Response> {
    return this.#post('/v1/auth/sign-in', params);
  }

  public async refresh(params: IAuthRequestParams): Promise<Response> {
    return this.#post('/v1/auth/refresh', params);
  }

  public async profile({ authToken }: IProfileParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'GET',
      path: '/v1/auth/profile',
    });
  }

  public async subscribeUser({
    userId,
    authToken,
  }: IAuthenticatedRequestParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'POST',
      path: `/v1/auth/users/${userId}/subscribe`,
    });
  }

  public async unsubscribeUser({
    userId,
    authToken,
  }: IAuthenticatedRequestParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'DELETE',
      path: `/v1/auth/users/${userId}/subscribe`,
    });
  }

  public async listSubstacks({
    search = '',
  }: IListSubstacksParams = {}): Promise<Response> {
    const upstreamUrl = new URL('/v1/substacks', this.#baseUrl);
    upstreamUrl.search = search;

    return this.#request({
      method: 'GET',
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
    });
  }

  public async getTotalSubstacks(): Promise<Response> {
    return this.#request({
      method: 'GET',
      path: '/v1/substacks/total',
    });
  }

  async #post(
    path: string,
    { body, contentType = 'application/json' }: IAuthRequestParams,
  ): Promise<Response> {
    return fetch(new URL(path, this.#baseUrl), {
      body,
      method: 'POST',
      headers: {
        'content-type': contentType,
      },
    });
  }

  async #authenticatedRequest({
    path,
    method,
    authToken,
  }: {
    path: string;
    authToken: string;
    method: 'DELETE' | 'GET' | 'POST';
  }): Promise<Response> {
    return fetch(new URL(path, this.#baseUrl), {
      method,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
  }

  async #request({
    path,
    method,
  }: {
    path: string;
    method: 'GET';
  }): Promise<Response> {
    return fetch(new URL(path, this.#baseUrl), {
      method,
    });
  }
}
