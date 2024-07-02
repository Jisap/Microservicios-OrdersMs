import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, PaidOrderDto } from './dto';


@Controller()
export class OrdersController {
  
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {                       // createOrderDto solo contiene los items
    const order = await this.ordersService.create(createOrderDto);                // Se crea la order
    const paymentSession = await this.ordersService.createPaymentSession(order)   // Se crea la paymentSession desde el OrderController -> OrderService -> PaymentController -> PaymentService ->
    return {                                                                      // -> Construcción de la session con la instancia de stripe -> Pago -> stripe comunica el pago vía webhook
      order,                                                                      // -> stripeWebhook en paymentService -> emisión evento 'payment.succeeded' a orderController -> orderService -> modificación de la bd (paid: true)  
      paymentSession
    }
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto){ // id y status
    return this.ordersService.changeStatus(changeOrderStatusDto)
  }

  @EventPattern('payment.succeeded')                 // Escuchamos el evento generado por stripeWebhook de payments-ms
  paidOrder(@Payload() paidOrderDto: PaidOrderDto) { // El payload contiene stripePaymentId, orderId y el receiptUrl -> paidOrder
    return this.ordersService.paidOrder(paidOrderDto)
  }
}
