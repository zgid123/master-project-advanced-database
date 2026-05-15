interface IAuthRequestParams {
  body: string;
  contentType?: string;
}

interface IAuthenticatedRequestParams {
  userId: string;
  authToken: string;
}

interface IAuthenticatedSubstackParams {
  authToken: string;
  slug: string;
}

interface IProfileParams {
  authToken: string;
}

interface IListSubstacksParams {
  search?: string;
}

interface IGetSubstackBySlugParams {
  slug: string;
}

interface ISubstackRequestParams {
  authToken: string;
  body: string;
  contentType?: string;
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

  public async signOut(params: IAuthRequestParams): Promise<Response> {
    return this.#post('/v1/auth/sign-out', params);
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

  public async getSubstackBySlug({
    slug,
  }: IGetSubstackBySlugParams): Promise<Response> {
    return this.#request({
      method: 'GET',
      path: `/v1/substacks/${encodeURIComponent(slug)}`,
    });
  }

  public async listOwnedSubstacks({
    authToken,
    search = '',
  }: Pick<ISubstackRequestParams, 'authToken'> & {
    search?: string;
  }): Promise<Response> {
    const upstreamUrl = new URL('/v1/substacks/owned', this.#baseUrl);
    upstreamUrl.search = search;

    return this.#authenticatedRequest({
      authToken,
      method: 'GET',
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
    });
  }

  public async createSubstack({
    authToken,
    body,
    contentType,
  }: ISubstackRequestParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      body,
      contentType,
      method: 'POST',
      path: '/v1/substacks',
    });
  }

  public async updateSubstack({
    authToken,
    body,
    contentType,
    slug,
  }: ISubstackRequestParams & { slug: string }): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      body,
      contentType,
      method: 'PUT',
      path: `/v1/substacks/${encodeURIComponent(slug)}`,
    });
  }

  public async deleteSubstack({
    authToken,
    slug,
  }: IAuthenticatedSubstackParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'DELETE',
      path: `/v1/substacks/${encodeURIComponent(slug)}`,
    });
  }

  public async subscribeSubstack({
    authToken,
    slug,
  }: IAuthenticatedSubstackParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'POST',
      path: `/v1/substacks/${encodeURIComponent(slug)}/subscribe`,
    });
  }

  public async unsubscribeSubstack({
    authToken,
    slug,
  }: IAuthenticatedSubstackParams): Promise<Response> {
    return this.#authenticatedRequest({
      authToken,
      method: 'DELETE',
      path: `/v1/substacks/${encodeURIComponent(slug)}/subscribe`,
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
    body,
    contentType = 'application/json',
  }: {
    path: string;
    authToken: string;
    body?: string;
    contentType?: string;
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  }): Promise<Response> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${authToken}`,
    };

    if (body !== undefined) {
      headers['content-type'] = contentType;
    }

    return fetch(new URL(path, this.#baseUrl), {
      body,
      method,
      headers,
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
