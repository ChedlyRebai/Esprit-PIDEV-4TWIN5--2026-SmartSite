import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IncidentsModule } from "./incidents/incidents.module";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/smartsite",
    ),
    IncidentsModule,
  ],
})
export class AppModule {}
