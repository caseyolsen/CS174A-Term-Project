window.Cube = window.classes.Cube =
class Cube extends Shape                 // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
  { constructor()
      { super( "positions", "normals" ); // Name the values we'll define per each vertex.  They'll have positions and normals.

        // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
        this.positions.push( ...Vec.cast( [-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], [1,1,-1],  [-1,1,-1],  [1,1,1],  [-1,1,1],
                                          [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], [1,-1,1],  [1,-1,-1],  [1,1,1],  [1,1,-1],
                                          [-1,-1,1],  [1,-1,1],  [-1,1,1],  [1,1,1], [1,-1,-1], [-1,-1,-1], [1,1,-1], [-1,1,-1] ) );
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(   ...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
                                          [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
                                          [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1] ) );

                 // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
                 // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
                 // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push( 0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
                          14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22 );
        // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
      }
  }

window.Cube_Outline = window.classes.Cube_Outline =
class Cube_Outline extends Shape
  { constructor()
      { super( "positions", "colors" ); // Name the values we'll define per each vertex.

        //  DONE (Requirement 5).
                                // When a set of lines is used in graphics, you should think of the list entries as
                                // broken down into pairs; each pair of vertices will be drawn as a line segment.

        this.positions.push(...Vec.cast([-1,-1,-1], [-1,-1,1], [-1,-1,-1], [-1,1,-1], [-1,-1,-1], [1,-1,-1],
                                        [1,1,-1],   [1,1,1],   [1,1,-1],   [1,-1,-1], [1,1,-1],   [-1,1,-1],
                                        [-1,1,1],   [-1,1,-1], [-1,1,1],   [-1,-1,1], [-1,1,1],   [1,1,1],
                                        [1,-1,1],   [1,-1,-1], [1,-1,1],   [1,1,1],   [1,-1,1],   [-1,-1,1]));
        for(let i = 0; i<24; i++){this.colors.push(Color.of(1,1,1,1))};
        this.indexed = false;       // Do this so we won't need to define "this.indices".
      }
  }

window.Cube_Single_Strip = window.classes.Cube_Single_Strip =
class Cube_Single_Strip extends Shape
  { constructor()
      { super( "positions", "normals" );

        // TODO (Extra credit part I)
        this.positions.push(...Vec.cast([-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], [1,1,-1],  [-1,1,-1],  [1,1,1],  [-1,1,1],
                                          [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], [1,-1,1],  [1,-1,-1],  [1,1,1],  [1,1,-1],
                                          [-1,-1,1],  [1,-1,1],  [-1,1,1],  [1,1,1], [1,-1,-1], [-1,-1,-1], [1,1,-1], [-1,1,-1]));
        this.normals.push(...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
                                          [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
                                          [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1]));
        this.indices.push();
      }
  }

