import {deleteRecord} from '../../services/dynamo';
import {HttpStatus} from '../../models/http';
import {buildResponse} from '../../utils/httpHelper';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {MaintenanceKeys} from '../../models/maintenance';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));

  const tableName = process.env.maintenanceTable as string;
  const value = event.pathParameters!.name!;
  const key = MaintenanceKeys.PrimaryKey;

  try {
    const deleted = (await deleteRecord(tableName, key, value)).success;
    if (!deleted) {
      return buildResponse(HttpStatus.BAD_REQUEST, {
        message: 'Maintenance record could not be deleted'
      });
    }

    return buildResponse(HttpStatus.OK, deleted);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error deleting the maintenance record',
      error: error.message
    });
  }
};
