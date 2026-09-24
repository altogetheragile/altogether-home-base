import * as react_jsx_runtime from 'react/jsx-runtime';
import { ItemField } from './fields.js';

declare function ItemRows({ value, fields, onChange, upload, }: {
    value: string;
    fields: ItemField[];
    onChange: (next: string) => void;
    upload: (file: File) => Promise<string>;
}): react_jsx_runtime.JSX.Element;

export { ItemRows };
