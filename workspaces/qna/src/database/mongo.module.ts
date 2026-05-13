import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ??
        'mongodb://localhost:27017/qna?replicaSet=rs0&directConnection=true',
    ),
  ],
})
export class MongoModule {}
