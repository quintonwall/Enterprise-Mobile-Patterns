var SFDC;

(function() {
	var T = {},
		apiClient = new forcetk.Client();

	// Define Templates
	T.list = Ember.Handlebars.compile('<ul data-role="listview">{{#each controller}}<li {{bindAttr id="Id"}}>{{Name}}</li>{{/each}}</ul>');
	T.detail = Ember.Handlebars.compile('<div>Id: {{Id}}</div><div>Name: {{Name}}</div>');

	SFDC = Ember.Application.create({
		LOG_TRANSITIONS: true,
		launch: function(options) {
			options = options || {};
			apiClient.setSessionToken(options.accessToken, options.apiVersion, options.instanceUrl);
			SFDC.advanceReadiness();
		},
		getController: function(id) {
			return SFDC.components.findProperty('id', id).component;
		}
	});
	SFDC.deferReadiness();

	SFDC.SObject = Ember.Object.extend({
		id: null,
		type: null
	});

	SFDC.ApplicationRoute = Ember.Route.extend({
		setupController: function(controller, model) {
			var self = this, idCount = 0;
			SFDC.components = new Ember.Set();

			$("[sf-role]").each(function() {
				var container = $(this), 
					controller, settings,
					options = {};

				$(this.attributes).each(function() {
					if (this.nodeName.substr(0,3) == 'sf-') 
						options[this.nodeName.substr(3)] = this.nodeValue;
				});
				settings = { container: $(this), options: options };

				if (container.attr('sf-role') == 'list') controller = SFDC.ListController.create(settings);
				else if (container.attr('sf-role') == 'detail') controller = SFDC.DetailController.create(settings);

				SFDC.components.add({
					id: this.id || ('sf-comp-' + idCount++),
					component: controller
				});
			});
		},
		render: function() {
			SFDC.components.forEach(function(item) {
				item.component.renderView();
			});
		}
	});

	SFDC.ListController = Ember.ArrayController.extend({
		init: function() {
			this._super();
			this.set('content', []);
			this.fetch();
		},
		fetch: function() {
			var self = this,
				sobjects = [],
				populateList = function(records) {
					$.each(records, function() {
						sobjects.push(this);
					});
					self.pushObjects(sobjects);
				};

			// fetch list from forcetk and populate SOBject model
			if (self.options.query) 
				apiClient.query(self.options.query, function(resp) {
					populateList(resp.records);
				});
			else 	
				//$.getJSON('data/contact_meta.json', function(resp) {
	            apiClient.metadata(this.options.sobject, function(resp) {
					populateList(resp.recentItems);
				});
		},
		renderView: function() {
			var self = this, 
				viewOptions = {
					controller: self,
					templateName: self.options.template,
					// Observe when the element is inserted in the dom. Apply the jqm listview properties after that.
					didInsertElement: function() {
						this.$('ul').listview();
					}
				};

			if (!viewOptions.templateName) viewOptions.template = T.list;
			self.view = Ember.View.create(viewOptions).appendTo(self.container);
		},
		// Observe the attached content array's length and refresh the listview on the next RunLoop tick.
	    contentLengthDidChange: function() {
	        var self = this;

	        Ember.run.next(function() {
	        	self.view.$('ul').listview('refresh');
	        });
	    }.observes('content.length')
	});

	SFDC.DetailController = Ember.ObjectController.extend({
		init: function() {
			this._super();
			this.fetch();
		},
		fetch: function() {
			var self = this;

			// fetch list from forcetk and populate SOBject model
			if (self.options.record) {
				//$.getJSON('data/contact.json', function(resp) {
				apiClient.retrieve(self.options.sobject, self.options.record, function(resp) {
					console.log(JSON.stringify(resp));
					self.set('content', resp);
				});
			}
		},
		renderView: function() {
			var self = this, 
				viewOptions = {
					controller: self,
					templateName: self.options.template
				};

			if (!viewOptions.templateName) viewOptions.template = T.detail;
			self.view = Ember.View.create(viewOptions).appendTo(self.container);
		},
		setOption: function(key, value) {
			this.options[key] = value;
			console.log(JSON.stringify(this.options));
			this.fetch();
		}
	});
})();