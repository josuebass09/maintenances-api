import { Maintenance } from '../../../models/maintenance';
import { addRecord } from '../../../services/dynamo';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { HttpStatus } from '../../../models/http';
import { getDateInMonths } from '../../../utils/dateHelper';
import { buildResponse } from '../../../utils/httpHelper';
import { MaintenanceRequestSchema, parseBody } from '../../../utils/validation';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.maintenanceTable as string;

  const parsed = parseBody(MaintenanceRequestSchema, event.body);
  if ('error' in parsed) {
    return buildResponse(HttpStatus.BAD_REQUEST, { message: parsed.error });
  }

  const body = parsed.data;
  const today = new Date();
  const intervalMonths = body.intervalMonths ?? 6;

  const maintenance: Maintenance = {
    name: body.name,
    type: body.type,
    currentMaintenance: today.toISOString(),
    nextMaintenance: getDateInMonths(today, intervalMonths).toISOString(),
    product: body.product,
    odometer: body.odometer,
    carId: body.carId,
    ownerId: body.ownerId,
    intervalMonths,
  };

  try {
    const newItem = await addRecord(tableName, maintenance);
    return buildResponse(HttpStatus.CREATED, {
      message: `${newItem.name} successfully added`,
      item: newItem,
    });
  } catch (error: any) {
    console.error('Error adding maintenance item to DynamoDB:', error);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding maintenance item to DynamoDB',
      error: error.message,
    });
  }
};
