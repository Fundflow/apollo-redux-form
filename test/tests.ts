import 'es6-promise';

declare function require(name: string): any;
declare var process: any;
require('source-map-support').install();

process.env.NODE_ENV = 'test';

import './autoform.test';
import './apollo.test';