window.Vending_Machine = window.classes.Vending_Machine =
class Vending_Machine extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

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
                       'square': new Square()}
        this.submit_shapes( context, shapes );
        this.use_mipMap = true;

        this.materials = {
          black: context.get_instance( Phong_Shader ).material( Color.of(.1, .1, .1, 1), { ambient: .7, diffusivity: 0 } ),
          white: context.get_instance( Phong_Shader ).material( Color.of(1, 1, 1, 1), { ambient: .7, diffusivity: .3 } ),
          yellow: context.get_instance( Phong_Shader ).material( Color.of(1, 1, .8, 1), { ambient: .7, diffusivity: .3 } ),
          vending_machine: context.get_instance( Phong_Shader ).material( Color.of(0.5, 0.5, 0.5, 1), { ambient: .7, diffusivity: 0.3 } ),

          cheerios: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/cheerios.jpg", true ) } ),
          frosted: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/frosted.jpg", true ) } ),
          pops: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/pops.jpg", true ) } ),
          fruitloops: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/fruitloops.jpg", true ) } ),
          frostedflakes: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/frostedflakes.jpg", true ) } ),
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
          pop: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, texture: context.get_instance( "assets/boxes/poptarts.jpg", true ) } )
        }

        this.sounds = { button: new Audio('assets/sounds/buttonclick.mp3' )
              }

        this.timer;
        this.queue = [];
        this.curr = 0;
        this.lights = [ new Light( Vec.of(0,10,6,1), Color.of( 1, 1, 1, 1 ), 100000 ) ];
        this.row = -1;
        this.column = -1;
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
        this.itemTimesPressedMatrix = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
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
          Mat4.translation(Vec.of(2.8125,        3.25 - 4*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //E
          Mat4.translation(Vec.of(2.8125 + .375, 3.25,          5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //1
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - .375,   5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //2
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 2*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //3
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 3*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //4
          Mat4.translation(Vec.of(2.8125 + .375, 3.25 - 4*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //5
          Mat4.translation(Vec.of(2.8125,        3.25,          5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //A
          Mat4.translation(Vec.of(2.8125,        3.25 - .375,   5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //B
          Mat4.translation(Vec.of(2.8125,        3.25 - 2*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //C
          Mat4.translation(Vec.of(2.8125,        3.25 - 3*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125)))  //D
        ];
        this.buttonTextures = [
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/whiteE.png", true)}), //whiteE
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellowE.png", true)}), //yellowE
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/white1.png", true)}), //white1
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellow1.png", true)}), //yellow1
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/white2.png", true)}), //white2
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellow2.png", true)}), //yellow2
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/white3.png", true)}), //white3
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellow3.png", true)}), //yellow3
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/white4.png", true)}), //white4
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellow4.png", true)}), //yellow4
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/white5.png", true)}), //white5
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellow5.png", true)}), //yellow5
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/whiteA.png", true)}), //whiteA
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellowA.png", true)}), //yellowA
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/whiteB.png", true)}), //whiteB
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellowB.png", true)}), //yellowB
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/whiteC.png", true)}), //whiteC
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellowC.png", true)}), //yellowC
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/whiteD.png", true)}), //whiteD
          context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {ambient:0.7, texture:context.get_instance("assets/buttons/yellowD.png", true)}), //yellowD
        ];
        this.pressed = [false, false, false, false, false, false, false, false, false, false];
        //fill with texture maps
        //create array for each button's transformations
        //also need member variables to implement button pushing
      }

   //helper function to implement sound
  play_sound( name, volume = 1 )
    { if( 0 < this.sounds[ name ].currentTime && this.sounds[ name ].currentTime < .3 ) return;
      this.sounds[ name ].currentTime = 0;
      this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);;
      this.sounds[ name ].play();
    }

    make_control_panel(){ //could we remove the other control panel in dependencies.js to limit the user to just our buttons?
      this.key_triggered_button("Shake Left", ["j"], () => { //we can come up with better buttons later
        this.lrshake.unshift(1);
      });
      this.key_triggered_button("Shake Right", ["l"], () => {
        this.lrshake.unshift(-1);
      });
      this.key_triggered_button("Shake Forward", ["i"], () => {
        this.fbshake.unshift(-1);
      });
      this.key_triggered_button("Shake Backwards", ["k"], () => {
        this.fbshake.unshift(1);
      });
      this.new_line();

      //when a user presses these buttons, it corresponds with pressing a button on the vending machine
      //the button could light up and/or depress
      //this would use the same queue as the shaking mechanism, each button press in queue prompts button animation
      this.key_triggered_button("1", ["1"], ()=>{
        this.press.unshift(1);
        this.column = 0;
        this.play_sound("button");
      });
      this.key_triggered_button("2", ["2"], ()=>{
        this.press.unshift(2);
        this.column = 1;
        this.play_sound("button");

      });
      this.key_triggered_button("3", ["3"], ()=>{
        this.press.unshift(3);
        this.column = 2;
        this.play_sound("button");

      });
      this.key_triggered_button("4", ["4"], ()=>{
        this.press.unshift(4);
        this.column = 3;
        this.play_sound("button");

      });
      this.key_triggered_button("5", ["5"], ()=>{
        this.press.unshift(5);
        this.column = 4;
        this.play_sound("button");
      });
      this.new_line();

      this.key_triggered_button("A", ["a"], ()=>{
        this.press.unshift(6);
        this.row = 0;
        this.play_sound("button");

      });
      this.key_triggered_button("B", ["b"], ()=>{
        this.press.unshift(7);
        this.row = 1;
        this.play_sound("button");

      });
      this.key_triggered_button("C", ["c"], ()=>{
        this.press.unshift(8);
        this.row = 2;
        this.play_sound("button");
      });
      this.key_triggered_button("D", ["d"], ()=>{
        this.press.unshift(9);
        this.row = 3;
        this.play_sound("button");
      });
      this.key_triggered_button("E", ["e"], ()=>{
        this.press.unshift(0);
        this.row = 4;
        this.play_sound("button");
      });
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
            if (this.row == i && this.column == j)
            {
                  // change front back position
                  if (this.itemxPositionMatrix[i][j][this.itemTimesPressedMatrix[i][j]] < 14*(this.itemTimesPressedMatrix[i][j] + 1))
                  {
                        for (let n = 0; n < 3-this.itemTimesPressedMatrix[i][j]; n++)
                        {
                              this.itemxPositionMatrix[i][j][2-n] += 1;
                        }
                  }
                  else
                  {
                        this.itemTimesPressedMatrix[i][j] += 1;
                        this.row = -1;
                        this.column = -1;
                  }
            }

            for (let k = 0; k < 3; k++)
            {
                  if (this.itemxPositionMatrix[i][j][k] >= 14*(k + 1) && this.itemyPositionMatrix[i][j][k] < (4 + i*1.75))
                  {
                        this.itemyPositionMatrix[i][j][k] += 1/20;
                        this.itemyPositionMatrix[i][j][k] *= 1.1;
                  }
                  this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2, i*1.75-1.75-this.itemyPositionMatrix[i][j][k], 4.5-k*1.4+this.itemxPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.5, 0.15, 0.025))), this.materials.vending_machine);
                  this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2, i*1.75-1.25-this.itemyPositionMatrix[i][j][k], 4-k*1.4+this.itemxPositionMatrix[i][j][k]/10))).times(Mat4.scale(Vec.of(0.5, 0.7, 1))), this.materialsMatrix[i][j]);
            }
        }
      }
    }


    display( graphics_state ){
      const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
      graphics_state.lights = this.lights;
      let model_transform = Mat4.identity(); //used for the setting (walls, floor)
      let vm_transform = Mat4.identity(); //used for everything that makes up the vending machine
      //the following code handles the user shaking the vending machine. A queue stores all the shake commands and they are executed one by one
      //left and right
      if (this.lrcurrentShake === 0){
        if (this.lrshake.length){ //checks that we don't try to pop the empty queue
          this.lrcurrentShake = this.lrshake.pop();
          this.lrshakeTimer = 0; //resets timer
        }
      }
      if (this.lrcurrentShake !== 0){
        if (this.lrshakeTimer === 20){
          this.lrcurrentShake = 0;
        }
        else {
          vm_transform = Mat4.identity().times(Mat4.translation(Vec.of(-3.9 * this.lrcurrentShake, -7.2, 0))).times(Mat4.rotation(this.lrcurrentShake * Math.sin(Math.PI * this.lrshakeTimer/20)/4, Vec.of(0,0,1))).times(Mat4.translation(Vec.of(3.9 * this.lrcurrentShake, 7.2, 0)));
          this.lrshakeTimer++;
        }
      }
      //forward and backwards
      if (this.fbcurrentShake === 0){
        if (this.fbshake.length){ //checks that we don't try to pop the empty queue
          this.fbcurrentShake = this.fbshake.pop();
          this.fbshakeTimer = 0; //resets timer
        }
      }
      if (this.fbcurrentShake !== 0){
        if (this.fbshakeTimer === 20){
          this.fbcurrentShake = 0;
        }
        else {
          //need to calculate this
          vm_transform = Mat4.translation(Vec.of(0, -7.2, 3.3 * this.fbcurrentShake)).times(Mat4.rotation(this.fbcurrentShake * Math.sin(Math.PI * this.fbshakeTimer/20)/4, Vec.of(1,0,0))).times(Mat4.translation(Vec.of(0, 7.2, -3.3 * this.fbcurrentShake)));
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
          this.buttonTransformations[this.currentPress] = this.buttonTransformations[this.currentPress].times(Mat4.translation(Vec.of(0,0,-.1)));
          this.pressTimer++;
        }
        else {
          this.buttonTransformations[this.currentPress] = this.buttonTransformations[this.currentPress].times(Mat4.translation(Vec.of(0,0,.1)));
          this.pressTimer++;
        }
      }

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
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(2.1, 0,2.5))).times(Mat4.scale(Vec.of(thiccness, 6.9, 3))), this.materials.vending_machine);

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


      this.vend_item(graphics_state, vm_transform, t, dt);

      //this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-.5,1.6,3.3))).times(Mat4.scale(Vec.of(2.8,5,1))), this.materials.white); //window, need to make it transparent
      //I'm pretty sure we'll have to reconstruct the vending machine out of multiple squares instead of a cube to implement the window and door
      this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(3.1,3.75,3.3))).times(Mat4.scale(Vec.of(.5,.25,1))), this.materials.white); //screen
      for (let i = 0; i < 10; i++){
        //this.shapes.box.draw(graphics_state, vm_transform.times(this.buttonTransformations[i]), this.buttonTextures[2 * i]);
        this.shapes.box.draw(graphics_state, vm_transform.times(this.buttonTransformations[i]), (this.pressed[i] ? this.materials.yellow : this.materials.white));
      }

      //door in progress
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,2.5,-4))).times(Mat4.scale(Vec.of(15,10,1))), this.materials.white); //use automations? back wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,-7.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //floor
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,12.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //ceiling
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //right wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(-15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //left wall
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,10,6))).times(Mat4.scale(Vec.of(.5,.5,.5))), this.materials.white.override({ambient:1})); //light "bulb"
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,11.5,6))).times(Mat4.scale(Vec.of(.1,1,.1))), this.materials.black); //"string" that light hangs from


