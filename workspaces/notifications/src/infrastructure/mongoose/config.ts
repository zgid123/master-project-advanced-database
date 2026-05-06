import mongoose, { type Connection } from 'mongoose';

export type TMongoose = Connection;

let cachedConnection: TMongoose | undefined;

export async function createMongoose({
  uri = process.env.MONGODB_URI,
}: {
  uri?: string;
} = {}): Promise<TMongoose> {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);

  cachedConnection = mongoose.connection;

  return cachedConnection;
}
