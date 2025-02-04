import {updateRecord, UpdateResult} from '../../../services/dynamo';
import {Car, CarKeys} from '../../../models/car';
import {HttpStatus} from '../../../models/http';
import {buildResponse} from '../../../utils/httpHelper';
import {APIGatewayProxyEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));

  const tableName = process.env.carsTable as string;
  const value = event.pathParameters?.licensePlate!;
  const key = CarKeys.PrimaryKey;
  const payload: Partial<Car> | null = JSON.parse(event.body as string);

  if (!payload) {
    return buildResponse(HttpStatus.BAD_REQUEST, {
      message: 'Payload cannot be empty',
    });
  }

  try {
    const car: UpdateResult<Car> = await updateRecord<Car>(tableName, key, value, payload);
    if (!car.item) {
      return buildResponse(HttpStatus.NOT_FOUND, {
        message: 'Car record could not be updated'
      });
    }

    return buildResponse(HttpStatus.OK, car);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error updating the car record',
      error: error.message
    });
  }
};
