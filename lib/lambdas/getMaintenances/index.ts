import {scanTable} from '../../services/dynamo';
import {Maintenance} from '../../models/maintenance';
import {HttpStatus} from '../../models/http';
import {buildResponse} from '../../utils/httpHelper';

export const handler = async (event: any) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.maintenanceTable as string;
  try {
    const maintenances: Maintenance[] = await scanTable(tableName);
    return buildResponse(HttpStatus.OK, maintenances);
  }
  catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the maintenances',
      error: error.message
    });
  }
};
