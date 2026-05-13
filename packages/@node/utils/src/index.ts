export * from './string';

export type TPagyParam = number | string | null | undefined;

export interface IParsePagyParams {
  page?: TPagyParam;
  limit?: TPagyParam;
}

export interface IParsedPagy {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagy({ limit, page }: IParsePagyParams = {}): IParsedPagy {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 20;

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  };
}
