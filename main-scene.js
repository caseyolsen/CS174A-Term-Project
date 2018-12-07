window.Shadow_Shader = window.classes.Shadow_Shader =
class Shadow_Shader extends Phong_Shader
{
      material( color, properties ) // Define an internal class "Material" that stores the standard settings found in Phong lighting.
      { return new class Material // Possible properties: ambient, diffusivity, specularity, smoothness, gouraud, texture.
      { constructor( shader, color = Color.of( 0,0,0,1 ), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40, shadow = undefined )
      { Object.assign( this, { shader, color, ambient, diffusivity, specularity, smoothness, shadow } ); // Assign defaults.
      Object.assign( this, properties ); // Optionally override defaults.
      }
      override( properties ) // Easily make temporary overridden versions of a base material, such as
      { const copied = new this.constructor(); // of a different color or diffusivity. Use "opacity" to override only that.
      Object.assign( copied, this );
      Object.assign( copied, properties );
      copied.color = copied.color.copy();
      if( properties[ "opacity" ] != undefined ) copied.color[3] = properties[ "opacity" ];
      return copied;
      }
      }( this, color );
      }
      update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
      { // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
      this.update_matrices( g_state, model_transform, gpu, gl );
      gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

      if( g_state.gouraud === undefined ) { g_state.gouraud = g_state.color_normals = false; } // Keep the flags seen by the shader
      gl.uniform1i( gpu.GOURAUD_loc, g_state.gouraud || material.gouraud ); // program up-to-date and make sure
      gl.uniform1i( gpu.COLOR_NORMALS_loc, g_state.color_normals ); // they are declared.

      const textures = [];
      let textureIndex = 0;

      // set the shadow for Phong Shader
      if (material.shadow )
      {
            gpu.shader_attributes["tex_coord"].enabled = true;
            g_state.shadow = true;

            // gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, material.shadow.id);
            textures.push(material.shadow.id);
            //gl.bindTexture( gl.TEXTURE_2D, material.shadow.id );

            gl.uniform1i(gpu.shadow_loc, textureIndex++); // texture unit 0
      }
      else
      {
            g_state.shadow = false;
      }

      gl.uniform1i( gpu.SHADOW_loc, g_state.shadow);
      gl.uniform4fv( gpu.shapeColor_loc, material.color ); // Send the desired shape-wide material qualities
      gl.uniform1f ( gpu.ambient_loc, material.ambient ); // to the graphics card, where they will tweak the
      gl.uniform1f ( gpu.diffusivity_loc, material.diffusivity ); // Phong lighting formula.
      gl.uniform1f ( gpu.specularity_loc, material.specularity );
      gl.uniform1f ( gpu.smoothness_loc, material.smoothness );

      if( material.texture ) // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
      {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f ( gpu.USE_TEXTURE_loc, 1 );
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
            textures.push(material.texture.id);
            window.gl = gl;
            gl.uniform1i(gpu.texture_loc, textureIndex);

      }
      else
      {
            gl.uniform1f ( gpu.USE_TEXTURE_loc, 0 ); gpu.shader_attributes["tex_coord"].enabled = false;
      }

      textureIndex = 0;

      if (material.shadow) { //implemented to take the shadow image
            gl.activeTexture(gl.TEXTURE0 + textureIndex);
            gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex++]);
      }

      if (material.texture) {
            gl.activeTexture(gl.TEXTURE0 + textureIndex);
            gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
      }

      if( !g_state.lights.length ) return;
      var lightPositions_flattened = [], lightColors_flattened = [], lightAttenuations_flattened = [];
      for( var i = 0; i < 4 * g_state.lights.length; i++ )
      {
            lightPositions_flattened .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
            lightColors_flattened .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
            lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
      }
      gl.uniform4fv( gpu.lightPosition_loc, lightPositions_flattened );
      gl.uniform4fv( gpu.lightColor_loc, lightColors_flattened );
      gl.uniform1fv( gpu.attenuation_factor_loc, lightAttenuations_flattened );
      }
}

