export * from './default.service';
import { DefaultService } from './default.service';
export * from './default.serviceInterface';
export * from './persons.service';
import { PersonsService } from './persons.service';
export * from './persons.serviceInterface';
export const APIS = [DefaultService, PersonsService];
