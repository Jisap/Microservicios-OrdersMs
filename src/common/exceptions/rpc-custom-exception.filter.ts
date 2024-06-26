import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)                                                        // Atrapamos la exception de tipo Rpc
export class RpcCustomExceptionFilter implements ExceptionFilter {          // La clase RpcCustomExceptionFilter que implementa la interfaz ExceptionFilter. Esto obliga a la clase a definir el método catch.
  
  catch(exception: RpcException, host: ArgumentsHost) {                     // El método catch recibe dos argumentos: la exception y el contexto de la misma

    const ctx = host.switchToHttp()                   // Contexto
    const response = ctx.getResponse()                // Objeto de respuesta http desde El contexto 

    const rpcError = exception.getError()             // Error desde la exception

    if( typeof rpcError === 'object' &&               // verificacion de si el error es un objeto
      'status' in rpcError &&                         // si tiene un status
      'message' in rpcError                           // y un message
    ){
      const status = isNaN(+rpcError.status)          // Si tiene todo lo anterior se define el status
        ? 400 
        : +rpcError.status;                 
      return response.status(status).json(rpcError)   // y se introduce en la response
    }

    response.status(400).json({                       // Si rpcError no cumple con las condiciones anteriores, badRequest y mensaje de error
      status: 400,
      message: rpcError
    })
  }
}