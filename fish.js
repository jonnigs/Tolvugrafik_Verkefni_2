var canvas;
var gl;

var NumVertices  = 15;
var NumBody = 6;
var NumFins = 6;
var NumTail = 3;
var NumFishes = 15;

// Hnútar fisks
var vertices = [
  // líkami (spjald)
  vec4( -0.5, -0.1, 0.0, 1.0 ),
  vec4(  0.5, -0.1, 0.0, 1.0 ),
	vec4( -0.5,  0.1, 0.0, 1.0 ),
	vec4( -0.5,  0.1, 0.0, 1.0 ),
	vec4(  0.5, -0.1, 0.0, 1.0 ),
	vec4(  0.5,  0.1, 0.0, 1.0 ),
  // ugggar (þríhyrningar)
  vec4(  0.3,  0.0, 0.0, 1.0 ),
  vec4(  0.0,  0.0, 0.0, 1.0 ),
  vec4(  0.0,  0.0, 0.2, 1.0 ),
  vec4(  0.3,  0.0, 0.0, 1.0 ),
  vec4(  0.0,  0.0, 0.0, 1.0 ),
  vec4(  0.0,  0.0, -0.2, 1.0 ),
	// sporður (þríhyrningur)
  vec4( -0.5,  0.0, 0.0, 1.0 ),
  vec4( -1.0,  0.15, 0.0, 1.0 ),
  vec4( -1.0, -0.15, 0.0, 1.0 )
];

// Litir til að lita fiskana með
var randColors = [
  vec4(0.0, 0.0, 0.0, 1.0), //Svartur
  vec4(1.0, 0.0, 0.0, 1.0), //Rauður
  vec4(0.0, 1.0, 0.0, 1.0), //Grænn
  vec4(0.0, 0.0, 1.0, 1.0), //Blár
  vec4(1.0, 1.0, 0.0, 1.0), //Gulur
  vec4(1.0, 0.0, 1.0, 1.0), //Fjólublár
  vec4(0.0, 1.0, 1.0, 1.0), //Ljórblár
  vec4(0.8, 0.8, 0.8, 1.0), //Hvítur
  vec4(0.5, 0.0, 0.0, 1.0), //Vínrauður
  vec4(0.0, 0.5, 0.0, 1.0), //Dökkgrænn
  vec4(0.0, 0.0, 0.5, 1.0), //Dökkblár
  vec4(0.5, 0.5, 0.0, 1.0), //Ræpugrænn
  vec4(0.5, 0.0, 0.5, 1.0), //Dökkfjólublár
  vec4(0.0, 0.5, 0.5, 1.0), //Sægrænn
  vec4(0.5, 0.5, 0.5, 1.0), //Grár
];

var randColorNum = [];
var randTranslateNum = [];
var randDirectionNum = [];
var randSwimDir = [];

var movement = false;     // Er músarhnappur niðri?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail = [];         // Snúningshorn sporðs
var incTail = [];         // Breyting á snúningshorni sporðs
var rotFins = [];         // Snúningshorn uggga
var incFins = [];         // Breyting á snúningshorni ugga
var swimX = [];           // Syndir áfram í X stefnu
var swimY = [];           // Syndir áfram í Y stefnu
var swimZ = [];           // Syndir áfram í Z stefnu
var r = [];               // Hraði fiska
var theta = [];           // Horn til að snúa fisk hægri/vinstri frá honum séð
var phi = [];             // Horn til að snúa fisk upp/niður frá honum séð
var zView = 2.0;          // Staðsetning áhorfanda í z-hniti

var separation = false;   // Fiskur forðast árekstra
var alignment = false;    // Fiskur lagar stefnu sína að meðalstefnu hópsins
var cohersion = false;    // Fiskur sækist í meðalstaðsetningu hópsins

var proLoc;
var mvLoc;
var colorLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    fiskabur();
    generateTenRandomFishes();
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    // Setjum ofanvarpsfylki hér í upphafi
    var proj = perspective( 90.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));


    // Atburðaföll fyrir mús
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
    	    spinY += (e.offsetX - origX) % 360;
            spinX += (e.offsetY - origY) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    // Atburðafall fyrir lyklaborð
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zView += 0.2;
                break;
            case 40:	// niður ör
                zView -= 0.2;
                break;
            case 83:  // S fyrir separation
                if(separation == true){
                  separation = false;
                } else {
                  separation = true;
                }
                break;
            case 65:  // A fyrir alignment
                if(alignment == true){
                  alignment = false;
                } else {
                  alignment = true;
                }
                break;
            case 67:  // C fyrir cohersion
                if(cohersion == true){
                  cohersion = false;
                } else {
                  cohersion = true;
                }
                break;
         }
     }  );

    // Atburðafall fyri músarhjól
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zView += 0.2;
         } else {
             zView -= 0.2;
         }
     }  );

    render();
}

