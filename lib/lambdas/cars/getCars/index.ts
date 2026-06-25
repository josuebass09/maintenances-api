import { scanTable, scanTableWithFilter } from '../../../services/dynamo';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { Car } from '../../../models/car';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carsTable as string;
  const ownerId = event.queryStringParameters?.ownerId;

  try {
    const cars: Car[] = ownerId
      ? await scanTableWithFilter<Car>(
        tableName,
        '#ownerId = :ownerId',
        { ':ownerId': ownerId },
        { '#ownerId': 'ownerId' }
      )
      : await scanTable<Car>(tableName);

    return buildResponse(HttpStatus.OK, cars);
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the cars',
      error: error.message,
    });
  }
};
