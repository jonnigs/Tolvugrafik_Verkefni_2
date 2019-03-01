var canvas;
var gl;

var NumVertices  = 17;
var NumBody = 6;
var NumFins = 6;
var NumTail = 3;

var points = [];
var colors = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail = 0.0;        // Snúningshorn sporðs
var incTail = 2.0;        // Breyting á snúningshorni sporðs
var rotFins = 0.0;        // Snúningshorn uggga
var incFins = 1.0;        // Breyting á snúningshorni ugga

var zDist = -2.0;

var proLoc;
var colorLoc;
var mvLoc
var modelViewLoc;
var projectionLoc;
var projectionMatrix;

var vertices = [
        // Horn á fiskabúri
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 ),
        // líkami (spjald)
        vec3( -0.5, -0.1, 0.0 ),
        vec3(  0.5, -0.1, 0.0 ),
        vec3( -0.5,  0.1, 0.0 ),
        vec3( -0.5,  0.1, 0.0 ),
        vec3(  0.5, -0.1, 0.0 ),
        vec3(  0.5,  0.1, 0.0 ),
        // ugggar (þríhyrningar)
        vec3(  0.3,  0.0, 0.0 ),
        vec3(  0.0,  0.0, 0.0 ),
        vec3(  0.0,  0.0, 0.2 ),
        vec3(  0.3,  0.0, 0.0 ),
        vec3(  0.0,  0.0, 0.0 ),
        vec3(  0.0,  0.0, -0.2 ),
        // sporður (þríhyrningur)
        vec3( -0.5,  0.0 , 0.0 ),
        vec3( -1.0,  0.15, 0.0 ),
        vec3( -1.0, -0.15, 0.0 )
]

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    fiskabur();
    fiskur();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    modelViewLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionLoc = gl.getUniformLocation( program, "projectionMatrix" );
    projectionMatrix = perspective( 60.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix) );

    var proj = perspective( 90.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
         }
     }  );

    // Event listener for mousewheel
     window.addEventListener("wheel", function(e){
         if( e.deltaY > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );


    render();
}

function fiskabur() {
  var indices = [ 0, 1, 2, 3, 0, 4, 5, 1, 2, 6, 5, 4, 7, 6, 2, 3, 7];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push([ 1.0, 0.0, 0.0, 1.0 ]);
    }
}

function fiskur() {
  for ( var i = 8; i < vertices.length; ++i ) {
      points.push( vertices[i] );
      colors.push([ 1.0, 0.0, 1.0, 1.0 ]);
  }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var ctm = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    ctm = mult( ctm, rotateX(spinX) );
    ctm = mult( ctm, rotateY(spinY) ) ;

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(ctm));
    gl.drawArrays( gl.LINE_STRIP, 0, NumVertices );

    rotTail += incTail;
    if( rotTail > 35.0  || rotTail < -35.0 ){
      incTail *= -1;
    }

    rotFins += incFins;
    if( rotFins > 35.0  || rotFins < -35.0 ){
      incFins *= -1;
    }

    // Teikna líkama fisks (án snúnings)
    //gl.uniform4fv( colorLoc, vec4(0.0, 0.0, 1.0, 1.0) );

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, 17, NumBody );

    // Teikna ugga
    //gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 1.0, 1.0) );
    ctm = mult( ctm, rotateX( rotFins ) );
    gl.uniformMatrix4fv(proLoc, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, NumBody+17, NumFins/2 );

    //gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 1.0, 1.0) );
    ctm = mult( ctm, rotateX( -2*rotFins ) );
    gl.uniformMatrix4fv(proLoc, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, NumBody+3+17, NumFins/2 );
    ctm = mult( ctm, rotateX( rotFins ) );

    // Teikna sporð og snúa honum
    //gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 0.0, 1.0) );

    ctm = mult( ctm, translate ( -0.5, 0.0, 0.0 ) );
    ctm = mult( ctm, rotateY( rotTail ) );
    ctm = mult( ctm, translate ( 0.5, 0.0, 0.0 ) );

    gl.uniformMatrix4fv(proLoc, false, flatten(ctm));
    gl.drawArrays( gl.TRIANGLES, NumBody+NumFins+17, NumTail );

    requestAnimFrame( render );
}
