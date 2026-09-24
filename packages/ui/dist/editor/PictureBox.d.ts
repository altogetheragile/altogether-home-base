import * as react_jsx_runtime from 'react/jsx-runtime';

declare function PictureBox({ value, onChange, upload: putFile, }: {
    value: string;
    onChange: (next: string) => void;
    /** Stores the file and answers with the address to render it from. */
    upload: (file: File) => Promise<string>;
}): react_jsx_runtime.JSX.Element;

export { PictureBox };
