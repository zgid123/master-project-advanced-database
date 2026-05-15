import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qna?replicaSet=rs0&directConnection=true';
        console.log(`[MongoModule] Connecting to: ${uri}`);
        return { uri };
      },
    }),
  ],
})
export class MongoModule {}
