import type {GeneratorFn} from '../types.d.js';
export const generatorRegistry: Record<string, GeneratorFn>={};
export const topicMetadata: Record<string, {name: string; scope: string}>={};
import * as scalarsVectors from './Kinematics/ScalarsAndVectors.js';
import * as kinematics12 from './Kinematics/DisplacementVelocityAcceleration.js';
function registerModule(module: {topicId: string; topicName: string; generate: GeneratorFn}){
	generatorRegistry[module.topicId]=module.generate;
	topicMetadata[module.topicId]={name: module.topicName, scope: module.topicId.split('_')[0]||'general'};
}
registerModule(scalarsVectors);
registerModule(kinematics12);