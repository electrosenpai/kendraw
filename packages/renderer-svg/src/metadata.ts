export interface SvgMetadataOptions {
  title?: string;
  author?: string;
  description?: string;
  doi?: string;
}

export function injectSvgMetadata(svgString: string, options: SvgMetadataOptions): string {
  const metadata = [
    '<metadata>',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '<rdf:Description>',
    `<dc:creator>${options.author ?? 'Unknown'}</dc:creator>`,
    `<dc:title>${options.title ?? 'Untitled'}</dc:title>`,
    `<dc:description>${options.description ?? ''}</dc:description>`,
    '<dc:source>Kendraw v0.1.0 — https://github.com/electrosenpai/kendraw</dc:source>',
    options.doi ? `<dc:identifier>${options.doi}</dc:identifier>` : '',
    '</rdf:Description>',
    '</rdf:RDF>',
    '</metadata>',
  ]
    .filter(Boolean)
    .join('\n');

  // Insert after opening <svg> tag
  return svgString.replace(/(<svg[^>]*>)/, `$1\n${metadata}`);
}
