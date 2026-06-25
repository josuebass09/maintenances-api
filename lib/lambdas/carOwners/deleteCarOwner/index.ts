import { deleteRecord } from '../../../services/dynamo';
import { CarOwnerKeys } from '../../../models/carOwner';
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
    const { success } = await deleteRecord(tableName, CarOwnerKeys.PrimaryKey, id);
    if (!success) {
      return buildResponse(HttpStatus.NOT_FOUND, { message: 'Car owner not found or could not be deleted' });
    }

    return buildResponse(HttpStatus.OK, { message: 'Car owner successfully deleted' });
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error deleting car owner',
      error: error.message,
    });
  }
};
