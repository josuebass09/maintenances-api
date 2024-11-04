import {v4 as uuidv4} from 'uuid';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  ScanCommandInput,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export type UpdateResult<T> = {
    item: T | undefined;
};

export const addRecord = async(tableName: string, item: any) => {
  const maintenanceItem = {
    id: uuidv4(),
    ...item,
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: maintenanceItem
  });

  await docClient.send(command);
  return maintenanceItem;
};

export async function scanTable(tableName: string) {
  //TODO: type the response of this method
  const items: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;
  do {
    const params: ScanCommandInput = {
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    try {
      const command = new ScanCommand(params);
      const response = await docClient.send(command);

      if (response.Items) {
        items.push(...response.Items);
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } catch (error) {
      console.error('Error scanning DynamoDB table:', error);
      throw error;
    }
  } while (lastEvaluatedKey);

  return items;
}

export async function findRecord<T>(tableName: string, key: string, value: string) {
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: { [key]: value }
    });


    const response = await docClient.send(command);

    if (!response.Item) {
      return undefined;
    }

    return response.Item as T;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error retrieving the maintenance record');
  }
}

export async function updateRecord<T>(
  tableName: string,
  key: string,
  value: string,
  updateFields: Partial<T>
): Promise<UpdateResult<T>> {
  try {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    expressionAttributeNames['#pk'] = key;

    Object.entries(updateFields).forEach(([field, fieldValue]) => {
      const attributeNameKey = `#${field}`;
      const attributeValueKey = `:${field}`;

      updateExpressions.push(`${attributeNameKey} = ${attributeValueKey}`);
      expressionAttributeNames[attributeNameKey] = field;
      expressionAttributeValues[attributeValueKey] = fieldValue;
    });

    const command = new UpdateCommand({
      TableName: tableName,
      Key: { [key]: value },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);

    if (!response) {
      return {
        item: undefined
      };
    }

    return {
      item: response.Attributes as T
    };

  } catch (error: any) {
    console.log('there was an error when updating the record', error);
    return {
      item: undefined
    };
  }
}

export async function deleteRecord(
  tableName: string,
  key: string,
  value: string
): Promise<{success: boolean }> {
  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { [key]: value },
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        '#pk': key
      },
      ReturnValues: 'ALL_OLD'
    });

    await docClient.send(command);

    return {
      success: true
    };

  } catch (error: any) {
    console.error('There was an error deleting the record', error);
    return {
      success: false
    };
  }
}
