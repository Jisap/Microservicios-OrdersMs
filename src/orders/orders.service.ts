import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';
import { NATS_SERVICE, PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';



@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy, // Inyección del servicio de ptos definido en orders module
  ){
    super()
  }
  
  async onModuleInit() {
    await this.$connect(); // Inicialización a la base de datos
    this.logger.log('Database connected')
  }

  async create(createOrderDto: CreateOrderDto) {                                // Se reciben los items
    
    try {

      const productIds = createOrderDto.items.map( item => item.productId )     // Obtenemos de cada item su id

      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds)              // validamos en products_ms esos ids (deben existir en bd)
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {     // Por cada item
        
        const price = products.find(                                            // obtenemos el price (debe de coincidir ids de bd con ids de dto)
          (product) => product.id === orderItem.productId
        ).price

        return acc + price * orderItem.quantity                                 // y dicho price se multiplica por la cantidad + acumulador => TotalAmount

      }, 0)
  
      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {      // Obtenemos el total de items del dto 
        return acc + orderItem.quantity
      }, 0)

      const order = await this.order.create({                                   // Grabación en bd de la order que contendrá items: OrderItemDto[]
        data: {                                                                 // y cada orderItemDto -> productId, quantity y price
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({                                 // Se mapean los items del dto
                price: products.find((product) => product.id === orderItem.productId).price,   // (ids productos de bd === ids items del dto) -> pto.price 
                productId: orderItem.productId,                                                // id del item del dto      
                quantity: orderItem.quantity                                                   // quantity del item del dto 
              }))
            }
          }
        },
        include: {                                                              // Se incluye en la order la relación de order con orderItem  
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      })

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find(product => product.id === orderItem.productId).name
        }))
      
      }
      
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs'
      })
    }

    
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {

    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status
      }
    })

    const currentPage = orderPaginationDto.page;  // Página actual desde donde se quiere empezar a buscar
    const perPage = orderPaginationDto.limit;     // registros por página

    return {
      data: await this.order.findMany({           
        skip: ( currentPage - 1 ) * perPage,      // Se saltan los registros correspondientes a la página actual *  el limit
        take: perPage,                            // se mostrarán los registros según el limit
        where: {
          status: orderPaginationDto.status       // y de esos registros los que coincidam con el status del query
        }
      }),
      meta: {                                     // Ademas se mostrará la información meta de la busqueda
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)
      }
    }
  }

  async findOne(id: string) {
    
    const order = await this.order.findFirst({    // order por id con sus relaciones OrderItem
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          }
        }
      }
    });

    if(!order){
      throw new RpcException({
        status: HttpStatus.NOT_FOUND, 
        message: `Order with id ${id} not found`
      });
    }

    const productIds = order.OrderItem.map(orderItem => orderItem.productId)  // Obtenemos de cada item su id

    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productIds)      // validamos en products_ms esos ids (deben existir en bd)
    );
    
    return {                                                                        // retornamos
      ...order,                                                                     // la order según id
      OrderItem: order.OrderItem.map( orderItem => ({                               // de cada item
        ...orderItem,                                                               // todas sus propiedades  
        name: products.find( product => product.id === orderItem.productId ).name   // y el name en bd de products-ms segun product.id = id de la orderItem
      }))
    }
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto){

    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);
    if( order.status === status ){
      return order
    }

    return this.order.update({
      where: { id },
      data: {
        status: status
      }
    })
  }
}
