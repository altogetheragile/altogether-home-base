// The field types and their pure helpers live in the shared package now, because the editor is
// mounted by both apps and neither can import the other's source. Re-exported here so every
// existing import in this app keeps working.
export * from '@altogether/ui/editor/fields';
