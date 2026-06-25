import { scanTable } from '../../../services/dynamo';
import { CarOwner } from '../../../models/carOwner';
import { HttpStatus } from '../../../models/http';
import { buildResponse } from '../../../utils/httpHelper';

export const handler = async () => {
  const tableName = process.env.carOwnersTable as string;
  try {
    const owners: CarOwner[] = await scanTable<CarOwner>(tableName);
    return buildResponse(HttpStatus.OK, owners);
  } catch (error: any) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error retrieving car owners',
      error: error.message,
    });
  }
};
