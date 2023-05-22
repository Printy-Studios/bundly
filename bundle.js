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

    moduleFactory(module, requireModule);

    return module.exports;
}
define( 2, function( module, require ) { 
 console.log( 'the bundler works! ' ); } )
define( 1, function( module, require ) { 
 require(2); } )
define( 0, function( module, require ) { 
 //require('fss');
require(1) ; } )
requireModule( 0 );