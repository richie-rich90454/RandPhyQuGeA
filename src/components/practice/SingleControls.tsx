import {useMemo} from "react";
import {Check, Plus} from "@phosphor-icons/react";
import {useSingleMode} from "../../hooks/useSingleMode";
import {useSpecStore} from "../../stores/specStore";
import {Button, Select, Switch, ToolbarGroup, Tooltip, TooltipContent, TooltipTrigger} from "../ui";
import type {Specification} from "../../types/models";

/**
 * Build scope-select options from the parsed specification's units, always
 * leading with an "All" option. Returns a single "All" option when no spec
 * is loaded yet.
 */
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
    const options = [{value: "all", label: "All"}];
    if (specification) {
        for (const unit of specification.units) {
            options.push({value: unit.id, label: unit.name});
        }
    }
    return options;
}

/**
 * Single-mode bottom-row controls mapped to `.toolbar-actions#single-controls`.
 *
 * Renders the Generate (Ctrl+G) and Check (Shift+Enter) buttons inside a
 * Toolbar actions group, and the Auto toggle, scope select, and Shuffle toggle
 * inside an options group. All interactive controls carry tooltips.
 */
export function SingleControls() {
    const {autoEnabled, setAutoEnabled, scope, setScope, shuffle, setShuffle, canCheck, isGenerating, generate, check} = useSingleMode();
    const specification = useSpecStore(state => state.specification);
    const scopeOptions = useMemo(() => buildScopeOptions(specification), [specification]);
    return (
        <div className="toolbar-actions" id="single-controls">
            <ToolbarGroup label="Actions" className="single-actions">
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Button variant="primary" size="sm" leftIcon={<Plus weight="bold" />} loading={isGenerating} onClick={generate} aria-busy={isGenerating}>
                            {isGenerating ? "Generating…" : "Generate"}
                            {!isGenerating && <kbd className="shortcut-hint">Ctrl+G</kbd>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Generate a new question</TooltipContent>
                </Tooltip>
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Button variant="secondary" size="sm" leftIcon={<Check weight="bold" />} onClick={check} disabled={!canCheck}>
                            Check
                            <kbd className="shortcut-hint">Shift+Enter</kbd>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Check your answer</TooltipContent>
                </Tooltip>
            </ToolbarGroup>
            <ToolbarGroup label="Options" className="auto-controls">
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Auto" checked={autoEnabled} onCheckedChange={setAutoEnabled} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Auto-generate next question after 3 seconds</TooltipContent>
                </Tooltip>
                <Select id="scope-select" variant="scope" aria-label="Scope" options={scopeOptions} value={scope} onChange={event => setScope(event.target.value)} />
                <Tooltip delay={300}>
                    <TooltipTrigger>
                        <Switch label="Shuffle" checked={shuffle} onCheckedChange={setShuffle} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Randomly pick topics</TooltipContent>
                </Tooltip>
            </ToolbarGroup>
        </div>
    );
}
