import 'es6-promise';

declare function require(name: string): any;
declare var process: any;
require('source-map-support').install(); // tslint:disable-line

process.env.NODE_ENV = 'test';

import './autoform.test';
import './apollo.test';
import './init.test';
