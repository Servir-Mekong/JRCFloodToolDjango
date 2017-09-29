angular.module('baseApp').constant('appSettings', {
	menus: [
		{
			'name': 'Home',
			'url': '/home/',
			'show': true
		},
		{
			'name': 'About',
			'url': '/about/',
			'show': false
		},
		{
			'name': 'Map',
			'url': '/map/',
			'show': true
		},
		{
			'name': 'How To Use',
			'url': '#',
			'show': true
		},
		{
			'name': 'Document',
			'url': '#',
			'show': true
		},
		{
			'name': 'Feedback',
			'url': 'https://goo.gl/forms/gJGWBlCEolbbpbJF2',
			'show': true
		}
	],
	applicationName: 'Historical Flood Analysis Tool',
	footerLinks: [
		{
			'name': 'About',
			'url': 'https://servir.adpc.net/about/about-servir-mekong',
			'show': true
		},
		{
			'name': 'Tools',
			'url': 'https://servir.adpc.net/tools',
			'show': true
		},
		{
			'name': 'Geospatial Datasets',
			'url': 'https://servir.adpc.net/geospatial-datasets',
			'show': true
		},
		{
			'name': 'Resources and Publications',
			'url': 'https://servir.adpc.net/publications',
			'show': true
		},
		{
			'name': 'News',
			'url': 'https://servir.adpc.net/news',
			'show': true
		},
		{
			'name': 'Events',
			'url': 'https://servir.adpc.net/events',
			'show': true
		},
		{
			'name': 'Contact Us',
			'url': 'https://servir.adpc.net/about/contact-servir-mekong',
			'show': true
		},
		{
			'name': 'Privacy and Usage Policy',
			'url': 'https://servir.adpc.net/policy',
			'show': true
		}
	],
	partnersHeader: [
		{
			'alt': 'The United States Agency for International Development',
			'url': 'https://www.usaid.gov/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/USAID_Logo_Color.png',
			'className': 'usaid'
		},
		{
			'alt': 'The National Aeronautics and Space Administration',
			'url': 'https://www.nasa.gov/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/NASA_Logo_Color.png',
			'className': 'nasa'
		},
		{
			'alt': 'Asian Disaster Preparedness Center',
			'url': 'http://www.adpc.net/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-adbc.png',
			'className': 'adpc'
		},
		{
			'alt': 'SERVIR',
			'url': 'https://www.servirglobal.net/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/Servir_Logo_Color.png',
			'className': 'servir'
		}
	],
	partnersFooter : [
		{
			'alt': 'Spatial Infomatics Group',
			'url': 'https://sig-gis.com/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-sig.png',
			'className': 'partner-sig'
		},
		{
			'alt': 'Stockholm Environment Institute',
			'url': 'https://www.sei-international.org/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-sei.png',
			'className': 'partner-sei'
		},
		{
			'alt': 'Deltares',
			'url': 'https://www.deltares.nl/en/',
			'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-deltares.png',
			'className': 'partner-deltares'
		}
	],
	timePeriodOptions: [
		{
			'value': 'continuous',
			'name' : 'Continuous'
		},
		{
			'value': 'discrete',
			'name' : 'Discrete'
		}
	]
});
