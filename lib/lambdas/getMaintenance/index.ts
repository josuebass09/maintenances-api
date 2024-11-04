import { findRecord } from '../../services/dynamo';
import {Maintenance, MaintenanceKeys} from '../../models/maintenance';
import { HttpStatus } from '../../models/http';
import { buildResponse } from '../../utils/httpHelper';

export const handler = async (event: any) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.maintenanceTable as string;
  const value = event.pathParameters?.name;
  const key = MaintenanceKeys.PrimaryKey;

  try {
    const maintenance: Maintenance | undefined = await findRecord<Maintenance>(tableName, key, value);
    if (!maintenance) {
      return buildResponse(HttpStatus.NOT_FOUND, {
        message: 'Maintenance record not found'
      });
    }

    return buildResponse(HttpStatus.OK, maintenance);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the maintenance record',
      error: error.message
    });
  }
};