class Text_Line extends Shape                       // Text_Line embeds text in the 3D world, using a crude texture method.  This
{                                                   // Shape is made of a horizontal arrangement of quads. Each is textured over with
                                                    // images of ASCII characters, spelling out a string.  Usage:  Instantiate the
                                                    // Shape with the desired character line width.  Assign it a single-line string
                                                    // by calling set_string("your string") on it. Draw the shape on a material
                                                    // with full ambient weight, and text.png assigned as its texture file.  For
  constructor( max_size )                           // multi-line strings, repeat this process and draw with a different matrix.
    { super( "positions", "normals", "texture_coords" );
      this.max_size = max_size;
      var object_transform = Mat4.identity();
      for( var i = 0; i < max_size; i++ )
      { Square.insert_transformed_copy_into( this, [], object_transform );   // Each quad is a separate Square instance.
        object_transform.post_multiply( Mat4.translation([ 1.5,0,0 ]) );
      }
    }
  set_string( line, gl = this.gl )        // Overwrite the texture coordinates buffer with new values per quad,
    { this.texture_coords = [];           // which enclose each of the string's characters.
      for( var i = 0; i < this.max_size; i++ )
        {
          var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
              col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

          var skip = 3, size = 32, sizefloor = size - skip;
          var dim = size * 16,  left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
                                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

          this.texture_coords.push( ...Vec.cast( [ left,  1-bottom], [ right, 1-bottom ], [ left,  1-top ], [ right, 1-top ] ) );
        }
      this.copy_onto_graphics_card( gl, ["texture_coords"], false );
    }
}

window.Cube = window.classes.Cube =
class Cube extends Shape    // A cube inserts six square strips into its arrays.
{ constructor()
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
    }
}


window.Vending_Machine = window.classes.Vending_Machine =
class Vending_Machine extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        //if( !context.globals.has_controls   )
          //context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );
        const r = context.width/context.height;
        context.globals.graphics_state.    camera_transform = Mat4.translation([ 0,-1,-30 ]);  // Locate the camera here (inverted matrix).
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        //for shadow mapping
        this.webgl_manager = context;      // Save off the Webgl_Manager object that created the scene.
      this.scratchpad = document.createElement('canvas');
      this.scratchpad_context = this.scratchpad.getContext('2d');     // A hidden canvas for re-sizing the real canvas to be square.
      this.scratchpad.width   = 256;
      this.scratchpad.height  = 256;
      this.texture = new Texture ( context.gl, "", false, false );        // Initial image source: Blank gif file
      this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

      //create and submit shapes
        const shapes = { 'box': new Cube(),
                         'rounded_cylinder': new Rounded_Capped_Cylinder(100,50),
                         'cylinder': new Capped_Cylinder(2,12),
                       'square': new Square(),
                       'plant': new Shape_From_File( "/assets/houseplant.obj" ),
                       'chair': new Shape_From_File("/assets/chair.obj"),
//                        'pot': new Shape_From_File("/assets/pot.obj"),
                        'leaf': new Shape_From_File("/assets/leaves.obj"),
                       'text': new Text_Line( 2 )}
        this.submit_shapes( context, shapes );
        this.use_mipMap = true;

        this.materials = {
          //implement transparency with glass by manipulating alpha level
          glass: context.get_instance( Phong_Shader ).material( Color.of(1, 1, 1, 0.25), { ambient: 0, diffusivity: 1 } ),
          black: context.get_instance( Phong_Shader ).material( Color.of(.1, .1, .1, 1), { ambient: .7, diffusivity: 0 } ),
          white: context.get_instance( Phong_Shader ).material( Color.of(1, 1, 1, 1), { ambient: .8, diffusivity: .3 } ),
          green: context.get_instance( Fake_Bump_Map ).material( Color.of(58/255, 95/255, 11/255, 1), { ambient: .3, diffusivity: .3 } ),

          yellow: context.get_instance( Phong_Shader ).material( Color.of(1, 1, .8, 1), { ambient: .7, diffusivity: .3 } ),
          vending_machine: context.get_instance( Phong_Shader ).material( Color.of(0.5, 0.5, 0.5, 1), { ambient: .7, diffusivity: 0.3 } ),
          vm_shadow: context.get_instance( Shadow_Shader ).material( Color.of(0.5, 0.5, 0.5, 1), { ambient: .7, diffusivity: 0.3, shadow: this.texture } ),
          chair: context.get_instance( Fake_Bump_Map ).material( Color.of(1, 0, 0, 1), {ambient: 0.3, diffusivity: .3,texture: context.get_instance("assets/bambootexture.jpg")}),
          plant: context.get_instance( Fake_Bump_Map ).material( Color.of(1, 100/255, 0, 1), {ambient: 0.3, diffusivity: .3, shadow: this.texture}),

          cheerios: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cheerios.jpg", true ) } ),
          frosted: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/frosted.jpg", true ) } ),
          pops: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/pops.jpg", true ) } ),
          fruitloops: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/fruitloops.jpg", true ) } ),
          lucky: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/lucky.jpg", true ) } ),
          cocoapuffs: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cocoapuffs.jpg", true ) } ),
          trix: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/trix.jpg", true ) } ),
          rice: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/rice.jpg", true ) } ),
          cinnamon: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cinnamon.jpg", true ) } ),

          raisin: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/raisin.jpg", true ) } ),
          crunch: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/crunch.jpg", true ) } ),
          cookie: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cookie.jpg", true ) } ),
          specialk: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/specialk.jpg", true ) } ),

          pocky: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/pocky.jpg", true ) } ),
          greentea: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/greentea.jpg", true ) } ),
          strawberry: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/strawberry.jpg", true ) } ),
          banana: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/banana.jpg", true ) } ),

          wheat: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/wheat.jpg", true ) } ),
          motts: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/motts.png", true ) } ),
          cheese: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cheeseit.jpg", true ) } ),
          pop: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/poptarts.jpg", true ) } ),
          walls: context.get_instance( Phong_Shader ).material( Color.of(205.0/255, 235.0/255, 249.0/255, 1), { ambient: .7, diffusivity: 0.3} ),
          floor: context.get_instance( Shadow_Shader ).material( Color.of(1, 1, 1, 1), {ambient: 0.5, diffusivity: 0, shadow: this.texture, texture: context.get_instance("assets/floor.jpg")})
          }


        this.sounds = { button: new Audio('assets/sounds/buttonclick.mp3' ),
                  vending: new Audio('assets/sounds/vending.wav'),
                  drop: new Audio('assets/sounds/drop.wav'),
                  shake: new Audio('assets/sounds/shake.mp3'),
                  hum: new Audio('assets/sounds/hum.wav'),
                  sigh: new Audio('assets/sounds/sigh.wav'),
                  allfall: new Audio('assets/sounds/allfall.mp3')
              }

        this.lights = [ new Light( Vec.of(0,10,6,1), Color.of( 1, 1, 1, 1 ), 100000 ) ];
