interface IAuthRequestParams {
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
}
