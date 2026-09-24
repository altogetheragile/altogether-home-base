import * as react_jsx_runtime from 'react/jsx-runtime';

/** A colour, as a swatch you click and a value you can paste.
 *
 *  Both, because these get chosen two ways: picked by eye when somebody is designing, and pasted
 *  when a brand guideline already says what the hex is. */
declare function ColourBox({ value, onChange, placeholder, }: {
    value: string;
    onChange: (next: string) => void;
    /** What empty means here. An unset colour draws a black swatch, because that is what a colour
     *  input does with no value, and black is a claim: it reads as "this card is black" when it
     *  actually means "use the one the site ships". The box says so instead. */
    placeholder?: string;
}): react_jsx_runtime.JSX.Element;

export { ColourBox };