//vantage point of light above vending machine
//     context.globals.graphics_state.camera_transform =  Mat4.look_at( Vec.of(0,10,6), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ).times(Mat4.translation(Vec.of(0,0,.5)));

//vantage point of light above snacks in vending machine
//     context.globals.graphics_state.camera_transform =  Mat4.look_at( Vec.of(-1,6.6,2.5), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ).times(Mat4.translation(Vec.of(0,0,.5)));

        this.row = -1;
        this.column = -1;
        this.allfall = false;
        this.trackMatrixArray = [];
        this.materialsMatrix = [];
        this.itemxPositionMatrix = [[[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]]];
        this.itemyPositionMatrix = [[[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]]];
        this.gatexPositionMatrix = [[[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
                                    [[0,0,0], [0,0,0], [0,0,0], [0,0,0]]];
        this.itemTimesPressedMatrix = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
        this.stuckChance = 1;
        this.hasShaken = false;
        this.columnEntered = false;
        this.stuckItemRotation;

        this.lrshakeTimer;
        this.lrshake = [];
        this.lrcurrentShake = 0;

        this.fbshakeTimer;
        this.fbshake = [];
        this.fbcurrentShake = 0;

        this.pressTimer;
        this.press = [];
        this.currentPress = -1;
        this.buttonTransformations = [ //the ordering is weird I don't care
          Mat4.translation(Vec.of(2.8125,        3.25 - 4*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //E
          Mat4.translation(Vec.of(2.8125 + .375, 3.25,          5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //1
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - .375,   5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //2
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 2*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //3
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 3*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //4
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 4*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //5
          Mat4.translation(Vec.of(2.8125,        3.25,          5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //A
          Mat4.translation(Vec.of(2.8125,        3.25 - .375,   5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //B
          Mat4.translation(Vec.of(2.8125,        3.25 - 2*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125))), //C
          Mat4.translation(Vec.of(2.8125,        3.25 - 3*.375, 5.675)).times(Mat4.scale(Vec.of(.125,.125,.125)))  //D
        ];
        this.buttonTextures = [
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/whiteE.png", true)}), //whiteE
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellowE.png", true)}), //yellowE
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/white1.png", true)}), //white1
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellow1.png", true)}), //yellow1
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/white2.png", true)}), //white2
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellow2.png", true)}), //yellow2
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/white3.png", true)}), //white3
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellow3.png", true)}), //yellow3
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/white4.png", true)}), //white4
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellow4.png", true)}), //yellow4
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/white5.png", true)}), //white5
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellow5.png", true)}), //yellow5
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/whiteA.png", true)}), //whiteA (index 12)
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellowA.png", true)}), //yellowA
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/whiteB.png", true)}), //whiteB
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellowB.png", true)}), //yellowB
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/whiteC.png", true)}), //whiteC
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellowC.png", true)}), //yellowC
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/whiteD.png", true)}), //whiteD
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.9, texture:context.get_instance("assets/buttons/yellowD.png", true)}), //yellowD (index 19)
        ];
        this.pressed = [false, false, false, false, false, false, false, false, false, false];

        this.score = 0;
        this.gameTimer = 60.0;
        this.prompts = [
          "Get A1", "Get A2", "Get A3", "Get A4", //0, 1, 2, 3
          "Get B1", "Get B2", "Get B3", "Get B4", //4, 5, 6, 7
          "Get C1", "Get C2", "Get C3", "Get C4", //8, 9, 10, 11
          "Get D1", "Get D2", "Get D3", "Get D4", //12, 13, 14, 15
          "Get E1", "Get E2", "Get E3", "Get E4", //16, 17, 18, 19
          "Wrong Move! 5 Second Penalty!", //20
          "Shake Right", "Shake Left", //21, 22
          "Shake Forward", "Shake Backwards", //23, 24
          "Game Over", "Press P to Play" //25, 26
        ];
        this.inProgress = false;
        this.needPrompt = true;
        this.promptNum = 26;
        this.stuck = false;
        this.vending = false;
      }

   //helper function to implement sound
  play_sound( name, volume = 1 )
    {
    if( 0 < this.sounds[ name ].currentTime && this.sounds[ name ].currentTime < .3 ) return;
      this.sounds[ name ].currentTime = 0;
      this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);;
      this.sounds[ name ].play();
    }

   //helper function to implement sound
  pause_sound( name, volume = 1 )
    { if( 0 < this.sounds[ name ].currentTime && this.sounds[ name ].currentTime < .3 ) return;
      this.sounds[ name ].currentTime = 0;
      this.sounds[ name ].pause();
    }

     make_control_panel(){ //could we remove the other control panel in dependencies.js to limit the user to just our buttons?
      //can modify formatting if necessary
      this.live_string(box => {box.textContent = "Time: " + this.gameTimer});
      this.new_line();


      this.live_string(box => {box.textContent = this.currentPrompt});
      this.new_line();


      this.live_string(box => {box.textContent = "Score: " + this.score});
      this.new_line();


      this.live_string(box => {
        let rows = ['E', 'D', 'C', 'B', 'A'], cols = ['1', '2', '3', '4', '5'], r, c;

        if (this.row > -1){
          r = rows[this.row];
        }else{
          r = '-';
        }
        if (this.column > -1){
          c = cols[this.column];
        }else{
          c = '-';
        }
        box.textContent = "Selection: " + r + c;
      });
      this.new_line();


      this.key_triggered_button("Pause/Play", ["p"], () =>{
        this.inProgress = !this.inProgress;
      });
      this.new_line();


      this.key_triggered_button("Shake Left", ["j"], () => { //we can come up with better buttons later
        if(this.inProgress || this.gameTimer == 0)
          this.lrshake.unshift(1);
        if(this.promptNum == 22)
        {
            this.stuck = false;
            this.needPrompt = true;
        }
      });
      this.key_triggered_button("Shake Right", ["l"], () => {
        if(this.inProgress || this.gameTimer == 0)
          this.lrshake.unshift(-1);
        if(this.promptNum == 21)
        {
            this.stuck = false;
            this.needPrompt = true;
        }
      });
      this.new_line();


      this.key_triggered_button("Shake Forward", ["i"], () => {
        if(this.inProgress || this.gameTimer == 0)
          this.fbshake.unshift(-1);
        if(this.promptNum == 24)
        {
            this.stuck = false;
            this.needPrompt = true;
        }
      });
      this.key_triggered_button("Shake Backwards", ["k"], () => {
        if(this.inProgress || this.gameTimer == 0)
          this.fbshake.unshift(1);
        if(this.promptNum == 23)
        {
            this.stuck = false;
            this.needPrompt = true;
        }
      });
      this.new_line();


      //pressing buttons on the vending machine
      this.key_triggered_button("A", ["a"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(6);
          this.row = 4;
          this.play_sound("button");
        }
      });
      this.key_triggered_button("1", ["1"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(1);
          this.column = 0;
          this.play_sound("button");
          this.stuck_helper();
        }
      });
      this.new_line();


      this.key_triggered_button("B", ["b"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(7);
          this.row = 3;
          this.play_sound("button");
        }
      });
      this.key_triggered_button("2", ["2"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(2);
          this.column = 1;
          this.play_sound("button");
          this.stuck_helper();
        }
      });
      this.new_line();


      this.key_triggered_button("C", ["c"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(8);
          this.row = 2;
          this.play_sound("button");
        }
      });
      this.key_triggered_button("3", ["3"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(3);
          this.column = 2;
          this.play_sound("button");
          this.stuck_helper();
        }
      });
      this.new_line();


      this.key_triggered_button("D", ["d"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(9);
          this.row = 1;
          this.play_sound("button");
        }
      });
      this.key_triggered_button("4", ["4"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(4);
          this.column = 3;
          this.play_sound("button");
          this.stuck_helper();
        }
      });
      this.new_line();


      this.key_triggered_button("E", ["e"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(0);
          this.row = 0;
          this.play_sound("button");
        }
      });
      this.key_triggered_button("5", ["5"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
          this.press.unshift(5);
          this.column = 4;
          this.play_sound("button");
          this.stuck_helper();
        }
      });

      //added feature drop all item
      this.new_line();
      this.key_triggered_button("CS174A", ["/"], ()=>{
        if(this.inProgress || this.gameTimer == 0){
               this.allfall = true;
               this.sounds["allfall"].play();
        }
      });

      this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();
      this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();
      this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();this.new_line();


