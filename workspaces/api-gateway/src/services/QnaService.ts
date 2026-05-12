interface IQnaRequestParams {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: string;
  contentType?: string;
  headers?: Record<string, string>;
}

export class QnaService {
  readonly #baseUrl: string;

  constructor() {
    this.#baseUrl = process.env.QNA_SERVICE_URL ?? 'http://localhost:3005';
  }

  public async request({
    method,
    path,
    body,
    contentType = 'application/json',
    headers: extraHeaders = {},
  }: IQnaRequestParams): Promise<Response> {
    const url = new URL(path, this.#baseUrl);
    const headers: Record<string, string> = { ...extraHeaders };

    if (body !== undefined) {
      headers['content-type'] = contentType;
    }

    return fetch(url, {
      method,
      body,
      headers,
    });
  }
}
