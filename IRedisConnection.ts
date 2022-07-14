import { Redis as RedisConnection } from 'ioredis';

export interface IRedisConnection{
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  quit(): Promise<void>;
  isConnected(): Boolean;
  getClient(): Promise<RedisConnection>;
}
