import {scanTable} from '../../../services/dynamo';
import {HttpStatus} from '../../../models/http';
import {buildResponse} from '../../../utils/httpHelper';
import {Car} from '../../../models/car';

export const handler = async (event: any) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carsTable as string;
  try {
    const cars: Car[] = await scanTable(tableName);
    return buildResponse(HttpStatus.OK, cars);
  }
  catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving the cars',
      error: error.message
    });
  }
};
