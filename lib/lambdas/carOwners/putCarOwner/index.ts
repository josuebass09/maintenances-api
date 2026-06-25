import { updateRecord, UpdateResult } from '../../../services/dynamo';
import { CarOwner, CarOwnerKeys } from '../../../models/carOwner';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { CarOwnerUpdateSchema, parseBody } from '../../../utils/validation';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));

  const tableName = process.env.carOwnersTable as string;
  const id = event.pathParameters?.id;

  if (!id) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: 'Owner ID is required' });
  }

  const parsed = parseBody(CarOwnerUpdateSchema, event.body);
  if ('error' in parsed) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: parsed.error });
  }

  try {
    const result: UpdateResult<CarOwner> = await updateRecord<CarOwner>(
      tableName, CarOwnerKeys.PrimaryKey, id, parsed.data
    );
    if (!result.item) {
      return buildResponse(HttpStatus.NOT_FOUND, {
        message: 'Car owner not found or could not be updated',
      });
    }

    return buildResponse(HttpStatus.OK, result);
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error updating car owner',
      error: error.message,
    });
  }
};