//       //shadow image
      this.result_img = this.control_panel.appendChild( Object.assign( document.createElement( "img" ),
                { style:"width:200px; height:" + 200 * this.aspect_ratio + "px" } ) );
    }
    vend_item(graphics_state, vm_transform, t, dt)
    {

      // GATES
      for (let i = 0; i < 5; i++)
      {
        for (let j = 0; j < 4; j++)
        {
                  // this if statement is where it gets hard
                  // its responsible for moving the lane and having the item fall
                 if(this.allfall)
                 {
                    //this.stuckChance = parseInt(Math.random() * 5);
                    //rewards user if they vend the right item, punishes them otherwise
                    if (this.promptNum === 4 * (4 - i) + j){
                      if (!this.vending){
                      this.score++;
                    }
                  }else{
                      if (!this.vending){
                        this.promptNum = 20;
                        this.gameTimer -= 5;
                      }
                  }
                  if (!this.stuck)
                  {
                        this.vending = true;
                        // change front back position
                        if (this.itemxPositionMatrix[i][j][this.itemTimesPressedMatrix[i][j]] < 14*(this.itemTimesPressedMatrix[i][j] + 1))
                        {
                              for (let n = 0; n < 3-this.itemTimesPressedMatrix[i][j]; n++)
                              {
                                    this.itemxPositionMatrix[i][j][2-n] += 1;
                                    this.play_sound("vending");
                                    this.gatexPositionMatrix[i][j][2-n] += 1;
                                    if (this.gatexPositionMatrix[i][j][2-n] >= 14)
                                    {
                                          this.gatexPositionMatrix[i][j][2-n] = 0;
                                    }
                              }
                        }
                        else
                        {
                              this.itemTimesPressedMatrix[i][j] += 1;
                              this.row = -1;
                              this.column = -1;
                              this.vending = false;
                              this.needPrompt = true;
                        }
                  }

                 }
                 else if (this.row == i && this.column == j)
                 {

                    //this.stuckChance = parseInt(Math.random() * 5);
                    //rewards user if they vend the right item, punishes them otherwise
                    if (this.promptNum === 4 * (4 - i) + j){
                      if (!this.vending){
                      this.score++;
                    }
                  }else{
                      if (!this.vending){
                        this.promptNum = 20;
                        this.gameTimer -= 5;
                      }
                  }
                  if (!this.stuck)
                  {
                        this.vending = true;
                        // change front back position
                        if (this.itemxPositionMatrix[i][j][this.itemTimesPressedMatrix[i][j]] < 14*(this.itemTimesPressedMatrix[i][j] + 1))
                        {
                              for (let n = 0; n < 3-this.itemTimesPressedMatrix[i][j]; n++)
                              {
                                    this.itemxPositionMatrix[i][j][2-n] += 1;
                                    this.play_sound("vending");
                                    this.gatexPositionMatrix[i][j][2-n] += 1;
                                    if (this.gatexPositionMatrix[i][j][2-n] >= 14)
                                    {
                                          this.gatexPositionMatrix[i][j][2-n] = 0;
                                    }
                              }
                        }
                        else
                        {
                              this.itemTimesPressedMatrix[i][j] += 1;
                              this.row = -1;
                              this.column = -1;
                              this.vending = false;
                              this.needPrompt = true;
                        }
                  }

            }

            for (let k = 0; k < 3; k++)
            {
                  if (!this.stuck)
                  {
                        if (this.itemxPositionMatrix[i][j][k] >= 14*(k + 1) && this.itemyPositionMatrix[i][j][k] < (4 + i*1.75))
                        {
                              if (this.stuckChance != 3 && this.stuckChance != 2)
                              {
                                    this.itemyPositionMatrix[i][j][k] += 1/20;
                                    this.itemyPositionMatrix[i][j][k] *= 1.1;

                                    if (this.itemyPositionMatrix[i][j][k] >= (4 + i*1.75))
                                    {
                                          this.play_sound("drop"); //need to fix this so the drop sound isn't too early

                                    }
                              }
                              else
                              {
                                    this.stuck = true;
                                    //this.promptNum = 21;
                                    this.play_sound("sigh");
                                    this.stuckChance = 0;
                                    this.needPrompt = true;
                              }

                        }
                  }

            //vending machine labels
            this.shapes.square.draw(graphics_state,vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.07, i*1.75-1.75, 4.6-k*1.4+this.gatexPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.15, 0.15, 0.025))), this.buttonTextures[2*j+2]);
            if(i!=0)
                  this.shapes.square.draw(graphics_state,vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.33, i*1.75-1.75, 4.6-k*1.4+this.gatexPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.15, 0.15, 0.025))), this.buttonTextures[2*(5-i)+10]);
            else //row E
                  this.shapes.square.draw(graphics_state,vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.33, i*1.75-1.75, 4.6-k*1.4+this.gatexPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.15, 0.15, 0.025))), this.buttonTextures[2*i]);


            //labels text
