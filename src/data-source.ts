import "reflect-metadata";
import { DataSource } from "typeorm";
import { RefreshToken } from './modules/tokens/entities/refresh-token.entity';
import { User } from './modules/users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'paypay',
  synchronize: false, // NEVER USE in production
  entities: [User, RefreshToken],
  migrations: ["src/migrations/*.ts"],  
  migrationsTableName: "migrations",
  subscribers: [],
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });