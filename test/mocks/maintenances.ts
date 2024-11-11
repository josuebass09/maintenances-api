import {Maintenance, MaintenanceRequest, MaintenanceType} from '../../lib/models/maintenance';

export const createMockMaintenanceRequest = (overrides?: Partial<MaintenanceRequest>): MaintenanceRequest => ({
  name: 'engineOil',
  type: MaintenanceType.Engine,
  product: 'Penzoil',
  odometer: 50000,
  ...overrides
});

export const createMockMaintenanceRecord = (overrides?: Partial<Maintenance>): Maintenance => ({
  name: 'engineOil',
  type: 'engine' as any,
  product: 'Penzoil',
  odometer: 50000,
  currentMaintenance: 'ISOString',
  nextMaintenance: 'ISOString',
  ...overrides
});
