import * as react_jsx_runtime from 'react/jsx-runtime';
import { SectionChoice } from './sections.js';

declare function SectionOrder({ value, choices, onChange, }: {
    value: string;
    choices: SectionChoice[];
    onChange: (next: string) => void;
}): react_jsx_runtime.JSX.Element;

export { SectionOrder };
