import { addRecord } from '../../../services/dynamo';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { CarOwnerSchema, parseBody } from '../../../utils/validation';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../../models/carOwner';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carOwnersTable as string;

  const parsed = parseBody(CarOwnerSchema, event.body);
  if ('error' in parsed) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: parsed.error });
  }

  const { notificationPreferences, ...rest } = parsed.data;

  const ownerData = {
    ...rest,
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...notificationPreferences,
    },
  };

  try {
    const newItem = await addRecord(tableName, ownerData);
    return buildResponse(HttpStatus.CREATED, {
      message: 'Car owner successfully created',
      item: newItem,
    });
  } catch (error: any) {
    console.error('Error adding car owner to DynamoDB:', error);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding car owner to DynamoDB',
      error: error.message,
    });
  }
};
