
// jQuery.geolocation (v0.1)

;(function ( $, window, document, undefined ) {

		// Create the defaults once
		var pluginName = "geoloc",
				defaults = {
				debug: false, // true/false
				storage: 'local', // local/cookie
				silent: false, // true/false,
				notifications: false, // true/false
				result: 'status', // coords/country/city/state/address/formatted
				errors: []
		};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.element = element;
				
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}

		// Avoid Plugin.prototype conflicts
		$.extend(Plugin.prototype, {

				// Initialization function
				init: function () {
						// like so: this.yourOtherFunction(this.element, this.settings).
						if(this.settings.debug)
							console.log("jQuery.geolocation Initialized");

						this.getLocation(this.element, this.settings);
				},

				// Accesses the navigator object
				getLocation: function () {
					var lat, lng, t;

					if(this.settings.storage === 'local') {
						if(this.settings.debug)
							console.log('Checking users local storage');
						
						// Check if any value is stored earlier
						if(localStorage.geolocAllow) {
							
							if(this.settings.debug)
								console.log('Found history.');

							if(localStorage.geolocAllow == 'true'){
								// User allowed access before
								if(this.settings.debug){
								console.log('User allowed access before');
								console.log('Country: ' + localStorage.geolocCountry);
								//console.log('Language: ' + localStorage.lang);
								}
								
								// Redirect user based on previous choice
								this.redirectCountry(localStorage.geolocCountry);
							}
							else {
								// User denied access before
								console.log('User denied access before');
								console.log('Exiting plugin');
							}

							// Exit the plugin, as history access was successful
							return;
						}
						else {
							console.log('No history found.');

							// Request a new location access
							if(this.settings.debug)
					        	console.log('Asking user for Geo-Access permission');
					        
					    	var p = this;

					    	// Check if geolocation object is available
					    	if(navigator.geolocation == undefined){
					    		if(this.settings.debug)
					    			console.error('GeoLocation unavailable');
					    		return;
					    	}

					    	// Get the user coordinates
					        var location = navigator.geolocation.getCurrentPosition(
					          
					          // Success callback
					          function(pos){
					          	if(p.settings.debug)
					            console.log(t='User allowed access. Getting location');
					        	
					        	localStorage.geolocAllow = true;

					            lat = pos.coords.latitude;
					            lng = pos.coords.longitude;
					            
					            if(p.settings.debug)
					            console.log("Latitude: " + lat + ", Longitude: " + lng);

					        	if(p.settings.result === 'coords')
					        		return lat + ', ' + lng;
					        	else
					        		p.reverseGeo(lat, lng);
					          },

					          // Error callback
					          function(error){

					          	// Log the error and respond
					          	switch(error.code) {
							        case error.PERMISSION_DENIED:
							            t = "User denied the request for Geolocation.";
							            localStorage.geolocAllow = false;
							            break;
							        case error.POSITION_UNAVAILABLE:
							            t = "Location information is unavailable.";
							            break;
							        case error.TIMEOUT:
							            t = "The request to get user location timed out.";
							            break;
							        case error.UNKNOWN_ERROR:
							            t = "An unknown error occurred.";
							            break;
							        default: t = "Unregistered error occurred";
							    }

					          	if(p.settings.debug)
					            console.log("Error: " + t);
					          }

					        );
						}
					}
					else if(this.settings.storage === 'cookie') {
						if(this.settings.debug)
							console.log('Checking users cookie');
					}
					else {
						if(this.settings.debug){
							console.error('Invalid -storage- option given. Use -local- or -cookie-');
							return;
						}
					}
					
				},

				// Reverse GeoLocation to get user region
				reverseGeo : function(lat,lng){
		            var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + ', ' + lng + "&sensor=false";
		            var p = this;

		            if(this.settings.debug)
		            	console.log('Reverse API call to fetch country from location coordinates');

		            $.getJSON(url, function (data) {
		                var loc = p.reformat(data);

		                if(p.settings.debug)
		                	console.log('Reverse API - Success');

		                switch(p.settings.result){
		                	case 'country':
		                		t = 'Country: ' + loc.country;break;
		                	case 'country_long':
		                		t = 'Country: ' + loc.country_long; break;
		                	case 'city':
		                		t = 'City: ' + loc.locality; break;
		                	case 'area':
		                		t = 'Area: ' + loc.sublocality; break;
		                	case 'zip':
		                		t = 'Zip: ' + loc.postal_code; break;
		                	case 'dump':
		                		var dump = {
		                			coords: lat + ', ' + lng,
		                			country: loc.country,
		                			country_long: loc.country_long,
		                			city: loc.locality,
		                			area: loc.sublocality,
		                			zip: loc.postal_code
		                		};
		                		
		                		t = 'Dump: ' + JSON.stringify(dump);
		                		break;
		                	default: t = 'Unsupported result option passed';
		                }

		                // store the country value in local storage
		                localStorage.geolocCountry = loc.country;

		                if(p.settings.debug)
		                console.log(t);

		            	// Redirect user based on previous choice
						p.redirectCountry(localStorage.geolocCountry);
		            });
				},

				// Re-formats the google api result set into a single level object
				reformat: function(result){
			        var me = {}; 
			        var components = result.results[0].address_components; 
			        var len = components.length; 
			        for(var i=0; i<len; i++){ 
			          for(var ii=0; ii<components[i].types.length; ii++){ 
			            me[components[i].types[ii]] = components[i].short_name; 
			            me[components[i].types[ii]+"_long"] = components[i].long_name; 
			          } 
			        } 
			        for(var prop in result){ 
			          if(prop != "address_components") me[prop] = result[prop]; 
			        } 
			        return me; 
			    },

			    // Redirects to country specific page
			    redirectCountry: function(country){
			    	
			    	var redirect = '';
			    	var lang = '';

			    	switch(country){
			    		case 'IN':
			    			redirect = '#en';
			    			lang = 'English';
			    			break;
			    		case 'US':
			    			redirect = '#en';
			    			lang = 'English';
			    			break;

			    		case 'CN':
			    			redirect = '#cn';
			    			lang = 'Chinese';
			    			break;
			    		default:
			    			redirect = '#en';
			    			lang = 'English';
			    			break;
			    	}

			    	// Check if user previously allowed a redirect
			    	if(localStorage.geolocRedirect == 'true'){
			    		if(this.settings.debug){
			    			console.log('User allowed redirect before');
			    			console.log('Redirecting to -'+lang+'- version of website');
			    		}
			    		window.location.href = redirect;
			    	}
			    	else if(localStorage.geolocRedirect == 'false'){
			    		if(this.settings.debug)
			    			console.log('User denied redirect before');
			    		return;
			    	}
			    	else {
						var choice = window.confirm('Do you want to see ' + lang + ' version of the website ?');

				    	if(choice){
				    		localStorage.geolocRedirect = true;
				    		window.location.href = redirect;
				    	}
				    	else {
				    		localStorage.geolocRedirect = false;
				    	}			    		
			    	}
			    }
		});

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}
				});

				// chain jQuery functions
				return this;
		};

})( jQuery, window, document );



// Auto initialize the plugin
$(function(){
	$(document).geoloc({ 
		debug: false,
		result: 'country',
		storage: 'local',
		redirects: {
			'default': '#en',
			'IN': '#en',
			'CN': '#cn'
		}
	});
});
