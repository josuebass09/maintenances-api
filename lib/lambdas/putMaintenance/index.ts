import {updateRecord, UpdateResult} from '../../services/dynamo';
import {Maintenance, MaintenanceKeys} from '../../models/maintenance';
import {HttpStatus} from '../../models/http';
import {buildResponse} from '../../utils/httpHelper';
import {APIGatewayProxyEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));

  const tableName = process.env.maintenanceTable as string;
  const value = event.pathParameters?.name!;
  const key = MaintenanceKeys.PrimaryKey;
  const payload: Partial<Maintenance> | null = JSON.parse(event.body as string);

  if (!payload) {
    return buildResponse(HttpStatus.BAD_REQUEST, {
      message: 'Payload cannot be empty',
    });
  }

  try {
    const maintenance: UpdateResult<Maintenance> = await updateRecord<Maintenance>(tableName, key, value, payload);
    if (!maintenance.item) {
      return buildResponse(HttpStatus.NOT_FOUND, {
        message: 'Maintenance record could not be updated'
      });
    }

    return buildResponse(HttpStatus.OK, maintenance);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error updating the maintenance record',
      error: error.message
    });
  }
};
