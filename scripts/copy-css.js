import fs from "fs";
import path from "path";

const src = path.join( "src", "styles", "walkthrough.css" );
const dest = path.join( "dist", "styles", "walkthrough.css" );

fs.mkdirSync( path.join( "dist", "styles" ), { recursive: true } );
fs.copyFileSync( src, dest );

console.log( "Copied CSS file to dist/" );
