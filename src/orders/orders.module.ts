import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
//import { ClientsModule, Transport } from '@nestjs/microservices';
//import { envs } from '../config/envs';
//import { PRODUCT_SERVICE } from 'src/config';
import { NatsModule } from 'src/transports/nats.module';


@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    //ClientsModule.register([ // Comunicación con products_microservice
      // {
      //   name: PRODUCT_SERVICE,    // Injection token (nombre del servicio)
      //   transport: Transport.TCP,
      //   options: {
      //     host: envs.productsMicroservicesHost, // host
      //     port: envs.productsMicroservicesPort  // port
      //   }
      // }
      //])
    NatsModule
  ]
})
export class OrdersModule {}
