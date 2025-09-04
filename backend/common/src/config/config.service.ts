import { Injectable } from '@nestjs/common';
import { appConfig } from './index';

@Injectable()
export class ConfigService {
  NODE_ENV = appConfig.NODE_ENV;
  PORT = appConfig.PORT;
  DATABASE_URL = appConfig.DATABASE_URL;
}
