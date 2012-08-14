/*
 * Port of the genius $N Multistroke Recognizer & Protractor.
 * Factorized and simplified (use Protractor only, force bounded rotation, get rid of classes, etc. ).
 *
 * Credits:
 *
 * $N Multistroke Recognizer & Protractor
 * @see http://depts.washington.edu/aimgroup/proj/dollar/ndollar.html
 *
 * Anthony, L. and Wobbrock, J.O. (2012).
 * $N-Protractor: A fast and accurate multistroke recognizer.
 * Proceedings of Graphics Interface (GI '12).
 * Toronto, Ontario (May 28-30, 2012).
 * Toronto, Ontario: Canadian Information Processing Society, pp. 117-120.
 * http://dl.acm.org/citation.cfm?id=2305296
 *
 * Anthony, L. and Wobbrock, J.O. (2010).
 * A lightweight multistroke recognizer for user interface prototypes.
 * Proceedings of Graphics Interface (GI '10).
 * Ottawa, Ontario (May 31-June 2, 2010).
 * Toronto, Ontario: Canadian Information Processing Society, pp. 245-252.
 * http://portal.acm.org/citation.cfm?id=1839214.1839258
 *
 * Protractor
 * @see http://www.yangl.org/pdf/protractor-chi2010.pdf
 *
 * Li, Y. (2010).
 * Protractor: A fast and accurate gesture recognizer.
 * Proceedings of the ACM Conference on Human Factors in Computing Systems (CHI '10).
 * Atlanta, Georgia (April 10-15, 2010).
 * New York: ACM Press, pp. 2169-2172.
 * http://dl.acm.org/citation.cfm?id=1753326.1753654
 *
 * jQuery Gesture, Easy to use gesture recognition
 * @see http://www.yangl.org/pdf/protractor-chi2010.pdf
 *
 * Adrien Gibrat. (2012).
 *
 */
