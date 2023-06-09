const { transformSync } = require( '@babel/core' );

exports.transformCode = function( code ) {
    const transformResult = { code: '' };

    try {
        transformResult.code = transformSync( code, {
            plugins: ['@babel/plugin-transform-modules-commonjs']
        }).code
    } catch ( err ) {
        transformResult.errorMessage = err.message;
    }

    return transformResult;
}