//             this.shapes.text.set_string( this.labelMatrix[i][j] );
//             this.shapes.text.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.3, i*1.75-1.75, 4.6-k*1.4+this.gatexPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.15, 0.125, 0.025))), this.materials.text_image);

            //vending machine gates
            this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2, i*1.75-1.75, 4.5-k*1.4+this.gatexPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.5, 0.15, 0.025))), this.materials.vending_machine);

            //vending machine items
            if (!this.stuck || this.itemxPositionMatrix[i][j][k] < 14*(k + 1) || (this.itemxPositionMatrix[i][j][k] >= 14*(k + 1) && this.itemyPositionMatrix[i][j][k] >= (4 + i*1.75)))
                  this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2, i*1.75-1.25-this.itemyPositionMatrix[i][j][k], 3.4-k*1.4+this.itemxPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.5, 0.7, 0.25))), this.materialsMatrix[i][j]);
            else { //item gets stuck
                  this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2, i*1.75-1.25-this.itemyPositionMatrix[i][j][k], 3.4-k*1.4+this.itemxPositionMatrix[i][j][k]/10))).times(Mat4.rotation(Math.PI / 12, Vec.of(0,0,1))).times(Mat4.scale(Vec.of(0.5, 0.7, 0.25))), this.materialsMatrix[i][j]);
                  this.play_sound("vending");
                  }

            }
        }
      }
      //this.scorekeeper.score +=1;

    }

    stuck_helper()
    {
          this.stuckChance = parseInt(Math.random() * 5);
    }

    display( graphics_state ){
      const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
      graphics_state.lights = this.lights;
      let model_transform = Mat4.identity(); //used for the setting (walls, floor)
      let vm_transform = Mat4.identity(); //used for everything that makes up the vending machine

      if (this.inProgress){
        if(this.needPrompt){
          if(this.stuck){
            this.promptNum = 20 + Math.ceil(4 * Math.random());
            this.needPrompt = false;
          } else{
            this.promptNum = -1;
            while (this.promptNum < 0){
              while (true){
                let r = Math.floor(5 * Math.random());
                let c = Math.floor(4 * Math.random());
                if (this.itemTimesPressedMatrix[r][c] < 3){
                  this.promptNum = 4 * (4 - r) + c;
                  break;
                }
              }
            }
            this.needPrompt = false;
          }
        }
        this.currentPrompt = this.prompts[this.promptNum];
      } else{
        this.currentPrompt = this.prompts[26];
      }

//       this.play_sound("hum");

      //the following code handles the user shaking the vending machine. A queue stores all the shake commands and they are executed one by one
      //left and right
      if (this.lrcurrentShake === 0){
        if (this.lrshake.length){ //checks that we don't try to pop the empty queue
          this.lrcurrentShake = this.lrshake.pop();
          this.lrshakeTimer = 0; //resets timer
        }

        if(this.fbcurrentShake=== 0)
            this.pause_sound("shake");

      }
      if (this.lrcurrentShake !== 0){
        this.play_sound("shake");
        if (this.lrshakeTimer === 10){
          this.lrcurrentShake = 0;
        }
        else {
          vm_transform = Mat4.identity().times(Mat4.translation(Vec.of(-3.9 * this.lrcurrentShake, -7.2, 0))).times(Mat4.rotation(this.lrcurrentShake * Math.sin(Math.PI * this.lrshakeTimer/10)/6, Vec.of(0,0,1))).times(Mat4.translation(Vec.of(3.9 * this.lrcurrentShake, 7.2, 0)));
          this.lrshakeTimer++;
        }
      }
      //forward and backwards
      if (this.fbcurrentShake === 0){
        if (this.fbshake.length){ //checks that we don't try to pop the empty queue
          this.fbcurrentShake = this.fbshake.pop();
          this.fbshakeTimer = 0; //resets timer
        }
        if(this.lrcurrentShake=== 0)
            this.pause_sound("shake");

      }
      if (this.fbcurrentShake !== 0){
        this.play_sound("shake");
        if (this.fbshakeTimer === 10){
          this.fbcurrentShake = 0;
        }
        else {
          //need to calculate this
          vm_transform = Mat4.translation(Vec.of(0, -7.2, 3.3 * this.fbcurrentShake)).times(Mat4.rotation(this.fbcurrentShake * Math.sin(Math.PI * this.fbshakeTimer/10)/6, Vec.of(1,0,0))).times(Mat4.translation(Vec.of(0, 7.2, -3.3 * this.fbcurrentShake)));
          this.fbshakeTimer++;
        }
      }

      //a button press in the queue results on the same process as above on a matrix on the array
      if (this.currentPress === -1){
        if (this.press.length){
          this.currentPress = this.press.pop();
          this.pressTimer = 0;
          this.pressed[this.currentPress] = true;
        }
      }
      if (this.currentPress !== -1){
        if (this.pressTimer === 20){
          this.pressed[this.currentPress] = false;
          this.currentPress = -1;
        }
        else if (this.pressTimer < 10){
          this.buttonTransformations[this.currentPress] = this.buttonTransformations[this.currentPress].times(Mat4.translation(Vec.of(0,0,-.05)));
          this.pressTimer++;
        }
        else {
          this.buttonTransformations[this.currentPress] = this.buttonTransformations[this.currentPress].times(Mat4.translation(Vec.of(0,0,.05)));
          this.pressTimer++;
        }
      }



      //draw the shadow (scene from vantage point of the light)
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,1,25))).times(Mat4.scale(Vec.of(4,3,0))), this.materials.vending_machine);
      this.scratchpad_context.drawImage( this.webgl_manager.canvas, 0, 0, 256, 256 );
      this.texture.image.src = this.result_img.src = this.scratchpad.toDataURL("image/png");

								// Clear the canvas and start over, beginning scene 2:
      this.webgl_manager.gl.clear( this.webgl_manager.gl.COLOR_BUFFER_BIT | this.webgl_manager.gl.DEPTH_BUFFER_BIT);

      //drawing all the things
      //Vending machine dimensions are usually 72"H x 39"W x 33"D, 5:1 scale, centered at origin
      //Vending Machine is multiple boxes put together


      let thiccness = 0.2;



      //back:
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.scale(Vec.of(4, 7, thiccness))), this.materials.vending_machine);
      //right side
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(4,0,2.5))).times(Mat4.scale(Vec.of(thiccness, 7, 3))), this.materials.vending_machine);
      // left side
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-4,0,2.5))).times(Mat4.scale(Vec.of(thiccness, 7, 3))), this.materials.vending_machine);
      // top
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,6.8,2.5))).times(Mat4.scale(Vec.of(4, thiccness, 3))), this.materials.vending_machine);
      // bottom
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,-6.8,2.5))).times(Mat4.scale(Vec.of(4, thiccness, 3))), this.materials.vending_machine);
      //light in machine
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,6.6,2.5))).times(Mat4.scale(Vec.of(2, 0.03, 3))), this.materials.white.override({ambient:1}));
      // front bottom bottom
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-6,5.5))).times(Mat4.scale(Vec.of(3, 0.7, thiccness))), this.materials.vending_machine);
      // front bottom top
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-3,5.5))).times(Mat4.scale(Vec.of(3, 0.7, thiccness))), this.materials.vending_machine);
      // front right
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(3,0,5.5))).times(Mat4.scale(Vec.of(1, 6.9, thiccness))), this.materials.vending_machine);
      // inside divider
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(2.1, 0,2.5))).times(Mat4.scale(Vec.of(thiccness, 6.9, 3))), this.materials.vm_shadow);

      // FLAP
      //if (!this.liftFlap)
      //{
      //  this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-4.5,5.5))).times(Mat4.scale(Vec.of(2.8, 0.8, 0.02))), this.materials.white);
      //}
      //else
      //{
        //this.flapAngle = -0.5/2*Math.PI + 0.5/2*Math.PI*Math.sin((2*Math.PI)*3*dt);
        //.times(Mat4.translation(Vec.of(0,0,2)))
      //  if (this.flapAngle < 50)
      //  {
      //    this.flapAngle += 2;
      //  }
      //  this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-4.5,5.5))).times(Mat4.rotation(dt, Vec.of(1,0,0))).times(Mat4.scale(Vec.of(2.8, 0.8, 0.02))), this.materials.white);
      //}

      // SHELVES
      // shelf 1
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,5,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,3.25,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,1.5,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,-0.25,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,-2,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);

      this.materialsMatrix = [[this.materials.cheerios, this.materials.frosted, this.materials.trix, this.materials.rice],
                              [this.materials.cinnamon, this.materials.lucky, this.materials.pops, this.materials.cocoapuffs],
                              [this.materials.crunch, this.materials.raisin, this.materials.cookie, this.materials.specialk],
                              [this.materials.pocky, this.materials.greentea, this.materials.strawberry, this.materials.banana],
                              [this.materials.wheat, this.materials.motts, this.materials.cheese, this.materials.pop]]

      this.labelMatrix = [["E1", "E2", "E3", "E4"],
                          ["D1", "D2", "D3", "D4"],
                          ["C1", "C2", "C3", "C4"],
                          ["B1", "B2", "B3", "B4"],
                          ["A1", "A2", "A3", "A4"]]


      this.vend_item(graphics_state, vm_transform, t, dt);

      //this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-.5,1.6,3.3))).times(Mat4.scale(Vec.of(2.8,5,1))), this.materials.white); //window, need to make it transparent
      //I'm pretty sure we'll have to reconstruct the vending machine out of multiple squares instead of a cube to implement the window and door
      this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(3.1,3.75,3.3))).times(Mat4.scale(Vec.of(.5,.25,1))), this.materials.white); //screen
      for (let i = 0; i < 10; i++){
        this.shapes.box.draw(graphics_state, vm_transform.times(this.buttonTransformations[i]), (this.pressed[i] ? this.buttonTextures[2 * i + 1] : this.buttonTextures[2 * i]));
        //this.shapes.box.draw(graphics_state, vm_transform.times(this.buttonTransformations[i]), (this.pressed[i] ? this.materials.yellow : this.materials.white));
      }

      //ROOM
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,2.5,-4))).times(Mat4.scale(Vec.of(15,10,1))), this.materials.walls); //use automations? back wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,-7.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.floor); //floor
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,12.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //ceiling
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.walls); //right wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(-15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.walls); //left wall
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,10,6))).times(Mat4.scale(Vec.of(.5,.5,.5))), this.materials.white.override({ambient:1})); //light "bulb"
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,11.5,6))).times(Mat4.scale(Vec.of(.1,1,.1))), this.materials.black); //"string" that light hangs from

//shadow
//        this.shapes.square.draw(graphics_state, vm_transform
//        .times(Mat4.scale(Vec.of(12,12,0)))
//        .times(Mat4.translation(Vec.of(5,0,0))), this.materials.shadow);

//transparent glass
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-0.85,2.2,5.5))).times(Mat4.scale(Vec.of(2.9,4.5,0.2))), this.materials.glass);

      //PLANT
      this.shapes.plant.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(9,-3.2555,3))).times(Mat4.scale(Vec.of(1.4,1.4,1.4))), this.materials.plant);
      this.shapes.leaf.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(9,-2.1,3))).times(Mat4.scale(Vec.of(1.7,1.7,1.7))), this.materials.green);
      this.shapes.leaf.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(9.4,-1.3,3))).times(Mat4.scale(Vec.of(1.7,1.7,1.7))), this.materials.green);

      //chair
      this.shapes.chair.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(-9, -3.708, 4))).times(Mat4.scale(Vec.of(2.5,2.5,2.5))), this.materials.chair);


      if (this.inProgress)this.gameTimer = (this.gameTimer - dt).toFixed(2);
      if (this.gameTimer <= 0){
        this.inProgress = false;
        this.gameTimer = 0;
        this.currentPrompt = this.prompts[25];
      }


    }
  }
