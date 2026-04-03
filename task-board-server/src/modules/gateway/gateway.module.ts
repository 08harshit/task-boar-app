import { Module, Global } from '@nestjs/common';
import { BoardGateway } from '../boards/gateways/board.gateway';
import { CollaborationService } from './collaboration.service';

@Global()
@Module({
    providers: [BoardGateway, CollaborationService],
    exports: [BoardGateway, CollaborationService],
})
export class GatewayModule { }
