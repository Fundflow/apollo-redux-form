// from http://stackoverflow.com/questions/21147832/convert-camel-case-to-human-readable-string
export function fromCamelToHuman(camel: string): string {
  return camel.match(/^[a-z]+|[A-Z][a-z]*/g)!.map(function(x: string){
    return x[0].toUpperCase() + x.substr(1).toLowerCase();
  }).join(' ');
}
