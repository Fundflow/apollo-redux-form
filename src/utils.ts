// from http://stackoverflow.com/questions/21147832/convert-camel-case-to-human-readable-string
export function fromCamelToHuman(camel: string): string {
  return camel.match(/^[_a-z]+|[_A-Z][_a-z]*/g)!.map(function(x: string){
    return x[0].toUpperCase() + x.substr(1).toLowerCase();
  }).join(' ');
}
