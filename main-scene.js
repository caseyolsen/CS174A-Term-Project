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
          white: context.get_instance( Phong_Shader ).material( Color.of(1, 1, 1, 1), { ambient: .7, diffusivity: .3 } )
        }
        this.lights = [ new Light( Vec.of(0,10,6,1), Color.of( 1, 1, 1, 1 ), 100000 ) ];
        this.timer;
        this.queue = [];
        this.curr = 0;
      }
    make_control_panel(){
      this.key_triggered_button("Shake Left", ["["], () => { //we can come up with better buttons later
        this.queue.unshift(1);
      });
      this.key_triggered_button("Shake Right", ["]"], () => {
        this.queue.unshift(-1);
      });
    }
    display( graphics_state ){
      graphics_state.lights = this.lights;
      let model_transform = Mat4.identity();
      let vm_transform = Mat4.identity();
      if (this.curr === 0){
        if (this.queue.length){
          this.curr = this.queue.pop();
          this.timer = 0;
        }
      }
      if (this.curr !== 0){
        if (this.timer === 20){
          this.curr = 0;
        }
        else{
          vm_transform = Mat4.identity().times(Mat4.translation(Vec.of(-3.9 * this.curr, -7.2, 0))).times(Mat4.rotation(this.curr * Math.sin(Math.PI * this.timer/20)/4, Vec.of(0,0,1))).times(Mat4.translation(Vec.of(3.9 * this.curr, 7.2, 0)));
          this.timer++;
        }
      }
      this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.scale(Vec.of(3.9, 7.2, 3.2))), this.materials.black); //Vending machine dimensions are usually 72"H x 39"W x 33"D, 5:1 scale, centered at origin
      this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(-.5,1.6,3.3))).times(Mat4.scale(Vec.of(2.8,5,1))), this.materials.white); //window, need to make it transparent
      //if window isn't able to delete part of the vending machine box, we may have to reconstruct the vending machine out of multiple squares instead of a cube
      this.shapes.square.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(3.1,3.75,3.3))).times(Mat4.scale(Vec.of(.5,.25,1))), this.materials.white); //screen
      for (let i = 0; i < 3; i++){ //12 buttons on machine
        for (let j = 0; j < 4; j++){
          this.shapes.box.draw(graphics_state, vm_transform.times(Mat4.translation(Vec.of(2.725 + i*.375,3.25 - j*.375,3.2))).times(Mat4.scale(Vec.of(.125,.125,.125))), this.materials.white); //add texture mapping for buttons?
        }
      }
      //I don't know how to implement the food door thingy
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,2.5,-4))).times(Mat4.scale(Vec.of(15,10,1))), this.materials.white); //use automations? back wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,-7.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //floor
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,12.5,6))).times(Mat4.scale(Vec.of(15,1,10))).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))), this.materials.white); //ceiling
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //right wall
      this.shapes.square.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(-15,2.5,6))).times(Mat4.scale(Vec.of(1,10,10))).times(Mat4.rotation(Math.PI/2, Vec.of(0,1,0))), this.materials.white); //left wall
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,10,6))).times(Mat4.scale(Vec.of(.5,.5,.5))), this.materials.white.override({ambient:1})); //light "bulb"
      this.shapes.box.draw(graphics_state, model_transform.times(Mat4.translation(Vec.of(0,11.5,6))).times(Mat4.scale(Vec.of(.1,1,.1))), this.materials.black); //"string" that light hangs from
    }
  }
