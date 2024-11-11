import {DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand} from '@aws-sdk/lib-dynamodb';
import {addRecord, deleteRecord, findRecord, scanTable, updateRecord} from '../../lib/services/dynamo';
import {v4 as uuidv4} from 'uuid';
import {Maintenance, MaintenanceRequest} from "../../lib/models/maintenance";
import {createMockMaintenanceRecord} from "../mocks/maintenances";

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => {
    const mockSend = jest.fn();
    return {
        DynamoDBDocumentClient: {
            from: jest.fn(() => ({send: mockSend}))
        },
        PutCommand: jest.fn(),
        ScanCommand: jest.fn(),
        GetCommand: jest.fn(),
        UpdateCommand: jest.fn(),
        DeleteCommand: jest.fn(),
    };
});

jest.mock('uuid');

describe('Dynamo Service', () => {
    describe('addRecord', () => {
        let mockSend: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockSend = (DynamoDBDocumentClient.from as jest.Mock)().send;
            (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should successfully add a record to DynamoDB', async () => {
            const tableName = 'TestTable';
            const itemToAdd = {name: 'Test Item', description: 'Test Description'};
            mockSend.mockResolvedValueOnce({});
            const result = await addRecord(tableName, itemToAdd);
            expect(PutCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Item: {
                    id: 'mocked-uuid',
                    name: 'Test Item',
                    description: 'Test Description',
                    createdAt: '2024-01-01T00:00:00.000Z'
                }
            });
            expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(result).toEqual({
                id: 'mocked-uuid',
                name: 'Test Item',
                description: 'Test Description',
                createdAt: '2024-01-01T00:00:00.000Z'
            });
        });

        it('should throw an error when DynamoDB operation fails', async () => {
            const tableName = 'TestTable';
            const itemToAdd = {name: 'Test Item'};
            const mockError = new Error('DynamoDB error');
            mockSend.mockRejectedValueOnce(mockError);
            await expect(addRecord(tableName, itemToAdd)).rejects.toThrow('DynamoDB error');
        });

        it('should generate unique IDs for different records', async () => {
            const tableName = 'TestTable';
            const firstItem = {name: 'First Item'};
            const secondItem = {name: 'Second Item'};
            (uuidv4 as jest.Mock).mockReturnValueOnce('first-uuid').mockReturnValueOnce('second-uuid');
            mockSend.mockResolvedValue({});
            const record1 = await addRecord(tableName, firstItem);
            const record2 = await addRecord(tableName, secondItem);
            expect(record1.id).toBe('first-uuid');
            expect(record2.id).toBe('second-uuid');
            expect(record1.id).not.toBe(record2.id);
        });
    });

    describe('scanTable', () => {
        let mockSend: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockSend = (DynamoDBDocumentClient.from as jest.Mock)().send;
        });

        it('should retrieve all items from a single scan', async () => {
            const tableName = 'TestTable';
            const mockItems = [{id: '1', name: 'Item 1'}, {id: '2', name: 'Item 2'}];
            mockSend.mockResolvedValueOnce({Items: mockItems, LastEvaluatedKey: undefined});
            const result = await scanTable(tableName);
            expect(ScanCommand).toHaveBeenCalledWith({TableName: tableName, ExclusiveStartKey: undefined});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockItems);
        });

        it('should handle pagination and retrieve all items', async () => {
            const tableName = 'TestTable';
            const firstBatch = [{id: '1', name: 'Item 1'}, {id: '2', name: 'Item 2'}];
            const secondBatch = [{id: '3', name: 'Item 3'}, {id: '4', name: 'Item 4'}];
            mockSend.mockResolvedValueOnce({Items: firstBatch, LastEvaluatedKey: {id: '2'}});
            mockSend.mockResolvedValueOnce({Items: secondBatch, LastEvaluatedKey: undefined});
            const result = await scanTable(tableName);
            expect(ScanCommand).toHaveBeenNthCalledWith(1, {TableName: tableName, ExclusiveStartKey: undefined});
            expect(ScanCommand).toHaveBeenNthCalledWith(2, {TableName: tableName, ExclusiveStartKey: {id: '2'}});
            expect(mockSend).toHaveBeenCalledTimes(2);
            expect(result).toEqual([...firstBatch, ...secondBatch]);
        });

        it('should handle empty response from DynamoDB', async () => {
            const tableName = 'TestTable';
            mockSend.mockResolvedValueOnce({Items: [], LastEvaluatedKey: undefined});
            const result = await scanTable(tableName);
            expect(ScanCommand).toHaveBeenCalledWith({TableName: tableName, ExclusiveStartKey: undefined});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it('should handle missing Items in response', async () => {
            const tableName = 'TestTable';
            mockSend.mockResolvedValueOnce({LastEvaluatedKey: undefined});
            const result = await scanTable(tableName);
            expect(ScanCommand).toHaveBeenCalledWith({TableName: tableName, ExclusiveStartKey: undefined});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it('should throw error when scan fails', async () => {
            const tableName = 'TestTable';
            const mockError = new Error('DynamoDB scan error');
            mockSend.mockRejectedValueOnce(mockError);
            await expect(scanTable(tableName)).rejects.toThrow('DynamoDB scan error');
            expect(ScanCommand).toHaveBeenCalledWith({TableName: tableName, ExclusiveStartKey: undefined});
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should handle error in middle of pagination', async () => {
            const tableName = 'TestTable';
            const firstBatch = [{id: '1', name: 'Item 1'}];
            mockSend.mockResolvedValueOnce({Items: firstBatch, LastEvaluatedKey: {id: '1'}});
            const mockError = new Error('DynamoDB scan error');
            mockSend.mockRejectedValueOnce(mockError);
            await expect(scanTable(tableName)).rejects.toThrow('DynamoDB scan error');
            expect(ScanCommand).toHaveBeenNthCalledWith(1, {TableName: tableName, ExclusiveStartKey: undefined});
            expect(ScanCommand).toHaveBeenNthCalledWith(2, {TableName: tableName, ExclusiveStartKey: {id: '1'}});
            expect(mockSend).toHaveBeenCalledTimes(2);
        });
    });

    describe('findRecord', () => {
        let mockSend: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockSend = (DynamoDBDocumentClient.from as jest.Mock)().send;
        });

        it('should successfully retrieve an existing record', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const mockItem = {id: '123', name: 'Test Item', description: 'Test Description'};
            mockSend.mockResolvedValueOnce({Item: mockItem});
            const result = await findRecord(tableName, key, value);
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockItem);
        });

        it('should return undefined when record is not found', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = 'non-existent';
            mockSend.mockResolvedValueOnce({Item: undefined});
            const result = await findRecord(tableName, key, value);
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toBeUndefined();
        });

        it('should handle empty response from DynamoDB', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            mockSend.mockResolvedValueOnce({});
            const result = await findRecord(tableName, key, value);
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toBeUndefined();
        });

        it('should throw error with custom message when DynamoDB operation fails', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const mockError = new Error('DynamoDB error');
            mockSend.mockRejectedValueOnce(mockError);
            await expect(findRecord(tableName, key, value)).rejects.toThrow('Error retrieving the maintenance record');
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('should work with different key names', async () => {
            const tableName = 'TestTable';
            const key = 'email';
            const value = 'test@example.com';
            const mockItem = {email: 'test@example.com', name: 'Test User'};
            mockSend.mockResolvedValueOnce({Item: mockItem});
            const result = await findRecord(tableName, key, value);
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockItem);
        });

        it('should handle typed responses correctly', async () => {
            interface TestType {id: string; count: number; isActive: boolean;}
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const mockItem: TestType = {id: '123', count: 42, isActive: true};
            mockSend.mockResolvedValueOnce({Item: mockItem});
            const result = await findRecord<TestType>(tableName, key, value);
            expect(GetCommand).toHaveBeenCalledWith({TableName: tableName, Key: {[key]: value}});
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockItem);
            if (result) {
                expect(typeof result.id).toBe('string');
                expect(typeof result.count).toBe('number');
                expect(typeof result.isActive).toBe('boolean');
            }
        });
    });

    describe('updateRecord', () => {
        let mockSend: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockSend = (DynamoDBDocumentClient.from as jest.Mock)().send;
        });

        it('should successfully update a single field', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const updateFields: Partial<Maintenance> = {name: 'Updated Name'};
            const updatedItem: MaintenanceRequest = createMockMaintenanceRecord({name: 'Update Name'});
            mockSend.mockResolvedValueOnce({Attributes: updatedItem});
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(UpdateCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                UpdateExpression: 'SET #name = :name',
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': 'id', '#name': 'name'},
                ExpressionAttributeValues: {':name': 'Updated Name'},
                ReturnValues: 'ALL_NEW'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.item).toEqual(updatedItem);
        });

        it('should successfully update multiple fields', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const updateFields: Partial<Maintenance> = {name: 'Updated Name', odometer: 50000};
            const updatedItem: Maintenance = createMockMaintenanceRecord();
            mockSend.mockResolvedValueOnce({Attributes: updatedItem});
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(UpdateCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                UpdateExpression: 'SET #name = :name, #odometer = :odometer',
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': 'id', '#name': 'name', '#odometer': 'odometer'},
                ExpressionAttributeValues: {':name': 'Updated Name', ':odometer': 50000},
                ReturnValues: 'ALL_NEW'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.item).toEqual(updatedItem);
        });

        it('should handle empty update fields object', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const updateFields: Partial<MaintenanceRequest> = {};
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(UpdateCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                UpdateExpression: 'SET ',
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': 'id'},
                ExpressionAttributeValues: {},
                ReturnValues: 'ALL_NEW'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.item).toBeUndefined();
        });

        it('should handle null response from DynamoDB', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const updateFields: Partial<MaintenanceRequest> = {name: 'Updated Name'};
            mockSend.mockResolvedValueOnce(null);
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(result.item).toBeUndefined();
        });

        it('should handle DynamoDB errors gracefully', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const updateFields: Partial<MaintenanceRequest> = {name: 'Updated Name'};
            const mockError = new Error('ConditionalCheckFailedException');
            mockSend.mockRejectedValueOnce(mockError);
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(result.item).toBeUndefined();
        });

        it('should handle different key names', async () => {
            const tableName = 'TestTable';
            const key = 'email';
            const value = 'test@example.com';
            const updateFields: Partial<MaintenanceRequest> = {name: 'Updated Name'};
            const updatedItem: Maintenance = createMockMaintenanceRecord();
            mockSend.mockResolvedValueOnce({Attributes: updatedItem});
            const result = await updateRecord<Maintenance>(tableName, key, value, updateFields);
            expect(UpdateCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                UpdateExpression: 'SET #name = :name',
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': 'email', '#name': 'name'},
                ExpressionAttributeValues: {':name': 'Updated Name'},
                ReturnValues: 'ALL_NEW'
            });
            expect(result.item).toEqual(updatedItem);
        });
    });

    describe('deleteRecord', () => {
        let mockSend: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockSend = (DynamoDBDocumentClient.from as jest.Mock)().send;
        });

        it('should successfully delete an existing record', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            mockSend.mockResolvedValueOnce({Attributes: {id: '123', name: 'Test Item'}});
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
        });

        it('should handle non-existent record deletion attempt', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = 'non-existent';
            const mockError = new Error('ConditionalCheckFailedException');
            mockError.name = 'ConditionalCheckFailedException';
            mockSend.mockRejectedValueOnce(mockError);
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(false);
        });

        it('should handle DynamoDB client errors', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const mockError = new Error('Internal Server Error');
            mockError.name = 'InternalServerError';
            mockSend.mockRejectedValueOnce(mockError);
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(false);
        });

        it('should handle network errors', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            const mockError = new Error('Network Error');
            mockError.name = 'NetworkError';
            mockSend.mockRejectedValueOnce(mockError);
            const result = await deleteRecord(tableName, key, value);
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(false);
        });

        it('should work with different key names', async () => {
            const tableName = 'TestTable';
            const key = 'email';
            const value = 'test@example.com';
            mockSend.mockResolvedValueOnce({Attributes: {email: 'test@example.com', name: 'Test User'}});
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
        });

        it('should handle unexpected response format', async () => {
            const tableName = 'TestTable';
            const key = 'id';
            const value = '123';
            mockSend.mockResolvedValueOnce(undefined);
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
        });

        it('should handle malformed table names', async () => {
            const tableName = '';
            const key = 'id';
            const value = '123';
            const mockError = new Error('ResourceNotFoundException');
            mockError.name = 'ResourceNotFoundException';
            mockSend.mockRejectedValueOnce(mockError);
            const result = await deleteRecord(tableName, key, value);
            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: tableName,
                Key: {[key]: value},
                ConditionExpression: 'attribute_exists(#pk)',
                ExpressionAttributeNames: {'#pk': key},
                ReturnValues: 'ALL_OLD'
            });
            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(false);
        });
    });
});
