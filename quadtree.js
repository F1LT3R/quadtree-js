/*
  Basic JavaScript Quad Tree
  MIT Liscence - Copyright Concord Consortium (c) 2009

  Developed By: Alistair MacDonald
  Licensed to: Concord Consortium - Concord.org
    
  Notes:  There is a high percentage of, shall we say... unneccesary calculation
          within this script; but... it makes things easier to read, so I am 
          going to leave this as-is so people can pick apart the peices. One 
          thing worth warning about is the lack of overlap check. If you wanted
          to store rectangles in this quad tree, it would need updating so it
          could check if a big object overlapped several small quad leaves. ;)
*/

var canvas  = undefined,
    ctx     = undefined,
    quad    = undefined,
    mouseX, mouseY;

  function init(){
    canvas = document.getElementById( 'canvasID' );
    ctx        = canvas.getContext( '2d' );    
    
    var items = {
      1: { x: 50  , y: 50   },
      2: { x: 150 , y: 50   },
      3: { x: 50  , y: 150  },
      4: { x: 125 , y: 125  },
      5: { x: 175 , y: 125  },
      6: { x: 125 , y: 175  },
      7: { x: 175 , y: 175  },
      8: { x: 155 , y: 155  } 
    }
    
    quad = new Quad({/*null props*/});
    for( var i in items ){
      quad.add( items[ i ] );
    }
    
    canvas.addEventListener( 'mousemove', function( e ){
      var scrollX = window.scrollX != null ? window.scrollX : window.pageXOffset;
      var scrollY = window.scrollY != null ? window.scrollY : window.pageYOffset;
      mouseX = e.clientX - canvas.offsetLeft + scrollX;
      mouseY = e.clientY - canvas.offsetTop + scrollY;
    }, false );

    canvas.addEventListener( 'click', function( e ){
      quad.add({ x: mouseX, y: mouseY });
    }, false );
  
  }
      

  // Quad object constructor
  function Quad( props ){
    this.objects   = [];
    this.subquads  = []; // This quad has never been sub-divided
    this.divided   = false;
    this.level  = props.level     || 1;
    this.bounds = props.bounds    || [ 0, 0, canvas.width, 0, canvas.width, canvas.height, 0, canvas.height ];    
    for( var i in props ){ this[ i ] = props[ i ]; }
    this.width  = this.bounds[ 2 ] - this.bounds[ 0 ];
    this.height = this.bounds[ 5 ] - this.bounds[ 1 ];
    this.draw();
  }

  // Adds an object to this Quad
  Quad.prototype.add = function add( obj ){
    var len = this.objects.length;

    // If this quad is not sub-divided...
    if( !this.divided ){
      
      // If less than four objects exist here...
      if( len < 4 ){
        this.objects[ len ] = obj;
        ctx.fillStyle = '#0f0';
        ctx.fillRect( obj.x-1, obj.y-1, 2, 2 );
      }else{
        this.divide( obj );
      }
    
    // If the quad you are adding to is already sub-divided...
    }else{
      quadrant = this.filter( obj );
      
      // Build a new quad if it does not already exist
      if( !this.subquads[ quadrant.index ] ){
        this.subquads[ quadrant.index ] = new Quad({ level: this.level + 1, bounds: quadrant.bounds });
      }
      
      this.subquads[ this.filter( obj ).index ].add( obj );
    }
    
  }

  // Returns the quadrant index and bounds for an XY value
  Quad.prototype.filter = function filter( obj ){
       
    // Supply quadrant offset
    var ox = this.bounds[ 0 ];
    var oy = this.bounds[ 1 ];
    
    // Get the divided width/height dimensions of this Quad
    var w2 = this.width / 2;
    var h2 = this.height / 2;
        
    // Make a bounds object to store sub-quads
    var bounds = new Array( 0, 0, 0, 0 );        
    
    // Step through quad-space and build temporary sub-quad regions
    for( var i = 0; i < 4; i++ ){
      var x = i % 2;
      var y = ( ( i - x ) / 2 ) % 2;
      var hxt = x * w2;
      var vxt = y * h2;
      bounds[ i ] = [ ox + hxt      , oy + vxt      ,
                      ox + hxt + w2 , oy + vxt      ,
                      ox + hxt + w2 , oy + vxt + h2 ,
                      ox + hxt      , oy + vxt + h2   ];
      
      // Return quadrant index and bounds if found
      if( pip( obj.x, obj.y, bounds[ i ] ) ){
        return { index: i, bounds: bounds[ i ] };
      }
    }
    
    // Return false if something went wrong
    return false;
  }
  
  // Splits this quad and pushes own objects to new quds
  Quad.prototype.divide = function divide( obj ){
            
    // Add new object to stack
    this.objects.push( obj );
        
    for( var i = 0; i < 5; i++ ){

      var quadrant = this.filter( this.objects[ i ] );     

      // Build a new quad if it does not already exist
      if( !this.subquads[ quadrant.index ] ){
        this.subquads[ quadrant.index ] = new Quad({ level: this.level + 1, bounds: quadrant.bounds });
      }
         
      this.subquads[ quadrant.index ].add( this.objects[ i ] );
     };
    
    // Remove the objects from the parent quad
    this.objects.remove( 0, 4 );
    
    this.divided = true;
    
  }

  // Draw Quad bounds
  Quad.prototype.draw = function draw( obj ){
    ctx.save();
      ctx.beginPath(); 
        ctx.moveTo( this.bounds[ 0 ] +.5, this.bounds[ 1 ] +.5 );
        ctx.lineTo( this.bounds[ 2 ] -.5, this.bounds[ 3 ] +.5 );
        ctx.lineTo( this.bounds[ 4 ] -.5, this.bounds[ 5 ] -.5 );
        ctx.lineTo( this.bounds[ 6 ] +.5, this.bounds[ 7 ] -.5 );
        ctx.closePath();
      ctx.strokeStyle = '#f0f';
      ctx.lineWidth = 1;
      ctx.stroke();
    ctx.restore();
  }
  
  // Check if a point lies within a polygon
  function pip( x, y, polygon ){
    var pip = false,
        j   = polygon.length - 1;
 
    for( var i = 0; i < polygon.length; i += 2 ){
      var v1 = [ polygon[ i ], polygon[ i + 1 ] ];
      var v2 = [ polygon[ j ], polygon[ j + 1 ] ];    
      if( v1[ 0 ] < x && v2[ 0 ] >= x || v2[ 0 ] < x && v1[ 0 ] >= x ){
        if( v1[ 1 ] + ( x - v1[ 0 ] ) / ( v2[ 0 ] - v1[ 0 ] ) * ( v2[ 1 ] - v1[ 1 ] ) < y ){
          pip = !pip;
        }
      }
      j = i;
    }
   
    return pip;
  }

  function cls(){
    console.clear();
  }

  addEventListener( 'DOMContentLoaded', init, false );

  // Array Remove - By John Resig (MIT Licensed)
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };

