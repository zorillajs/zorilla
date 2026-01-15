// Type declarations for importing text files in Cloudflare Workers

declare module '*.html?text' {
  const content: string;
  export default content;
}

declare module '*.css?text' {
  const content: string;
  export default content;
}

declare module '*.js?text' {
  const content: string;
  export default content;
}
