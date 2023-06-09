const modules = new Map();

const define = ( name, moduleFactory ) => {
    modules.set( name, moduleFactory );
}

const module_cache = new Map();

const requireModule = ( module_name ) => {
    if( module_cache.has( module_name ) ) {
        return module_cache.get( module_name ).exports;
    }

    if( ! modules.has( module_name ) ) {
        throw new Error ( `Module ${ module_name } not found!` );
    }

    const moduleFactory = modules.get( module_name );

    const module = {
        exports: {}
    };

    module_cache.set( module_name, module );

    moduleFactory(module, module.exports, requireModule);

    return module.exports;
}
define( 2, function( module, exports, require ) { 
 "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
console.log('test');
function _default() {
  console.log("bundler works!");
} } )
define( 1, function( module, exports, require ) { 
 "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _two = _interopRequireDefault(require(2));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = _two.default;
exports.default = _default; } )
define( 0, function( module, exports, require ) { 
 "use strict";

var _one = _interopRequireDefault(require(1));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
(0, _one.default)(); } )
requireModule( 0 )