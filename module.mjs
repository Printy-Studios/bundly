import fs from 'fs';


export default function Module(path, id, hasteFS, resolver) {
    
    this.id = id;
    this.path = path;
    this.code = null;
    this.dependency_map = null;
    

    this.hasteFS = hasteFS;
    this.resolver = resolver;

    this.generate = () => {

        const dependency_map = new Map(
            hasteFS
                .getDependencies( this.path )
                .map( dependency_name => [
                    dependency_name,
                    resolver.resolveModule( this.path, dependency_name)
                ])
        )

        let code = fs.readFileSync( this.path, 'utf8' );

        console.log(code);


        this.code = code;
        this.dependency_map = dependency_map;
    }

    if( path ) {
        //console.log( this );
        this.generate();
    }

}