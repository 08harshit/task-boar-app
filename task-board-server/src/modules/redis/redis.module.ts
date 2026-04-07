import { Global, Module } from '@nestjs/common';
import { TaskLockService } from './task-lock.service';

@Global()
@Module({
    providers: [TaskLockService],
    exports: [TaskLockService],
})
export class RedisModule {}
