import * as react_jsx_runtime from 'react/jsx-runtime';

/** A colour, as a swatch you click and a value you can paste.
 *
 *  Both, because these get chosen two ways: picked by eye when somebody is designing, and pasted
 *  when a brand guideline already says what the hex is. */
declare function ColourBox({ value, onChange }: {
    value: string;
    onChange: (next: string) => void;
}): react_jsx_runtime.JSX.Element;

export { ColourBox };
