# Cars Maintenance API

A serverless REST API built with AWS CDK and TypeScript for managing maintenance operations.

## Project Overview

This project is a serverless application that provides endpoints for managing maintenance records. It's built using AWS CDK infrastructure as code and implements a complete CRUD API with AWS Lambda, API Gateway, and DynamoDB.

## Architecture

The application uses the following AWS services:
- AWS Lambda for serverless compute
- Amazon API Gateway for REST API endpoints
- Amazon DynamoDB for data storage
- Amazon S3 for file storage
- AWS CDK for infrastructure as code

## Project Structure

```
my-cdk-project/
├── lib/
│   ├── lambdas/               # Lambda function handlers
│   │   ├── deleteMaintenance/
│   │   ├── getMaintenance/
│   │   ├── getMaintenances/
│   │   ├── postMaintenance/
│   │   └── putMaintenance/
│   ├── models/                # Type definitions and interfaces
│   ├── services/             # Service layer (DynamoDB, S3)
│   ├── stacks/               # CDK stack definitions
│   └── utils/                # Helper functions
├── test/                     # Test files
│   ├── mocks/
│   └── services/
└── bin/                      # CDK app entry point
```

## API Endpoints

The API provides the following endpoints:

- `GET /maintenances` - Retrieve all maintenance records
- `GET /maintenance/{id}` - Retrieve a specific maintenance record
- `POST /maintenance` - Create a new maintenance record
- `PUT /maintenance/{id}` - Update an existing maintenance record
- `DELETE /maintenance/{id}` - Delete a maintenance record

## Prerequisites

- Node.js (v18.x or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- TypeScript knowledge

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cars-maintenances
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with required environment variables:
```
CDK_DEFAULT_ACCOUNT=<your-accountId>
CDK_DEFAULT_REGION=<your-region>
STAGE_NAME=<dev/prod>
```

## Development

### Local Testing

Run unit tests:
```bash
npm test
```

### Deployment

1. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

2. Deploy the stack:
```bash
cdk deploy
```

3. To deploy to a specific stage:
```bash
cdk deploy --context stage=production
```

## Project Components

### Lambda Functions
- `deleteMaintenance`: Handles deletion of maintenance records
- `getMaintenance`: Retrieves a single maintenance record
- `getMaintenances`: Lists all maintenance records
- `postMaintenance`: Creates new maintenance records
- `putMaintenance`: Updates existing maintenance records

### Services
- `bucket.ts`: Handles S3 bucket operations
- `dynamo.ts`: Manages DynamoDB interactions

### Stacks
- `MaintenancesStack.ts`: Defines API Gateway and Lambda integrations
- `BucketStack.ts`: Sets up S3 bucket infrastructure

### Utils
- `dateHelper.ts`: Date manipulation utilities
- `httpHelper.ts`: HTTP response formatting

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Write/update tests as needed
4. Submit a pull request

## License

See the LICENSE.md file
