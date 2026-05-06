export interface IQuery<TParams, TReturn = unknown> {
  exec(params: TParams): Promise<TReturn> | TReturn;
}
