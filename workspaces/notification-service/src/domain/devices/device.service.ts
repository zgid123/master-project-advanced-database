import type { DeviceTokenRow, RegisterDeviceInput } from './device.types.js';
import { DeviceRepo } from './device.repo.js';

export const DeviceService = {
  list(userId: string): Promise<DeviceTokenRow[]> {
    return DeviceRepo.listForUser(userId);
  },

  register(input: RegisterDeviceInput): Promise<DeviceTokenRow> {
    return DeviceRepo.register(input);
  },

  deactivate(userId: string, id: string): Promise<boolean> {
    return DeviceRepo.deactivate(userId, id);
  },
};