function fiskabur() {
  var cubeVertecies = [
    // Horn á fiskabúri
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
  ];

  var indices = [ 0, 1, 2, 3, 0, 4, 5, 1, 2, 6, 5, 4, 7, 6, 2, 3, 7];

    for ( var i = 0; i < indices.length; ++i ) {
        vertices.push( cubeVertecies[indices[i]] );
    }
}

function generateTenRandomFishes() {

  for( var i = 0; i<=3*NumFishes; i++) {
    randColorNum.push(Math.round(Math.random()*14)); // Þrír random litir fyrir hvern fisk
    randTranslateNum.push(Math.random()*6 - 3);      // Þrjár random hliðranir fyrir fiskinn til að byrja
    randSwimDir.push((Math.random()*2-1)/25);       // Þrjár random sundstenur fyrir fiska
  }
  for( var i = 0; i<NumFishes; i++) {
    rotTail.push(Math.round(Math.random()*70 - 35)); // Random byrjunarstaða fyrir sporð
    rotFins.push(Math.round(Math.random()*70 - 35)); // Random byrjunarstaða fyrir ugga
    incFins.push(1.0);
    incTail.push(2.0);
    swimX.push(0);
    swimY.push(0);
    swimZ.push(0);
    theta.push(0);
    phi.push(0);
    r.push(Math.sqrt(Math.pow(randSwimDir[3*i],2) + Math.pow(randSwimDir[3*i+1],2) + Math.pow(randSwimDir[3*i+2],2)));

    thetaRotFish(i);
    phiRotFish(i);

  }
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}
function toRadians (angle) {
  return angle * (Math.PI / 180);
}
function fishOnWall(n) {
  if (swimX[n] + randTranslateNum[3*n] >= 4.5){
    swimX[n] = -4.5 - randTranslateNum[3*n];
  }else if(swimX[n] + randTranslateNum[3*n] <= -4.5) {
    swimX[n] = 4.5 - randTranslateNum[3*n];
  }
  if (swimY[n] + randTranslateNum[3*n+1] >= 4.5){
    swimY[n] = -4.5 - randTranslateNum[3*n+1];
  } else if(swimY[n] + randTranslateNum[3*n+1] <= -4.5) {
    swimY[n] = 4.5 - randTranslateNum[3*n+1];
  }
  if (swimZ[n] + randTranslateNum[3*n+2] >= 4.5){
    swimZ[n] = -4.5 - randTranslateNum[3*n+2];
  }else if(swimZ[n] + randTranslateNum[3*n+2] <= -4.5) {
    swimZ[n] = 4.5 - randTranslateNum[3*n+2];
  }
}
function thetaRotFish(i){
  var cosTheta = (randSwimDir[3*i]*randSwimDir[3*i])/(Math.abs(randSwimDir[3*i])*Math.sqrt(Math.pow(randSwimDir[3*i],2)+Math.pow(randSwimDir[3*i+2],2)))
  theta[i] = toDegrees(Math.acos(cosTheta));
  if(randSwimDir[3*i]<0 && randSwimDir[3*i+2]>0) { // Neikvætt X, Jákvætt Z
    theta[i] = 180 - theta[i];
  }
  if(randSwimDir[3*i]<0 && randSwimDir[3*i+2]<0) { // Neikvætt X, Neikvætt Z
    theta[i] = 180 + theta[i];
  }
  if(randSwimDir[3*i]>0 && randSwimDir[3*i+2]<0) { // Jákvætt X, Neikvætt Z
    theta[i] = 360 - theta[i];
  }
}
function phiRotFish(i){
  var phiNom = randSwimDir[3*i]*randSwimDir[3*i] + randSwimDir[3*i+2]*randSwimDir[3*i+2];
  var phiDen = Math.sqrt(phiNom) * Math.sqrt(phiNom + randSwimDir[3*i+1]*randSwimDir[3*i+1]);
  phi[i] = toDegrees(Math.acos(phiNom/phiDen));
  if (randSwimDir[3*i+1] < 0) { // Neikvætt Y
    phi[i] = 360-phi[i];
  }
}
function alignFish(){
  var avX = 0;
  var avY = 0;
  var avZ = 0;
  for(i=0; i<NumFishes;i++){
    avX += randSwimDir[3*i];
    avY += randSwimDir[3*i+1];
    avZ += randSwimDir[3*i+2];
  }
  avX = avX/NumFishes;
  avY = avY/NumFishes;
  avZ = avZ/NumFishes;

  for(i=0; i<NumFishes;i++){
    var plusX = randSwimDir[3*i] + 0.00001;
    var minusX = randSwimDir[3*i] - 0.00001;
    var plusY = randSwimDir[3*i+1] + 0.00001;
    var minusY = randSwimDir[3*i+1] - 0.00001;
    var plusZ = randSwimDir[3*i+2] + 0.00001;
    var minusZ = randSwimDir[3*i+2] - 0.00001;
    if(Math.abs(avX - plusX) <= Math.abs(avX - minusX) ) {
      randSwimDir[3*i] = plusX;
    } else if(Math.abs(avX - plusX) >= Math.abs(avX - minusX) ){
      randSwimDir[3*i] = minusX;
    }
    if(Math.abs(avY - plusY) <= Math.abs(avY - minusY) ) {
      randSwimDir[3*i+1] = plusY;
    } else if(Math.abs(avY - plusY) >= Math.abs(avY - minusY) ){
      randSwimDir[3*i+1] = minusY;
    }
    if(Math.abs(avZ - plusZ) <= Math.abs(avZ - minusZ) ) {
      randSwimDir[3*i+2] = plusZ;
    } else if(Math.abs(avZ - plusZ) >= Math.abs(avZ - minusZ) ){
      randSwimDir[3*i+2] = minusZ;
    }
    thetaRotFish(i);
    phiRotFish(i);
  }
}
function renderFiskes(mv,n) {
  gl.uniform4fv( colorLoc, randColors[randColorNum[3*n]] );
  mv = mult( mv, scalem( 0.1 , 0.1 , 0.1 ) );

  // Synda áfram í XYZ áttir
  swimX[n] += randSwimDir[3*n];
  swimY[n] += randSwimDir[3*n+1];
  swimZ[n] += randSwimDir[3*n+2];

  // Tékka hvort að fiskur lendi á vegg
  fishOnWall(n);

  // Virkja mismunandi hluta hjarðhegðunar
  if(separation){
    console.log("S");
  }
  if(alignment){
    alignFish();
  }
  if(cohersion){
    console.log("C");
  }
  // Teikna líkama fisks
  mv = mult( mv, translate(swimX[n] + randTranslateNum[3*n] , swimY[n] + randTranslateNum[3*n+1]  , swimZ[n] + randTranslateNum[3*n+2]  ) );
  mv = mult( mv, rotateY(360-theta[n]) );
  mv = mult( mv, rotateZ(phi[n]) );
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, 0, NumBody );

  // Teikna ugga
  rotFins[n] += incFins[n];
  if( rotFins[n] > 35.0  || rotFins[n] < -35.0 ){
    incFins[n] *= -1;
  }
  gl.uniform4fv( colorLoc, randColors[randColorNum[3*n+1]] );
  mv = mult( mv, rotateX( rotFins[n] ) );
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, NumBody, NumFins/2 );
  gl.uniform4fv( colorLoc, randColors[randColorNum[3*n+1]] );
  mv = mult( mv, rotateX( -2*rotFins[n] ) );
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, NumBody+3, NumFins/2 );
  mv = mult( mv, rotateX( rotFins[n] ) );

  // Teikna sporð og snúa honum
  rotTail[n] += incTail[n];
  if( rotTail[n] > 35.0  || rotTail[n] < -35.0 ){
    incTail[n] *= -1;
  }
  gl.uniform4fv( colorLoc, randColors[randColorNum[3*n+2]] );
  mv = mult( mv, translate ( -0.5, 0.0, 0.0 ) );
  mv = mult( mv, rotateY( rotTail[n] ) );
  mv = mult( mv, translate ( 0.5, 0.0, 0.0 ) );
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, NumBody+NumFins, NumTail );
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt( vec3(0.0, 0.0, zView), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    // Teikna fiskabúr
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 0.0, 1.0) );
    gl.drawArrays( gl.LINE_STRIP, 15, 17 );

    // Teikna fiskana
    for( var i=0; i<NumFishes;i++){
      renderFiskes(mv,i);
    }

    requestAnimFrame( render );
}
