import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://admin:hungtruong123@cluster0.htw9pph.mongodb.net/?appName=Cluster0'),
  ],
})
export class MongoModule {}