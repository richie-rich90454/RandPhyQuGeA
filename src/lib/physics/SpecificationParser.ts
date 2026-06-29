import type {Specification, Unit, Topic, Skill, QuestionTemplate, VariableDefinition, ParseError} from './types';
import {ParseException} from './types';
/** Stateless parser for the part_one.txt specification format. */
export class SpecificationParser {
	/** Parse a spec text string into a Specification, throwing ParseException on errors. */
	public parse(input: string): Specification {
		const lines: string[] = input.split('\n');
		const errors: ParseError[] = [];
		const units: Unit[] = [];
		const topics: Topic[] = [];
		const skills: Skill[] = [];
		const templates: QuestionTemplate[] = [];
		let currentSection: string | null = null;
		let currentBlock: Map<string, string[]> = new Map();
		for (let i = 0; i < lines.length; i++) {
			const rawLine: string = lines[i] ?? '';
			const line: string = rawLine.trim();
			const lineNumber: number = i + 1;
			if (line.length === 0 || line.startsWith('//')) {
				continue;
			}
			if (line.startsWith('[') && line.endsWith(']')) {
				const sectionName: string = line.slice(1, -1);
				if (sectionName.length === 0) {
					errors.push({line: lineNumber, message: 'Empty section header [].'});
					continue;
				}
				if (currentSection !== null && currentBlock.size > 0) {
					this.processBlock(currentSection, currentBlock, lineNumber, units, topics, skills, templates, errors);
				}
				currentSection = sectionName.toUpperCase();
				currentBlock = new Map();
				continue;
			}
			if (currentSection === null) {
				errors.push({line: lineNumber, message: 'Content found before any section header.'});
				continue;
			}
			const colonIdx: number = line.indexOf(':');
			if (colonIdx === -1) {
				errors.push({line: lineNumber, message: 'Expected key:value pair.'});
				continue;
			}
			const key: string = line.slice(0, colonIdx).trim();
			const value: string = line.slice(colonIdx + 1).trim();
			let existing: string[] | undefined = currentBlock.get(key);
			if (existing === undefined) {
				existing = [];
				currentBlock.set(key, existing);
			}
			existing.push(value);
		}
		if (currentSection !== null && currentBlock.size > 0) {
			this.processBlock(currentSection, currentBlock, lines.length, units, topics, skills, templates, errors);
		}
		this.validateCrossReferences(units, topics, skills, templates, errors);
		if (errors.length > 0) {
			throw new ParseException(errors);
		}
		return {units, topics, skills, templates};
	}
	/** Dispatch a finished block to the section-specific parser. */
	private processBlock(section: string, block: Map<string, string[]>, lineNumber: number, units: Unit[], topics: Topic[], skills: Skill[], templates: QuestionTemplate[], errors: ParseError[]): void {
		if (section === 'UNIT') {
			const unit: Unit | undefined = this.parseUnit(block);
			if (unit !== undefined) {
				units.push(unit);
			}
			return;
		}
		if (section === 'TOPIC') {
			const topic: Topic | undefined = this.parseTopic(block);
			if (topic !== undefined) {
				topics.push(topic);
			}
			return;
		}
		if (section === 'SKILL') {
			const skill: Skill | undefined = this.parseSkill(block);
			if (skill !== undefined) {
				skills.push(skill);
			}
			return;
		}
		if (section === 'TEMPLATE') {
			const template: QuestionTemplate | undefined = this.parseTemplate(block, errors);
			if (template !== undefined) {
				templates.push(template);
			}
			return;
		}
		errors.push({line: lineNumber, message: `Unknown section [${section}].`});
	}
	/** Case-insensitive single-value lookup; returns the first value or undefined. */
	private getSingle(block: Map<string, string[]>, key: string): string | undefined {
		const keyLower: string = key.toLowerCase();
		for (const [k, v] of block) {
			if (k.toLowerCase() === keyLower) {
				return v[0];
			}
		}
		return undefined;
	}
	/** Case-insensitive multi-value lookup; returns a copy of all values (empty if absent). */
	private getMultiple(block: Map<string, string[]>, key: string): string[] {
		const keyLower: string = key.toLowerCase();
		for (const [k, v] of block) {
			if (k.toLowerCase() === keyLower) {
				return v.slice();
			}
		}
		return [];
	}
	/** Parse a UNIT block (Id, Name required; Description optional). */
	private parseUnit(block: Map<string, string[]>): Unit | undefined {
		const id: string | undefined = this.getSingle(block, 'Id');
		if (id === undefined) {
			return undefined;
		}
		const name: string | undefined = this.getSingle(block, 'Name');
		if (name === undefined) {
			return undefined;
		}
		const description: string = this.getSingle(block, 'Description') ?? '';
		return {id, name, description};
	}
	/** Parse a TOPIC block (Id, Name, UnitId required; Description optional). */
	private parseTopic(block: Map<string, string[]>): Topic | undefined {
		const id: string | undefined = this.getSingle(block, 'Id');
		if (id === undefined) {
			return undefined;
		}
		const name: string | undefined = this.getSingle(block, 'Name');
		if (name === undefined) {
			return undefined;
		}
		const unitId: string | undefined = this.getSingle(block, 'UnitId');
		if (unitId === undefined) {
			return undefined;
		}
		const description: string = this.getSingle(block, 'Description') ?? '';
		return {id, name, unit_id: unitId, description};
	}
	/** Parse a SKILL block (Id, Name, TopicId required; Description optional). */
	private parseSkill(block: Map<string, string[]>): Skill | undefined {
		const id: string | undefined = this.getSingle(block, 'Id');
		if (id === undefined) {
			return undefined;
		}
		const name: string | undefined = this.getSingle(block, 'Name');
		if (name === undefined) {
			return undefined;
		}
		const topicId: string | undefined = this.getSingle(block, 'TopicId');
		if (topicId === undefined) {
			return undefined;
		}
		const description: string = this.getSingle(block, 'Description') ?? '';
		return {id, name, topic_id: topicId, description};
	}
	/** Parse a TEMPLATE block; returns undefined when a required key is missing or difficulty is non-finite. */
	private parseTemplate(block: Map<string, string[]>, errors: ParseError[]): QuestionTemplate | undefined {
		const id: string | undefined = this.getSingle(block, 'Id');
		if (id === undefined) {
			return undefined;
		}
		const topicId: string | undefined = this.getSingle(block, 'TopicId');
		if (topicId === undefined) {
			return undefined;
		}
		const skillId: string | undefined = this.getSingle(block, 'SkillId');
		if (skillId === undefined) {
			return undefined;
		}
		const questionTypeRaw: string | undefined = this.getSingle(block, 'QuestionType');
		if (questionTypeRaw === undefined) {
			return undefined;
		}
		const trimmedType: string = questionTypeRaw.trim();
		let questionType: string = trimmedType;
		if (trimmedType === 'MultipleChoice' || trimmedType === 'MC') {
			questionType = 'MC';
		}
		if (trimmedType === 'ShortAnswer' || trimmedType === 'SA') {
			questionType = 'SA';
		}
		if (trimmedType === 'TrueFalse' || trimmedType === 'TF') {
			questionType = 'TF';
		}
		if (trimmedType === 'FillInBlank' || trimmedType === 'FB') {
			questionType = 'FB';
		}
		if (trimmedType === 'NumericEntry' || trimmedType === 'NE') {
			questionType = 'NE';
		}
		const difficultyStr: string | undefined = this.getSingle(block, 'Difficulty');
		if (difficultyStr === undefined) {
			return undefined;
		}
		const difficulty: number = Number(difficultyStr);
		if (!Number.isFinite(difficulty)) {
			return undefined;
		}
		const textTemplate: string | undefined = this.getSingle(block, 'TextTemplate');
		if (textTemplate === undefined) {
			return undefined;
		}
		const answerExpression: string | undefined = this.getSingle(block, 'AnswerExpression');
		if (answerExpression === undefined) {
			return undefined;
		}
		const solutionTemplate: string = this.getSingle(block, 'SolutionTemplate') ?? '';
		const solutionLatexTemplate: string = this.getSingle(block, 'SolutionLatexTemplate') ?? '';
		const variableDefinitions: VariableDefinition[] = this.parseVariableDefinitions(block, errors);
		const distractorExpressions: string[] = this.getMultiple(block, 'Distractor');
		return {
			id,
			topic_id: topicId,
			skill_id: skillId,
			question_type: questionType,
			difficulty,
			text_template: textTemplate,
			answer_expression: answerExpression,
			solution_template: solutionTemplate,
			solution_latex_template: solutionLatexTemplate,
			variable_definitions: variableDefinitions,
			distractor_expressions: distractorExpressions
		};
	}
	/** Collect VariableDefinitions from all Var.* keys (case-insensitive prefix). */
	private parseVariableDefinitions(block: Map<string, string[]>, errors: ParseError[]): VariableDefinition[] {
		const result: VariableDefinition[] = [];
		const varKeys: string[] = [];
		for (const [k] of block) {
			if (k.toLowerCase().startsWith('var.')) {
				varKeys.push(k);
			}
		}
		for (const key of varKeys) {
			const name: string = key.slice(4);
			const values: string[] | undefined = block.get(key);
			if (values === undefined) {
				continue;
			}
			for (const value of values) {
				const vd: VariableDefinition | undefined = this.parseSingleVariable(name, value, errors);
				if (vd !== undefined) {
					result.push(vd);
				}
			}
		}
		return result;
	}
	/** Parse one variable definition value of the form "Type=...;Min=...;Max=...;Step=...;Values=...". */
	private parseSingleVariable(name: string, value: string, errors: ParseError[]): VariableDefinition | undefined {
		const dict: Map<string, string> = new Map();
		const segments: string[] = value.split(';');
		for (const segment of segments) {
			const trimmed: string = segment.trim();
			if (trimmed.length === 0) {
				continue;
			}
			const eq: number = trimmed.indexOf('=');
			if (eq === -1) {
				continue;
			}
			const k: string = trimmed.slice(0, eq).trim();
			const v: string = trimmed.slice(eq + 1).trim();
			dict.set(k, v);
		}
		const typeValue: string | undefined = dict.get('Type');
		if (typeValue === undefined) {
			errors.push({line: 0, message: `Variable '${name}' is missing required 'Type' key.`});
			return undefined;
		}
		const min: number | undefined = this.parseOptionalNumber(dict.get('Min'));
		const max: number | undefined = this.parseOptionalNumber(dict.get('Max'));
		const step: number | undefined = this.parseOptionalNumber(dict.get('Step'));
		let enumValues: string[] | undefined = undefined;
		const valuesStr: string | undefined = dict.get('Values');
		if (valuesStr !== undefined) {
			enumValues = valuesStr
				.split(',')
				.map(s => s.trim())
				.filter(s => s.length > 0);
		}
		return {name, var_type: typeValue, min, max, step, enum_values: enumValues};
	}
	/** Parse an optional numeric field; returns undefined when missing or non-finite. */
	private parseOptionalNumber(raw: string | undefined): number | undefined {
		if (raw === undefined) {
			return undefined;
		}
		const parsed: number = Number(raw);
		if (!Number.isFinite(parsed)) {
			return undefined;
		}
		return parsed;
	}
	/** Validate Topic->Unit, Skill->Topic, and Template->Topic/Skill references; pushes errors for dangling refs. */
	private validateCrossReferences(units: Unit[], topics: Topic[], skills: Skill[], templates: QuestionTemplate[], errors: ParseError[]): void {
		const unitIds: Set<string> = new Set(units.map(u => u.id));
		const topicIds: Set<string> = new Set(topics.map(t => t.id));
		const skillIds: Set<string> = new Set(skills.map(s => s.id));
		for (const topic of topics) {
			if (!unitIds.has(topic.unit_id)) {
				errors.push({line: 0, message: `Topic '${topic.id}' references unknown Unit '${topic.unit_id}'.`});
			}
		}
		for (const skill of skills) {
			if (!topicIds.has(skill.topic_id)) {
				errors.push({line: 0, message: `Skill '${skill.id}' references unknown Topic '${skill.topic_id}'.`});
			}
		}
		for (const template of templates) {
			if (!topicIds.has(template.topic_id)) {
				errors.push({line: 0, message: `Template '${template.id}' references unknown Topic '${template.topic_id}'.`});
			}
			if (!skillIds.has(template.skill_id)) {
				errors.push({line: 0, message: `Template '${template.id}' references unknown Skill '${template.skill_id}'.`});
			}
		}
	}
}
