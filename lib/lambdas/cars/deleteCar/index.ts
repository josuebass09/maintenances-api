import {deleteRecord} from '../../../services/dynamo';
import {HttpStatus} from '../../../models/http';
import {buildResponse} from '../../../utils/httpHelper';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {CarKeys} from '../../../models/car';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.debug('EVENT: \n' + JSON.stringify(event, null, 2));

  const tableName = process.env.carsTable as string;
  const value = event.pathParameters!.licensePlate!;
  const key = CarKeys.PrimaryKey;

  try {
    const deleted = (await deleteRecord(tableName, key, value)).success;
    if (!deleted) {
      return buildResponse(HttpStatus.BAD_REQUEST, {
        message: 'Car record could not be deleted'
      });
    }

    return buildResponse(HttpStatus.OK, deleted);

  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error deleting the car record',
      error: error.message
    });
  }
};
