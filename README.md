# Cars Maintenance API

A serverless REST API built with AWS CDK and TypeScript for managing car maintenance records — with proactive email reminders so users never miss a service.

## Project Overview

This project is a serverless application that tracks vehicle maintenance records and automatically notifies car owners via email when maintenance is upcoming or overdue. Built with AWS CDK infrastructure as code using AWS Lambda, API Gateway, DynamoDB, Cognito, SES, and EventBridge.

## Architecture

```
┌──────────────┐    ┌─────────────────┐    ┌───────────────┐
│  API Gateway  │───▶│  Lambda (Node 22)│───▶│   DynamoDB    │
│  + Cognito   │    │  CRUD handlers   │    │  3 tables     │
│  Authorizer  │    └─────────────────┘    └───────────────┘
└──────────────┘
                     ┌─────────────────┐    ┌───────────────┐
                     │  EventBridge    │───▶│  Lambda       │
                     │  Cron (9AM UTC) │    │  sendReminders│───▶ AWS SES
                     └─────────────────┘    └───────────────┘
```

### AWS Services

| Service | Purpose |
|---------|---------|
| AWS Lambda (Node.js 22) | Serverless compute for all handlers |
| Amazon API Gateway | REST API endpoints |
| Amazon DynamoDB | Data storage (3 tables: cars, maintenances, carOwners) |
| AWS Cognito | User authentication (JWT-based) |
| Amazon SES | Transactional email delivery for reminders |
| Amazon EventBridge | Daily cron trigger for reminder Lambda |
| AWS CDK | Infrastructure as code |

## Project Structure

```
maintenances-api/
├── lib/
│   ├── lambdas/
│   │   ├── cars/               # getCars, getCar, postCar, putCar, deleteCar
│   │   ├── carOwners/          # getCarOwners, getCarOwner, postCarOwner, putCarOwner, deleteCarOwner
│   │   ├── maintenances/       # getMaintenances, getMaintenance, postMaintenance, putMaintenance, deleteMaintenance
│   │   └── notifications/
│   │       └── sendReminders/  # Daily email reminder Lambda
│   ├── models/
│   │   ├── car.ts
│   │   ├── carOwner.ts         # Includes notificationPreferences
│   │   ├── maintenance.ts      # Includes configurable intervalMonths
│   │   ├── http.ts
│   │   └── environment.ts
│   ├── services/
│   │   └── dynamo.ts           # DynamoDB helpers (CRUD + filter scan)
│   ├── stacks/
│   │   ├── AuthStack.ts        # Cognito User Pool + Client
│   │   ├── CarsStack.ts        # Cars API Gateway + Lambdas
│   │   ├── CarOwnersStack.ts   # CarOwners API Gateway + Lambdas
│   │   ├── MaintenancesStack.ts
│   │   ├── NotificationsStack.ts # EventBridge cron + sendReminders Lambda
│   │   └── BucketStack.ts
│   ├── utils/
│   │   ├── dateHelper.ts       # getDateInMonths(date, months)
│   │   ├── emailTemplates.ts   # HTML email builder for reminders
│   │   ├── httpHelper.ts
│   │   └── validation.ts       # Zod schemas for all request types
│   └── my-cdk-project-stack.ts
├── test/
│   ├── mocks/
│   └── services/
├── .env
└── package.json
```

## API Endpoints

All endpoints require a valid **Cognito JWT token** in the `Authorization` header.

### Car Owners

| Method | Path | Description |
|--------|------|-------------|
| GET | `/owners` | List all owners |
| GET | `/owners/{id}` | Get owner by ID |
| POST | `/owners` | Create owner |
| PUT | `/owners/{id}` | Update owner |
| DELETE | `/owners/{id}` | Delete owner |

### Cars

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cars` | List all cars (filter: `?ownerId=`) |
| GET | `/cars/{licensePlate}` | Get car by license plate |
| POST | `/cars` | Create car |
| PUT | `/cars/{licensePlate}` | Update car |
| DELETE | `/cars/{licensePlate}` | Delete car |

### Maintenances

| Method | Path | Description |
|--------|------|-------------|
| GET | `/maintenances` | List all (filter: `?ownerId=`, `?carId=`) |
| GET | `/maintenance/{name}` | Get maintenance by name |
| POST | `/maintenance` | Create maintenance record |
| PUT | `/maintenance/{name}` | Update maintenance record |
| DELETE | `/maintenance/{name}` | Delete maintenance record |

### Request Bodies

**POST /owners**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "notificationPreferences": {
    "emailEnabled": true,
    "daysBeforeReminder": [30, 7, 1, 0]
  }
}
```

**POST /cars**
```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Civic",
  "year": 2022,
  "color": "Blue",
  "licensePlate": "ABC-1234",
  "fuel": "gasoline",
  "transmission": "automatic",
  "odometer": 15000,
  "ownerId": "<owner-id>"
}
```

**POST /maintenance**
```json
{
  "name": "Oil Change",
  "type": "engine",
  "product": "Mobil 1 5W-30",
  "odometer": 15000,
  "carId": "<car-id>",
  "ownerId": "<owner-id>",
  "intervalMonths": 6
}
```

## Notification Engine

The `sendReminders` Lambda runs daily at **9:00 AM UTC** via EventBridge. For each maintenance record it:

1. Calculates days until `nextMaintenance`
2. Checks against the owner's `daysBeforeReminder` preferences
3. Sends an email via SES if the window matches

**Default reminder windows:** 30 days before, 7 days before, 1 day before, day-of, and 7 days overdue.

## Prerequisites

- Node.js 22.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/josuebass09/maintenances-api
cd maintenances-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```
CDK_DEFAULT_ACCOUNT=<your-aws-account-id>
CDK_DEFAULT_REGION=<your-region>
STAGE_NAME=dev
SES_FROM_EMAIL=<your-verified-ses-email>
```

4. Verify your sender email in AWS SES console before deploying.

## Development

### Run tests
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Deploy

Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

Deploy all stacks:
```bash
cdk deploy --all
```

Deploy a specific stack:
```bash
cdk deploy CarsStack
cdk deploy MaintenancesStack
cdk deploy CarOwnersStack
cdk deploy NotificationsStack
```

## Stacks

| Stack | Resources |
|-------|-----------|
| `AuthStack` | Cognito User Pool + App Client |
| `CarsStack` | DynamoDB `cars` table + API Gateway + 5 Lambdas |
| `MaintenancesStack` | DynamoDB `maintenances` table + API Gateway + 5 Lambdas |
| `CarOwnersStack` | DynamoDB `carOwners` table + API Gateway + 5 Lambdas |
| `NotificationsStack` | EventBridge daily rule + `sendReminders` Lambda + SES permissions |

## Cost Estimate (MVP / low traffic)

| Service | Free Tier | Est. cost |
|---------|-----------|-----------|
| AWS Lambda | 1M req/month | $0 |
| DynamoDB | 25GB + 25 WCU | $0 |
| API Gateway | 1M calls/month | $0 |
| AWS SES | 62K emails/month (from Lambda) | $0 |
| Cognito | 50K MAU | $0 |
| EventBridge | 1 rule | $0 |
| **Total** | | **~$0/month** |

## License

See [LICENSE.md](LICENSE.md)
