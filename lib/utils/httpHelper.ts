import {HttpStatus} from '../models/http';

export const buildResponse = (statusCode: HttpStatus, body: any, headers: Record<string, string> = { 'Content-Type': 'application/json' }) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
};
