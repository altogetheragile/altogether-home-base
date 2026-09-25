import * as react_jsx_runtime from 'react/jsx-runtime';
import { CopyField } from './store.js';
import './fields.js';
import '../brand.js';
import '../tokens.js';

declare function FieldControl({ field, value, page, onChange, upload, }: {
    field: CopyField;
    value: string;
    /** Which registry this field belongs to. Only the section order needs it, to know what the
     *  sections of that page are called. */
    page: string;
    onChange: (next: string) => void;
    upload: (file: File) => Promise<string>;
}): react_jsx_runtime.JSX.Element;

export { FieldControl };
