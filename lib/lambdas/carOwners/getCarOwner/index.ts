import { findRecord } from '../../../services/dynamo';
import { CarOwner, CarOwnerKeys } from '../../../models/carOwner';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carOwnersTable as string;
  const id = event.pathParameters?.id;

  if (!id) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: 'Owner ID is required' });
  }

  try {
    const owner: CarOwner | undefined = await findRecord<CarOwner>(tableName, CarOwnerKeys.PrimaryKey, id);
    if (!owner) {
      return buildResponse(HttpStatus.NOT_FOUND, { message: 'Car owner not found' });
    }

    return buildResponse(HttpStatus.OK, owner);
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving car owner',
      error: error.message,
    });
  }
};
