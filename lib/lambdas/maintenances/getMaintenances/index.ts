import { scanTable, scanTableWithFilter } from '../../../services/dynamo';
import { Maintenance } from '../../../models/maintenance';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.maintenanceTable as string;
  const ownerId = event.queryStringParameters?.ownerId;
  const carId = event.queryStringParameters?.carId;

  try {
    let maintenances: Maintenance[];

    if (ownerId && carId) {
      maintenances = await scanTableWithFilter<Maintenance>(
        tableName,
        '#ownerId = :ownerId AND #carId = :carId',
        { ':ownerId': ownerId, ':carId': carId },
        { '#ownerId': 'ownerId', '#carId': 'carId' }
      );
    } else if (ownerId) {
      maintenances = await scanTableWithFilter<Maintenance>(
        tableName,
        '#ownerId = :ownerId',
        { ':ownerId': ownerId },
        { '#ownerId': 'ownerId' }
      );
    } else if (carId) {
      maintenances = await scanTableWithFilter<Maintenance>(
        tableName,
        '#carId = :carId',
        { ':carId': carId },
        { '#carId': 'carId' }
      );
    } else {
      maintenances = await scanTable<Maintenance>(tableName);
    }

    return buildResponse(HttpStatus.OK, maintenances);
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the maintenances',
      error: error.message,
    });
  }
};
