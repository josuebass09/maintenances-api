export interface Car {
    vin: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    fuel: FuelType,
    transmission: TransmissionType;
    odometer: number;
    ownerId: string;
    maintenanceRecords?: string[];  // Array of maintenance record IDs
    notes?: string;
}

export enum TransmissionType {
    MANUAL = 'manual',
    AUTOMATIC = 'automatic',
}

export enum FuelType {
    GASOLINE = 'gasoline',
    DIESEL = 'diesel',
    ELECTRIC = 'electric',
    HYBRID = 'hybrid',
}

export enum CarKeys {
    PrimaryKey = 'licensePlate',
    SecondaryKey = 'ownerId',
}
