// The registries both apps need. Page registries stay with the app that renders the page; these
// two describe things that are on every page, so they live where both can reach them.
export { navigationRegistry } from './navigation';
export { siteRegistry } from './site';
