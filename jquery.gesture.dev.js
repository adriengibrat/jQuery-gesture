// $.gestures dev utilities
( function ( $ ) {
	$.extend( $.gesture.prototype, {
			export  : function ( name ) {
				return JSON.stringify( name ?
					this.gestures[ name ].strokes :
					this.strokes
				);
			}
			, board : function ( width, height ) {
				var self     = this
					, point  = function ( x, y ) {
						ctx.fillStyle = ctx.strokeStyle = 'rgb(' + Math.floor( 201 * Math.random() ) + ',' + Math.floor( 201 * Math.random() ) + ',' + Math.floor( 201 * Math.random() ) + ')';
						ctx.fillRect( x - 2, y - 2, 4, 4 );
						ctx.lineWidth = 2;
					}
					, line   = function ( from, to ) {
						ctx.beginPath();
						ctx.moveTo( from[ 0 ], from[ 1 ] );
						ctx.lineTo( to[ 0 ], to[ 1 ] );
						ctx.closePath();
						ctx.stroke();
					}
					, canvas = $( '<canvas>', {
						tabindex : 1 // allow focus to catch key events ;)
						, width  : width  = width || 400
						, height : height = height || 300
						, css    : { background : '#eee', border: '1px solid #ccc' }
					 } )
					, ctx    = canvas.get( 0 ).getContext( '2d' );
				console.log( 'Draw gestures on the board.\nPress ESC to clear the board, ENTER to save new gesture & SPACE to recognize drawn gesture.\nUse TAB to get focus on the board without drawing on it.' );
				return self
					.listen( canvas )
					.on( 'mousedown.gesture', function ( event ) {
						if ( event.which > 1 )
							return;
						event.type = 'record.gesture';
						point.apply( null, canvas.triggerHandler( event, [ true ] ) );
						canvas
							.on( 'mousemove.gesture.drawing', function ( event ) {
								event.type = 'record.gesture';
								self.points.length &&
									line( self.points[ self.points.length - 1 ], canvas.triggerHandler( event ) );
							} )
							.on( 'mouseup.gesture.drawing', function () {
								canvas
									.unbind( '.drawing' )
									.triggerHandler( 'save.gesture' );
							} );
					} )
					.on( 'reset.gesture', function () {
						ctx.canvas.width  = width;
						ctx.canvas.height = height;
					} )
					.trigger( 'reset.gesture' ); // fix sizing bug + clean up
			}
	} );
} )( jQuery )