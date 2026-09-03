import type { MakeIndex, VehicleModel } from '@/data/types';

export interface PopularVehicle {
  make: string;
  model: string;
  label: string;
}

export const POPULAR_VEHICLES: PopularVehicle[] = [
  { make: 'Ford (USA)', model: 'F-150', label: 'Ford F-150' },
  { make: 'Chevrolet (USA / CAN)', model: 'Silverado', label: 'Chevy Silverado' },
  { make: 'Ram', model: '1500', label: 'Ram 1500' },
  { make: 'Toyota (USA / CAN)', model: 'Camry', label: 'Toyota Camry' },
  { make: 'Toyota (USA / CAN)', model: 'RAV4', label: 'Toyota RAV4' },
  { make: 'Honda (USA / CAN)', model: 'Civic', label: 'Honda Civic' },
  { make: 'Honda (USA / CAN)', model: 'CR-V', label: 'Honda CR-V' },
  { make: 'Tesla (USA)', model: 'Model', label: 'Tesla Model 3/Y' },
  { make: 'Jeep (USA / CAN)', model: 'Grand Cherokee', label: 'Jeep Grand Cherokee' },
  { make: 'Nissan (USA / CAN)', model: 'Rogue', label: 'Nissan Rogue' },
];

export function findQuickPickMake(makes: MakeIndex[], requestedMake: string): MakeIndex | undefined {
  return makes.find(make => make.name === requestedMake);
}

export function findQuickPickModel(models: VehicleModel[], requestedModel: string): VehicleModel | undefined {
  return models.find(model => model.name.includes(requestedModel));
}
