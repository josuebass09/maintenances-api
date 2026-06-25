export type Maintenance = {
    name: string,
    type: MaintenanceType,
    currentMaintenance: Date | string,
    nextMaintenance: Date | string,
    product: string,
    odometer: number,
    carId: string,
    ownerId: string,
    intervalMonths: number,
}

export enum MaintenanceType {
    Engine = 'engine',
    Transmission = 'transmission',
    Steer = 'steer',
    Coolant = 'coolant',
}

export interface MaintenanceRequest {
    name: string,
    type: MaintenanceType,
    product: string,
    odometer: number,
    carId: string,
    ownerId: string,
    intervalMonths?: number,
}

export enum MaintenanceKeys {
    PrimaryKey = 'name',
    SecondaryKey = 'type',
}

