export interface ICommand<TParams, TReturn = unknown> {
  exec(params: TParams): Promise<TReturn> | TReturn;
}
