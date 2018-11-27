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

        const shapes = { 'box': new Cube(),
                       'square': new Square()}
        this.submit_shapes( context, shapes );
        this.materials = {
          black: context.get_instance( Phong_Shader ).material( Color.of(.1, .1, .1, 1), { ambient: .7, diffusivity: 0 } ),
          white: context.get_instance( Phong_Shader ).material( Color.of(1, 1, 1, 1), { ambient: .7, diffusivity: .3 } ),
          vending_machine: context.get_instance( Phong_Shader ).material( Color.of(0.5, 0.5, 0.5, 1), { ambient: .7, diffusivity: 0.3 } )
        }
        this.lights = [ new Light( Vec.of(0,10,6,1), Color.of( 1, 1, 1, 1 ), 100000 ) ];
        this.liftFlap = false;
        this.shakeTimer;
        this.shake = [];
        this.currentShake = 0;
        this.pressTimer;
        this.press = [];
        this.currentPress = -1;
        this.buttonTransformations = [
          Mat4.translation(Vec.of(2.725 + .375,   3.25 - 3*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //0
          Mat4.translation(Vec.of(2.725,          3.25,          5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //1
          Mat4.translation(Vec.of(2.725 + .375,   3.25,          5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //2
          Mat4.translation(Vec.of(2.725 + 2*.375, 3.25,          5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //3
          Mat4.translation(Vec.of(2.725,          3.25 - .375,   5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //4
          Mat4.translation(Vec.of(2.725 + .375,   3.25 - .375,   5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //5
          Mat4.translation(Vec.of(2.725 + 2*.375, 3.25 - .375,   5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //6
          Mat4.translation(Vec.of(2.725,          3.25 - 2*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //7
          Mat4.translation(Vec.of(2.725 + .375,   3.25 - 2*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //8
          Mat4.translation(Vec.of(2.725 + 2*.375, 3.25 - 2*.375, 5.8)).times(Mat4.scale(Vec.of(.125,.125,.125))), //9
        ];
        this.textures = [];//fill with texture maps
        //create array for each button's transformations
        //also need member variables to implement button pushing
      }

    make_control_panel(){ //could we remove the other control panel in dependencies.js to limit the user to just our buttons?
      this.key_triggered_button("Shake Left", ["["], () => { //we can come up with better buttons later
        this.shake.unshift(1);
      });
      this.key_triggered_button("Shake Right", ["]"], () => {
        this.shake.unshift(-1);
      });
      this.key_triggered_button("Lift Flap", ["l"], () => {
        this.liftFlap = !this.liftFlap;
      });
      //when a user presses these buttons, it corresponds with pressing a button on the vending machine
      //the button could light up and/or depress
      //this would use the same queue as the shaking mechanism, each button press in queue prompts button animation
      this.key_triggered_button("0", ["0"], ()=>{
        this.press.unshift(0);
      });
      this.key_triggered_button("1", ["1"], ()=>{
        this.press.unshift(1);
      });
      this.key_triggered_button("2", ["2"], ()=>{
        this.press.unshift(2);
      });
      this.key_triggered_button("3", ["3"], ()=>{
        this.press.unshift(3);
      });
      this.key_triggered_button("4", ["4"], ()=>{
        this.press.unshift(4);
      });
      this.key_triggered_button("5", ["5"], ()=>{
        this.press.unshift(5);
      });
      this.key_triggered_button("6", ["6"], ()=>{
        this.press.unshift(6);
      });
      this.key_triggered_button("7", ["7"], ()=>{
        this.press.unshift(7);
      });
      this.key_triggered_button("8", ["8"], ()=>{
        this.press.unshift(8);
      });
      this.key_triggered_button("9", ["9"], ()=>{
        this.press.unshift(9);
      });
    }

    display( graphics_state ){
      graphics_state.lights = this.lights;
      let model_transform = Mat4.identity(); //used for the setting (walls, floor)
      let vm_transform = Mat4.identity(); //used for everything that makes up the vending machine
      //the following code handles the user shaking the vending machine. A queue stores all the shake commands and they are executed one by one
      if (this.currentShake === 0){
        if (this.shake.length){ //checks that we don't try to pop the empty queue
          this.currentShake = this.shake.pop();
          this.shakeTimer = 0; //resets timer
        }
      }
      if (this.currentShake !== 0){
        if (this.shakeTimer === 20){
          this.currentShake = 0;
        }
        else {
          vm_transform = Mat4.identity().times(Mat4.translation(Vec.of(-3.9 * this.currentShake, -7.2, 0))).times(Mat4.rotation(this.currentShake * Math.sin(Math.PI * this.shakeTimer/20)/4, Vec.of(0,0,1))).times(Mat4.translation(Vec.of(3.9 * this.currentShake, 7.2, 0)));
          this.shakeTimer++;
        }
      }

      //for button pushing, we would use a switch for the queue. if we created an array of transformation matrices for the buttons
      //then a button press in the queue results on the same process as above on a matrix on the array
      if (this.currentPress === -1){
        if (this.press.length){
          this.currentPress = this.press.pop();
          this.pressTimer = 0;
        }
      }
      if (this.currentPress !== -1){
        if (this.pressTimer === 20){
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
      if (!this.liftFlap)
      {
        this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-4.5,5.5))).times(Mat4.scale(Vec.of(3, 0.8, thiccness))), this.materials.white);
      }
      else
      {
        this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-1,-4.5,5.5))).times(Mat4.translation(Vec.of(-1,-4.5,5.5))).times(Mat4.scale(Vec.of(3, 0.8, thiccness))), this.materials.white);
      }
      // SHELVES
      // shelf 1
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,5,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,3.25,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,1.5,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,-0.25,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(0,-2,2))).times(Mat4.scale(Vec.of(4, 0.05, 2.5))), this.materials.vending_machine);

      // GATES
      for (let i = 0; i < 5; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          for (let k = 0; k < 3; k++)
          {
            this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(j*1.5-3.2,i*1.75-1.75,4.5-k*1.4))).times(Mat4.scale(Vec.of(0.5, 0.15, 0.025))), this.materials.vending_machine);
          }
        }
      }

      //this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-.5,1.6,3.3))).times(Mat4.scale(Vec.of(2.8,5,1))), this.materials.white); //window, need to make it transparent
      //I'm pretty sure we'll have to reconstruct the vending machine out of multiple squares instead of a cube to implement the window and door
      this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(3.1,3.75,3.3))).times(Mat4.scale(Vec.of(.5,.25,1))), this.materials.white); //screen
      for (let i = 0; i < 10; i++){
        this.shapes.box.draw(graphics_state, vm_transform.times(this.buttonTransformations[i]), this.materials.white);
      }

      //door in progress
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,2.5,-4))).times(Mat4.scale(Vec.of(15,10,1))), this.materials.white); //use automations? back wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,-7.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //floor
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,12.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //ceiling
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //right wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(-15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //left wall
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,10,6))).times(Mat4.scale(Vec.of(.5,.5,.5))), this.materials.white.override({ambient:1})); //light "bulb"
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,11.5,6))).times(Mat4.scale(Vec.of(.1,1,.1))), this.materials.black); //"string" that light hangs from
    }
  }
