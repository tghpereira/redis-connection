import Redis, { Redis as RedisConnection, RedisOptions } from 'ioredis';
import { IRedisConnection } from './IRedisConnection';
import cacheConfig from '@config/cache/redis';

export class DataRedis implements IRedisConnection{
  private connectionOptions: RedisOptions;
  private connection: RedisConnection;
  private clientConnected = false;

  constructor(connect: RedisOptions){
    this.connectionOptions = connect;
  }

  public async initialize(): Promise<void>{
    return new Promise((resolve, reject) => {
      this.connection = new Redis(this.connectionOptions);

      this.connection.once('ready', async () => {
        resolve();
        this.clientConnected = true;
      });

      this.connection.once('error', () => {
        this.clientConnected = false;
        reject(new Error())
      });
    });
  }

  public async destroy(): Promise<void>{
    console.log("[ API REPORT ]: DISCONNECTING CLIENT REDIS");
    this.clientConnected = false;
    this.connection.disconnect(false);
  }

  public async quit(): Promise<void>{
    this.clientConnected = false;
    this.connection.quit();
  }

  public isConnected(): Boolean{
    return this.clientConnected;
  }

  public async getClient(): Promise<RedisConnection>{
    return this.connection;
  }
}

export const redis = new DataRedis(cacheConfig.config.redis);