/*
      //creating VISIBLE cereal boxes
      //first layer
      //row 1
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 5.8, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheerios);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 5.8, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.frosted);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 5.8, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.trix);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 5.8, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.rice);
       //row 2
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 4, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cinnamon);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 4, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.lucky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 4, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pops);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 4, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cocoapuffs);

              //row 3
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 2.3, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.crunch);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 2.3, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.raisin);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 2.3, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cookie);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 2.3, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.specialk);
              //row 4
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 0.6, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pocky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70,0.6, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.greentea);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 0.6, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.strawberry);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 0.6, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.banana);

              //row 5
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, -1.25, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.wheat);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, -1.25, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.motts);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, -1.25, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheese);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, -1.25, 4)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pop);

      //second layer
      //row 1
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 5.8, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheerios);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 5.8, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.frosted);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 5.8, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.trix);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 5.8, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.rice);
       //row 2
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 4, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cinnamon);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 4, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.lucky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 4, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pops);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 4, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cocoapuffs);

              //row 3
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 2.3, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.crunch);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 2.3, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.raisin);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 2.3, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cookie);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 2.3, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.specialk);
              //row 4
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 0.6, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pocky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70,0.6, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.greentea);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 0.6, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.strawberry);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 0.6, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.banana);

              //row 5
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, -1.25, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.wheat);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, -1.25, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.motts);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, -1.25, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheese);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, -1.25, 2)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pop);

      //third layer
            //row 1
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 5.8, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheerios);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 5.8, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.frosted);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 5.8, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.trix);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 5.8, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.rice);
       //row 2
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 4, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cinnamon);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 4, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.lucky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 4, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pops);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 4, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cocoapuffs);

              //row 3
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 2.3, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.crunch);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, 2.3, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.raisin);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 2.3, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cookie);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 2.3, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.specialk);
              //row 4
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, 0.6, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pocky);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70,0.6, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.greentea);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, 0.6, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.strawberry);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, 0.6, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.banana);

              //row 5
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-3.2, -1.25, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.wheat);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-1.70, -1.25, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.motts);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(-0.2, -1.25, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.cheese);
       this.shapes.square.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(1.3, -1.25, 1)).times(Mat4.scale(Vec.of(0.5,0.7,1)))), this.materials.pop);

 //this.shapes.rounded_cylinder.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(15,0,0))).times(Mat4.rotation(Math.PI*0.5, Vec.of(1,0,0))).times(Mat4.translation(Vec.of(-5,0,0))).times(Mat4.scale(Vec.of(0.2,1,1))), this.materials.black);

*/
    }
  }
