import type {GeneratorFn} from '../types.js';
export const generatorRegistry: Record<string, GeneratorFn>={};
export const topicMetadata: Record<string, {name: string; scope: string}>={};
import * as scalarsVectors from './Kinematics/ScalarsAndVectors.js';
import * as kinematics12 from './Kinematics/DisplacementVelocityAcceleration.js';
import * as ReferenceFrameRelativeMotion from './Kinematics/ReferenceFrameRelativeMotion.js';
import * as ProjectileMotion from "./Kinematics/ProjectileMotion.js";
import * as RepresentingMotionConstantAcceleration from "./Kinematics/RepresentingMotionConstantAcceleration.js";
function registerModule(module: {topicId: string; topicName: string; generate: GeneratorFn}){
	generatorRegistry[module.topicId]=module.generate;
	topicMetadata[module.topicId]={name: module.topicName, scope: module.topicId.split('_')[0]||'general'};
}
registerModule(scalarsVectors);
registerModule(kinematics12);
registerModule(ReferenceFrameRelativeMotion);
registerModule(ProjectileMotion);
registerModule(RepresentingMotionConstantAcceleration);