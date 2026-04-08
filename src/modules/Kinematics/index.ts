const modules=import.meta.glob<{
	topicId: string;
	topicName: string;
	generate: (options: any)=>any;
}>("./*.ts",{eager: true});
export const generators: Array<{id: string; name: string; generate: any}>=[];
for (const [filePath, moduleExports] of Object.entries(modules)){
	if (filePath==="./index.ts") continue;
	if (moduleExports && moduleExports.topicId && moduleExports.topicName && moduleExports.generate){
		generators.push({
			id: moduleExports.topicId,
			name: moduleExports.topicName,
			generate: moduleExports.generate
		});
	}
}