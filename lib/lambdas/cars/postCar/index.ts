import { addRecord } from '../../../services/dynamo';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';
import { CarSchema, parseBody } from '../../../utils/validation';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carsTable as string;

  const parsed = parseBody(CarSchema, event.body);
  if ('error' in parsed) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: parsed.error });
  }

  try {
    const newItem = await addRecord(tableName, parsed.data);
    return buildResponse(HttpStatus.CREATED, {
      message: `${newItem.licensePlate} successfully added`,
      item: newItem,
    });
  } catch (error: any) {
    console.error('Error adding car item to DynamoDB:', error);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding car item to DynamoDB',
      error: error.message,
    });
  }
};
