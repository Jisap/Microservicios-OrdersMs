import { OrderStatus } from "@prisma/client";
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, ValidateNested } from "class-validator";
//import { OrderStatusList } from "../enum/order.enum";
import { OrderItemDto } from "./order-item.dto";
import { Type } from "class-transformer";


export class CreateOrderDto {

  // @IsNumber()
  // @IsPositive()
  // totalAmount: number;

  // @IsNumber()
  // @IsPositive()
  // totalItems: number;

  // @IsEnum(OrderStatusList, {
  //   message: `Possible status values are ${OrderStatusList}` // Mensaje si hay error en el orderStatus proporcionado
  // })
  // @IsOptional()
  // status: OrderStatus = OrderStatus.PENDING;

  // @IsBoolean()
  // @IsOptional()
  // paid: boolean = false;
  
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({each: true})
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
