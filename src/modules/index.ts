import type {GeneratorFn} from '../types.d.js';
export const generatorRegistry: Record<string, GeneratorFn>={};
export const topicMetadata: Record<string, { name: string; scope: string }>={};
function getScopeFromTopicId(topicId: string): string{
	if (topicId.startsWith("1.")) return "Kinematics";
	if (topicId.startsWith("2.")) return "Force and Translational Dynamics";
	if (topicId.startsWith("3.")) return "Force and Translational Dynamics";
	return "General";
}
const modules=import.meta.glob<{
	topicId: string;
	topicName: string;
	generate: GeneratorFn;
}>('./**/*.ts', { eager: true });
for (const [filePath, moduleExports] of Object.entries(modules)){
	if (filePath==='./index.ts') continue;
	if (moduleExports && moduleExports.topicId && moduleExports.topicName && typeof moduleExports.generate === 'function'){
		const { topicId, topicName, generate }=moduleExports;
		generatorRegistry[topicId]=generate;
		const scope=getScopeFromTopicId(topicId);
		topicMetadata[topicId]={ name: topicName, scope };
	}
}