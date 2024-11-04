import {Maintenance, MaintenanceRequest} from '../../models/maintenance';
import {addRecord} from '../../services/dynamo';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {HttpStatus} from '../../models/http';
import {getDateInSixMonths} from '../../utils/dateHelper';
import {buildResponse} from '../../utils/httpHelper';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.maintenanceTable as string;
  try {
    const body = event.body;
    if (!body) {
      return buildResponse(HttpStatus.BAD_REQUEST, {
        message: 'The body cannot be empty',
      });
    }
    const parsedBody = JSON.parse(body) as MaintenanceRequest;
    const today = new Date();
    const maintenance: Maintenance = {
      name: parsedBody.name,
      type: parsedBody.type,
      currentMaintenance: today.toISOString(),
      nextMaintenance: getDateInSixMonths(today).toISOString(),
      product: parsedBody.product,
      odometer: parsedBody.odometer,
    };

    const newItem = await addRecord(tableName, maintenance);
    return buildResponse(HttpStatus.OK, {
      message:`${newItem.name} successfully added to the table`,
      item: newItem
    });
  } catch (error: any) {
    console.error('Error adding maintenance item to DynamoDB:', error);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding maintenance item to DynamoDB',
      error: error.message
    });
  }
};
