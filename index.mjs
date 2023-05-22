
import JestHasteMap from 'jest-haste-map';
import { cpus } from 'os';
import { 
    dirname, 
    join,
    resolve } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import yargs from 'yargs';
import Resolver from 'jest-resolve';
import { DependencyResolver } from 'jest-resolve-dependencies';
import fs from 'fs';
import { transformSync } from '@babel/core';

import Module from './module.mjs';

const target_folder = join( dirname( fileURLToPath( import.meta.url ) ), 'product' );
const options = yargs(process.argv).argv;

if ( ! options.entry ) {
    throw new Error ( 'Please provide an entry point using the --entry arg' );
}

const entry_point = resolve( String( options.entry ) );

const haste_map_options = {
    extensions: [ 'js' ],
    maxWorkers: cpus.length > 2 ? 2 : cpus.length, //if cpu count is larger than 2, use 2 workers, otherwise use as many as there are cpus
    name: 'bundly',
    platforms: [],
    rootDir: target_folder,
    roots: [ target_folder ]
} 

const haste_map = new JestHasteMap.default(haste_map_options);
await haste_map.setupCachePath( haste_map_options );
const { hasteFS, moduleMap } = await haste_map.build();

if( ! hasteFS.exists( entry_point ) ) {
    throw new Error ( 'specified entry point is not valid. Please provide path to a valid file' );
}

console.log( chalk.bold( `> Building ${ chalk.blue( options.entry ) }` ) );

const resolver = new Resolver.default( moduleMap, {
    extensions: ['.js'],
    hasCoreModules: false,
    rootDir: target_folder
})
const dependency_resolver = new DependencyResolver( resolver, hasteFS );

/**
 * Generate the full dependency graph of the specified 
 * @param { string } entry_point full path to the entry point of the dependency graph
 * @param { boolean } include_entry Whether to include the entry point in the output
 * 
 * @returns { string[] } list of all dependencies of the specified entry point, as file paths
 */
function generateDependencyGraph ( entry_point, include_entry = true ) {
    const all_files = new Set();
    const queue = [ entry_point ];
    while( queue.length ) {
        const module = queue.shift();

        if( all_files.has( module ) ) {
            continue;
        }

        all_files.add( module );
        queue.push( ...dependency_resolver.resolve( module ) );
    }

    const output = Array.from( all_files );
    if( ! include_entry ) {
        //output.splice( output.indexOf( entry_point ), 1 );
        removeValueFromArrayOnce( output, entry_point );
    }
    return output;
}

function generateModuleObjects( entry_point ) {
    const seen_paths = new Set();
    const modules = new Map();
    const queued_paths = [ entry_point ];
    let id = 0;

    while( queued_paths.length ) {
        const current_module_path = queued_paths.shift();

        if( seen_paths.has( current_module_path ) ) {
            continue;
        }
        seen_paths.add( current_module_path );

        const new_module = new Module( current_module_path, id++, hasteFS, resolver );

        modules.set( new_module.path, new_module );

        queued_paths.push( ...new_module.dependency_map.values() );
    }

    return modules;
}

/**
 * Remove first element of array with specified value/s.
 * @param { any[] } target_array target array
 * @param  {...any} values values to look for
 */
function removeValueFromArrayOnce( target_array, ...values ) {
    values.forEach( value => {
        const index = target_array.indexOf( value );
        if ( index > -1 ) {
            target_array.splice( index, 1 );
        }
        
    })
} 



//const dependency_graph = generateDependencyGraph( entry_point );

const modules = generateModuleObjects( entry_point );

console.log( chalk.bold( `> Found ${ chalk.blue( modules.length )} files` ) );
//console.log( modules );
console.log( Array.from( modules.values() ).map( module => module.path ) );

console.log ( chalk.bold( '> Serializing Bundle '));

const wrapModule = ( id, code ) => `define( ${ id }, function( module, exports, require ) { \n ${ code } } )`;

let output = [];

for ( const module of Array.from( modules.values() ).reverse() ) {
    let id = module.id;
    let code = module.code;

    // if( ! module.dependency_map.values().length ) {
    //     continue;
    // }

    code = transformSync( code, {
        plugins: [
            '@babel/plugin-transform-modules-commonjs'
        ]
    }).code;

    for ( const [ dependency_name, dependency_path ] of module.dependency_map ) {
        const dependency = modules.get( dependency_path );

        const escaped_dep_name = dependency_name.replace(/[\/.]/g, '\\$&');

        //console.log(`require\\s*\\(\\s*('|")${ escaped_dep_name }\\1\\s*\\)`);

        code = code.replace(
            new RegExp(
                `require\\s*\\(\\s*('|")${dependency_name.replace(/[\/.]/g, '\\$&')}\\1\\s*\\)`,
            ),
            `require(${dependency.id})`,
        );
    }

    output.push( wrapModule( id, code ) );
}

output.unshift( fs.readFileSync( './require.js', 'utf8' ) );

output.push( 'requireModule( 0 );' );

output = output.join( '\n' );
if( options.output ) {
    console.log( options.output );
    fs.writeFileSync( options.output, output, 'utf8');
} else {
    console.log( output );
}
