import { findRecord } from '../../../services/dynamo';
import {Car, CarKeys} from '../../../models/car';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';

export const handler = async (event: any) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carsTable as string;
  const value = event.pathParameters?.licensePlate;
  const key = CarKeys.PrimaryKey;

  try {
    const car: Car | undefined = await findRecord<Car>(tableName, key, value);
    if (!car) {
      return buildResponse(HttpStatus.NOT_FOUND, {
        message: 'Car record not found'
      });
    }

    return buildResponse(HttpStatus.OK, car);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the car record',
      error: error.message
    });
  }
};
