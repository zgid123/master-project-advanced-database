export type TEntityJSON<T> = Omit<T, 'id'> & {
  id: string;
};

export type TEntity<T> = T & {
  toJSON(): TEntityJSON<T>;
};
