import {Car} from '../../../models/car';
import {addRecord} from '../../../services/dynamo';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {HttpStatus} from '../../../models/http';
import {buildResponse} from '../../../utils/httpHelper';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const tableName = process.env.carsTable as string;
  try {
    const body = event.body;
    if (!body) {
      return buildResponse(HttpStatus.BAD_REQUEST, {
        message: 'The body cannot be empty',
      });
    }
    const parsedBody = JSON.parse(body) as Car;
    const car: Car = {
      vin: parsedBody.vin,
      make: parsedBody.make,
      model: parsedBody.model,
      year: parsedBody.year,
      color: parsedBody.color,
      licensePlate: parsedBody.licensePlate,
      fuel: parsedBody.fuel,
      transmission: parsedBody.transmission,
      odometer: parsedBody.odometer,
      ownerId: parsedBody.ownerId,
    };

    const newItem = await addRecord(tableName, car);
    return buildResponse(HttpStatus.OK, {
      message:`${newItem.licensePlate} successfully added to the table`,
      item: newItem
    });
  } catch (error: any) {
    console.error('Error adding car item to DynamoDB:', error);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error adding car item to DynamoDB',
      error: error.message
    });
  }
};