( function ( $ ) {
	/* Get a new gesture recognizer instance
	 * @param templates	object	(optional) Hash of named strokes
	 * @return			Gesture	gesture recognizer instance
	 */
	$.gesture = $.extend( function Gesture ( templates ) {
		if ( ! ( this instanceof Gesture ) ) // both constructor & factory
			return new Gesture( templates );
		this.gestures = {};
		for ( var name in templates )
			this.learn( name, templates[ name ] );
	}, {
		prototype        : {
			/* Try to recognize gesture from recorded or given stroke(s)	-> do reset points
			 * @param strict	boolean	 		(optional) use same number of stroke(s) recognition
			 * @param names		string/array	(optional) search only amongst given gestures name(s)
			 * @param strokes	array			(optional) search only amongst given gestures name(s)
			 * @return			boolean/object 	result or false
			 */
			recognize : function ( strict, names, strokes ) {
				var points  = Points( CombineStrokes( strokes = strokes || this.save() ) );
				//if ( points.length < startIndex ) return false;
				names && ! ( names instanceof Array ) && ( names = [ names ] );
				var start       = StartVector( points )
					, vector    = Vectorize( points )
					, best      = Infinity
					, result    = false
					, threshold = this.threshold;
				$.each( this.gestures, function ( name, gesture ) {
					if ( ( names && ! ~ names.indexOf( name ) ) || ( strict && strokes.length != gesture.strokes.length ) )
						return;
					$.each( gesture.templates, function () {
						if ( VectorsAngle( start, this.start ) <= threshold ) { // strokes start in the same direction
							var distance = OptimalDistance( this.vector, vector );
							if  ( distance < best ) {
								best   = distance;
								result = name;
							}
						}
					} );
				} );
				return result && {
						name      : result
						, score   : 1 / best
						, strokes : this.gestures[ result ].strokes.length
					};
			}
			/* Learns new gesture from recorded or given stroke(s)			-> do reset strokes
			 * @param name		string/array	(optional) search only amongst given gestures name(s)
			 * @param strokes	array			(optional) search only amongst given gestures name(s)
			 * @return			array		 	strokes learned
			 */
			, learn   : function ( name, strokes ) {
				var gesture = {
						templates : []
						, strokes : strokes = strokes || this.save().splice( 0 )
					}
					, order     = []
					, orders    = [];
				for ( var i in strokes )
					order[ i ] = i;
				Permute( strokes.length, order, /*out*/ orders );
				$.each( UniStrokes( strokes, orders ), function ( index, stroke ) {
					var points = Points( stroke );
					gesture.templates[ index ] = {
						vector  : Vectorize( points )
						, start : StartVector( points )
					};
				} );
				this.gestures[ name ] = gesture;
				return strokes;
			}
			/* Records point from given event								-> do reset points if start is true
			 * @param event	Event	search only amongst given gestures name(s)
			 * @param start	boolean	(optional) reset points before recording
			 * @return		array	points previously recorded
			 */
			, record  : function ( point, start ) {
				if ( start ) this.points.length  = 0;
				this.points.push( point );
				return point;
			}
			/* Saves recorded point as a new stroke 						-> do reset points
			 * @return	array	strokes previously saved
			 */
			, save    : function () {
				this.points.length && this.strokes.push( this.points.splice( 0 ) );
				return this.strokes;
			}
			/* Reset recorded strokes and points
			 * @return	void
			 */
			, reset   : function () {
				this.points.length  = 0;
				this.strokes.length = 0;
			}
			, listen : function ( element ) {
				var self = this;
				return ( element instanceof $ ? element : $( element ) )
					.on ( 'recognize.gesture.listen', function ( event, strict, names ) {
						return event.result = self.recognize( strict || true, names );
					} )
					.on ( 'learn.gesture.listen', function ( event, name, strokes ) {
						if ( name = name || prompt( 'Name of this gesture ?' ) )
							return event.result = {
								strokes : self.learn( name, strokes )
								, name  : name
							};
					} )
					.on ( 'record.gesture.listen', function ( event, start, point ) {
						if ( ! point ) {
							var offset;
							point = event.offsetX && event.offsetY ?
								[ event.offsetX, event.offsetY ] :
								( offset = element.offset() ) && [ event.pageX - offset.top, event.pageY - offset.left ];
						}
						return event.result = self.record( point, start );
					} )
					.on ( 'save.gesture.listen', function () {
						return event.result = self.save();
					} )
					.on ( 'reset.gesture.listen', function () {
						return event.result = self.reset();
					} );
			}
			, threshold : 30 * Math.PI / 180 // max difference between vectors start angles
			, points  : []
			, strokes : []
		}
	} );
	// Constants
	var numPoints       = 96  // number of extrapolated points to generate vectors / compare strokes
		, squareSize    = 250 // size of zone to normalize extrapolated points
		, oneDThreshold = .25 // customize to desired gesture set (usually 0.20 - 0.35)
		, startIndex    = 12;  // number of points to check to get the vector start angle
	// Private helper functions
	function Permute ( n, order, /*out*/ orders ) {
		if ( n == 1 )
			return orders[ orders.length ] = order.slice();
		for ( var i = 0; i < n; i++ ) {
			Permute( n - 1, order, orders );
			if ( n % 2 == 1 ) {
				var tmp = order[ 0 ];
				order[ 0 ]     = order[ n - 1 ];
				order[ n - 1 ] = tmp;
			} else {
				var tmp = order[ i ];
				order[ i ]     = order[ n - 1 ];
				order[ n - 1 ] = tmp;
			}
		}
	}
	function UniStrokes ( strokes, orders ) {
		var unistrokes  = []
			, unistroke
			, points;
		for ( var r = 0; r < orders.length; r++ ) {
			for ( var b = 0; b < Math.pow( 2, orders[ r ].length ); b++ ) {
				unistroke = [];
				for ( var i = 0; i < orders[r].length; i++ ) {
					points = ( ( b >> i ) & 1 ) == 1 ?
							strokes[ orders[ r ][ i ] ].slice().reverse() :
							strokes[ orders[ r ][ i ] ].slice();
					for ( var p = 0; p < points.length; p++ )
						unistroke[ unistroke.length ] = points[ p ];
				}
				unistrokes[ unistrokes.length ] = unistroke;
			}
		}
		return unistrokes;
	}
	function CombineStrokes ( strokes ) {
		var points = [];
		for ( var s = 0; s < strokes.length; s++ )
			for ( var p = 0; p < strokes[s].length; p++ )
				points[ points.length ] = [ strokes[ s ][ p ][ 0 ], strokes[ s ][ p ][ 1 ] ];
		return points;
	}
	function Rotate ( points, back ) {
		var c       = Centroid( points )
			, angle = Math.atan2( c[ 1 ] - points[ 0 ][ 1 ], c[ 0 ] - points[0][ 0 ] ) * ( back ? 1 : -1 )
			, cos   = Math.cos( angle )
			, sin   = Math.sin( angle );
		for ( var i in points ) {
			points[ i ] = [
				( points[ i ][ 0 ] - c[ 0 ] ) * cos - ( points[ i ][ 1 ] - c[ 1 ] ) * sin + c[ 0 ]
				, ( points[ i ][ 0 ]- c[ 0 ] ) * sin + ( points[ i ][ 1 ] - c[ 1 ] ) * cos + c[ 1 ]
			];
		}
		return points;
	}
	function Points ( points ) {
		var _points = [ points[ 0 ] ];
		for ( var i = 1, I = PathLength( points ) / ( numPoints - 1 ), D = 0; i < points.length; i++ ) {
			var d   = Distance( points[ i - 1 ], points[ i ] );
			if ( ( D + d ) >= I ) {
				d = ( I - D ) / d;
				_points.push( [
					points[ i - 1 ][ 0 ] + d * ( points[ i ][ 0 ] - points[ i - 1 ][ 0 ] )
					, points[ i - 1 ][ 1 ] + d * ( points[ i ][ 1 ] - points[ i - 1 ][ 1 ] )
				] );
				points.splice( i, 0, _points[ _points.length - 1 ] );
				D = 0;
			}
			else D += d;
		}
		// somtimes there is rounding-error short of adding the last point, so add it if so
		if ( _points.length == numPoints - 1 )
			_points.push( points[ points.length - 1 ] );
		points = Rotate( _points );
		var zone   = Bounds( points )
			, oneD = Math.min( zone.width / zone.height, zone.height / zone.width ) <= oneDThreshold && Math.max( zone.width, zone.height )
			, C    = Centroid( points );
		zone.width  = squareSize / ( oneD || zone.width );
		zone.height = squareSize / ( oneD || zone.height );
		for ( var i in points )
			points[ i ] = [
				points[ i ][ 0 ] * zone.width
				, points[ i ][ 1 ] * zone.height
			];
		points = Rotate( points, true );
		for ( var i in points)
			points[ i ] = [
				points[ i ][ 0 ] - C[ 0 ]
				, points[ i ][ 1 ] - C[ 1 ]
			];
		return points;
	}
	function Vectorize ( points ) {
		var vector  = []
			, sum   = 0
			, angle = Math.atan2( points[ 0 ][ 1 ], points[ 0 ][ 0 ] )
			, base  = Math.PI / 4 * Math.floor( ( angle + Math.PI / 8 ) / Math.PI * 4 )
			, cos   = Math.cos( base - angle )
			, sin   = Math.sin( base - angle )
			, newX
			, newY;
		for ( var i = 0; i < points.length; i++ ) {
			vector[ vector.length ] = newX = points[i][ 0 ] * cos - points[i][ 1 ] * sin;
			vector[ vector.length ] = newY = points[i][ 1 ] * cos + points[i][ 0 ] * sin;
			sum += newX * newX + newY * newY;
		}
		var magnitude = Math.sqrt( sum );
		for ( var i = 0; i < vector.length; i++ )
			vector[ i ] /= magnitude;
		return vector;
	}
	function OptimalDistance ( v1, v2 ) {
		var angle
			, a = 0
			, b = 0;
		for ( var i = 0; i < v1.length; i += 2 ) {
			a += v1[ i ] * v2[ i ] + v1[ i + 1 ] * v2[ i + 1 ];
			b += v1[ i ] * v2[ i + 1 ] - v1[ i + 1 ] * v2[ i ];
		}
		angle = Math.atan( b / a );
		return Math.acos( a * Math.cos( angle ) + b * Math.sin( angle ) );
	}
	function Centroid ( points ) {
		var x   = 0
			, y = 0;
		for ( var i = 0; i < points.length; i++ ) {
			x += points[ i ][ 0 ];
			y += points[ i ][ 1 ];
		}
		return [ x / points.length, y / points.length ];
	}
	function Bounds ( points ) {
		var minX   = Infinity
			, maxX = -Infinity
			, minY = Infinity
			, maxY = -Infinity;
		for ( var i = 0; i < points.length; i++ ) {
			minX = Math.min( points[ i ][ 0 ], minX );
			maxX = Math.max( points[ i ][ 0 ], maxX );
			minY = Math.min( points[ i ][ 1 ], minY );
			maxY = Math.max( points[ i ][ 1 ], maxY );
		}
		return { width: maxX - minX, height: maxY - minY };
	}
	function PathLength ( points ) {
		var d = 0;
		for ( var i = 1; i < points.length; i++ )
			d += Distance( points[ i - 1 ], points[ i ] );
		return d;
	}
	function Distance ( p1, p2 ) {
		return Math.sqrt(
			Math.pow( p2[ 0 ] - p1[ 0 ], 2 ) + Math.pow( p2[ 1 ] - p1[ 1 ], 2 )
		);
	}
	function StartVector ( points ) {
		var v     = [ points[ startIndex ][ 0 ] - points[ 0 ][ 0 ], points[ startIndex ][ 1 ]- points[ 0 ][ 1 ] ]
			, len = Math.sqrt( v[ 0 ] * v[ 0 ] + v[ 1 ] * v[ 1 ] );
		return [ v[ 0 ] / len, v[ 1 ] / len ];
	}
	function VectorsAngle ( v1, v2 ) {
		var n = v1[ 0 ] * v2[ 0 ] + v1[ 1 ] * v2[ 1 ];
		if ( n < - 1 || n > 1 )
			n = Math.round( n * 100000 ) / 100000;
		return Math.acos( n );
	}
} )( jQuery )