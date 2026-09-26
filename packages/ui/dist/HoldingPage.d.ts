import * as react_jsx_runtime from 'react/jsx-runtime';

type HoldingLogo = {
    mode: 'image';
    src: string;
} | {
    mode: 'wordmark';
    text: string;
};
declare function HoldingPage({ logo, heading, body, email, }: {
    logo: HoldingLogo;
    heading: string;
    body: string;
    email?: string | null;
}): react_jsx_runtime.JSX.Element;

export { type HoldingLogo, HoldingPage };
