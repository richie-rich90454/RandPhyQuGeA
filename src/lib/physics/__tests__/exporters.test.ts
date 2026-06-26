import {describe, it, expect} from 'vitest';
import {ExporterRegistry} from '../exporters/ExporterRegistry';
import {HtmlExporter} from '../exporters/HtmlExporter';
import type {GeneratedQuestion, ExportFormat} from '../types';
import type {Exporter} from '../contracts';
const sample: GeneratedQuestion = {
	id: 'q1',
	topic_id: 'T1',
	skill_id: 'S1',
	question_type: 'MC',
	difficulty: 2,
	text: 'What is 2+2?',
	answer: '4',
	choices: ['3', '4', '5'],
	solution_text: '2+2=4',
	solution_latex: '2+2=4',
	variables: {}
};
describe('ExporterRegistry and exporters', () => {
	it('exports HTML containing DOCTYPE, MathJax, and Question 1', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'html');
		expect(out).toContain('<!DOCTYPE html>');
		expect(out).toContain('mathjax');
		expect(out).toContain('Question 1');
		expect(out.length).toBeGreaterThan(0);
	});
	it('exports Markdown containing the heading and Answer label', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'markdown');
		expect(out).toContain('# Physics Questions');
		expect(out).toContain('**Answer:**');
		expect(out.length).toBeGreaterThan(0);
	});
	it('exports Text containing the header and Answer label', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'text');
		expect(out).toContain('PHYSICS QUESTIONS');
		expect(out).toContain('Answer:');
		expect(out.length).toBeGreaterThan(0);
	});
	it('exports JSON as a parseable array with id, topic_id, text', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'json');
		expect(out.startsWith('[')).toBe(true);
		const parsed = JSON.parse(out);
		expect(parsed[0].id).toBe('q1');
		expect(parsed[0].topic_id).toBe('T1');
		expect(parsed[0].text).toBe('What is 2+2?');
	});
	it('exports CSV starting with the header row', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'csv');
		expect(out.startsWith('id,topic_id,skill_id,type,difficulty')).toBe(true);
		expect(out).toContain('What is 2+2?');
	});
	it('exports LaTeX containing documentclass and begin{questions}', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'latex');
		expect(out).toContain('\\documentclass');
		expect(out).toContain('\\begin{questions}');
	});
	it('exports PDF containing @page and page-break-inside', () => {
		const registry = ExporterRegistry.createDefault();
		const out = registry.export([sample], 'pdf');
		expect(out).toContain('@page');
		expect(out).toContain('page-break-inside');
	});
	it('returns non-empty strings for every format', () => {
		const registry = ExporterRegistry.createDefault();
		const formats: ExportFormat[] = ['html', 'markdown', 'text', 'json', 'csv', 'latex', 'pdf'];
		for (const f of formats) {
			expect(registry.export([sample], f).length).toBeGreaterThan(0);
		}
	});
	it('get returns undefined for an unregistered format', () => {
		const registry = new ExporterRegistry();
		expect(registry.get('html')).toBeUndefined();
	});
	it('throws when exporting an unregistered format', () => {
		const registry = new ExporterRegistry();
		expect(() => registry.export([], 'html')).toThrow('No exporter registered for format: html');
	});
	it('HtmlExporter escapes HTML special characters', () => {
		const exporter = new HtmlExporter();
		const out = exporter.export([{...sample, text: '<b>x</b>'}]);
		expect(out).toContain('&lt;b&gt;x&lt;/b&gt;');
	});
	it('register overrides an existing exporter (open-closed)', () => {
		const registry = ExporterRegistry.createDefault();
		const custom: Exporter = {format: 'html' as ExportFormat, export: () => 'CUSTOM EXPORT'};
		registry.register(custom);
		expect(registry.get('html')).toBe(custom);
		expect(registry.export([], 'html')).toBe('CUSTOM EXPORT');
	});
});
