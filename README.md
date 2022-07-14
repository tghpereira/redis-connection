# REDIS CONNECT

Pequena Classe para tratativa de conexão com a lib ioredis e facilitação de injeção de dependência com tsyringe.

***Busca tratar***
- Multiplas instâncias de conexão redis não desejadas.
- Impossibilidade de injeção de dependência.

### 🔗 Links
### @aluiziodeveloper 
[![portfolio](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aluiziodeveloper)


## Autores

- [@tghpereira](https://github.com/tghpereira)
- [@luin/ioredis](https://github.com/luin/ioredis)

## Instalação

```bash
  yarn add ioredis
  Clone este repositório
```

## Documentação

| Métodos   | Tipo       | Retorno | Descrição                           |
| :---------- | :--------- | :--------- |:---------------------------------- |
| `initialize` | `function` | `void` | Inicia conexão com redis. |
| `destroy` | `function` |`void` |Fecha a conexão imediatamente. |
| `quit` | `function` |`void` |Fecha a conexão e aguarda as respostas pendentes. |
| `isConnected` | `function` |`Boolean` |Pegue o status da conexão. |
| `getClient` | `function` |`RedisConnection` |Pegue o cliente da conexão. |
## Uso/Exemplos

### Crie um arquivo de configuração.
```typescript
import { RedisOptions } from 'ioredis';
import { DataRedis } from "@libs/redis-connection/implementations/RedisConnection";

interface ICacheConfig {
  config: {
    redis: RedisOptions;
  };
  driver: string;
}

const cacheConfig = {
  config: {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASS || undefined,
    },
  },
  driver: 'redis',
} as ICacheConfig;

export const redis = new DataRedis(cacheConfig.config.redis);
```

### Crie um provider
```typescript
import { DataRedis, redis } from '@libs/redis-connection/implementations/RedisConnection';

interface IRedisCacheProvider{
  save(key: string, value: any): Promise<void>;
  findByKey<T>(key: string): Promise<T | null>;
  invalidate(key: string): Promise<void>;
}

export class RedisCacheProvider implements IRedisCacheProvider{
  private connection: DataRedis;

  constructor() {
    this.connection = redis;
  }

  public async save(key: string, value: any): Promise<void> {
    const client = await this.connection.getClient();
    await client.set(key, JSON.stringify(value));
  }

  public async findByKey<T>(key: string): Promise<T | null> {
    const client = await this.connection.getClient();
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    const parsedData = JSON.parse(data) as T;
    return parsedData;
  }

  public async invalidate(key: string): Promise<void> {
    const client = await this.connection.getClient();
    await client.del(key);
  }
}
```

### Use Graceful Shutdown
```typescript
import { app } from './app';
import { redis } from '@libs/redis-connection/implementations/RedisConnection';
export function gracefulShutdown(){
  return (event: string) =>{
    console.info(`[ API REPORT ]: ${event} SIGNAL RECEIVED WITH CODE ${event}`);
    console.info("[ API REPORT ]: CLOSING SERVER")
    app.close(async () => {
      await redis.destroy();
      console.log("[ API REPORT ]: DISCONNECTING CLIENT DATABASE");
      await dataSource.destroy();
      process.exit(0);
    });
  }
}
```

### Importe DataRedis no Index do Server
```typescript
import 'reflect-metadata';
import 'dotenv/config';
import { app, host, port } from '../app/app';
import { dataSource } from '../../typeorm/connection';
import { gracefulShutdown } from '../app/gracefulShutdown';
import { redis } from "@libs/redis-connection/implementations/RedisConnection";

dataSource.initialize().then(async () => {
  console.info(`[ API REPORT ]: CONNECTED TO DATABASE SUCCESSFULLY!`);
  await redis.initialize();
  if(redis.isConnected()){
    console.info(`[ API REPORT ]: CONNECTED TO CACHE SUCCESSFULLY!`);
    app.listen({ host, port }, () => {
      console.info(`[ API REPORT ]: STARTED ON PORT:${port}! 🏆`);
    });
  }
}).catch((error) => {
  console.info("[ API REPORT ]: CONNECTION TO DATABASE FAILED");
  console.error(`[ API REPORT ]: ${error.message.toUpperCase()}`);
});

process.on('SIGINT', gracefulShutdown())

process.on('SIGTERM', gracefulShutdown())

process.on('exit', (code) => {
  console.info(`[ API REPORT ]: EXIT PROCESS ${code}`)
});

process.on('uncaughtException', (error, origin) => {
  console.info(`[ API REPORT ] [ UNCAUGHTEXCEPTION ]: ${origin} - ${error}`)
});

process.on('unhandledRejection', (error, origin) => {
  console.info(`[ API REPORT ] [ UNHANDLEREJECTION ]: ${origin} - ${error}`)
});
```
