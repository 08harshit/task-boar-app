import { Module, Global } from '@nestjs/common';
import { BoardGateway } from '../boards/gateways/board.gateway';

@Global()
@Module({
    providers: [BoardGateway],
    exports: [BoardGateway],
})
export class GatewayModule { }
