
// OAuth Configuration
var loginUrl = 'https://cloudcable.secure.force.com/';
var clientId = 'ADD-YOUR-CONSUMER-KEY-HERE';
var redirectUri = 'https://sfdcmobiledemo.herokuapp.com/#home';
var proxyUrl = 'https://sfdcmobiledemo.herokuapp.com/proxy.php';

var client = new forcetk.Client(clientId, loginUrl, proxyUrl);
var userId = '';
var userName = '';
var apptsFound = false;

function getAuthorizeUrl(loginUrl, clientId, redirectUri) {
    return loginUrl + 'services/oauth2/authorize?display=popup'
        + '&response_type=token&client_id=' + escape(clientId)
        + '&redirect_uri=' + escape(redirectUri);
}

$(document).ready(function () {

    var appRouter = new AppRouter();
    Backbone.history.start();

    //$('#btnLogin').attr('href', getAuthorizeUrl(loginUrl, clientId, redirectUri));
    var oauthResponse = {};

    if (window.location.hash) {
        var message = window.location.hash.substr(1);
        var nvps = message.split('&');
        for (var nvp in nvps) {
            var parts = nvps[nvp].split('=');
            oauthResponse[parts[0]] = unescape(parts[1]);
        }

        if (typeof oauthResponse === 'undefined'
            || typeof oauthResponse['access_token'] === 'undefined') {
            console.log("No OAuth response");
        } else {
            client.setSessionToken(oauthResponse.access_token, 'v27.0', oauthResponse.instance_url);

            var parts = oauthResponse['id'].split('/');
            userId = parts[parts.length - 1];

            //we need the user's name and email (from Facebook) 
            client.retrieve('User', userId, 'Email,Name',
                function (response) {
                    console.log(response);
                    userName = response.contents.Name;
                    Jr.Navigator.navigate('appts', {
                        trigger: true,
                        animation: {
                            // Do a stacking animation and slide to the left.
                            type: Jr.Navigator.animations.SLIDE_STACK,
                            direction: Jr.Navigator.directions.LEFT
                        }
                    });
                    return false;
                },
                function (jqXHR) {
                    console.log(jqXHR);
                });
        }
        return false;
    } else {
        if (document.referrer == "https://cloudcable.secure.force.com/apex/SiteHome") {
            window.location = getAuthorizeUrl(loginUrl, clientId, redirectUri);
        } else {
            Jr.Navigator.navigate('home', {
                trigger: true
            });
        }
        return false;
    }
});

var HomeView = Jr.View.extend({
    render: function () {
        this.$el.load("templates/home.tmpl.html");
        this.afterRender();
        return this;
    },

    afterRender: function () {
    },

    events: {
        'click #btnLogin': 'onbtnLoginClick'
    },

    onbtnLoginClick: function () {
        window.location = "https://login.salesforce.com/services/auth/sso/00Di0000000JUGMEA4/CloudCable?site=https%3A%2F%2Fcloudcable.secure.force.com%2F";
    }
});

var AppointmentsView = Jr.View.extend({
    template: $("#appts-Template").html(),
    render: function () {
        this.$el.html(_.template(this.template, this.model));
        return this;
    },

    events: {
        'click #btnAddAppointment': 'onbtnAddAppointmentClick'
        , 'click .btnUpdateAppt': 'onApptItemClick'
    },

    onbtnAddAppointmentClick: function () {
        Jr.Navigator.navigate('apptDetails', {
            trigger: true,
            animation: {
                // Do a stacking animation and slide to the left.
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
        return false;
    },

    onApptItemClick: function (evt) {
        var apptId = $(evt.target).data('apptid');

        Jr.Navigator.navigate('viewAppt/' + apptId, {
            trigger: true,
            animation: {
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
        return false;
    }
});

var AppointmentDetailsView = Jr.View.extend({
    render: function () {
        this.$el.load("templates/apptdetails.tmpl.html");
        return this;
    },

    events: {
        'click #btnAppointmentDetailsContinue': 'onbtnAppointmentDetailsContinueClick'
        , 'click #btnAppointmentDetailsCancel': 'onbtnAppointmentDetailsCancelClick'
    },

    onbtnAppointmentDetailsContinueClick: function () {

        $("#errMsg").html("");

        var city = $("#txtCity").val();
        var problem = $("#txtProblem").val();
        var reqDate = $("#txtDate").val();
        var reqTime = $("#selectTime").val();
        var state = $("#txtState").val();
        var street = $("#txtStreet").val();
        var zip = $("#txtZip").val();

        //validations start
        var errorFields = [];
        if (problem.trim() == "") {
            errorFields.push("Problem description");
        }
        
        if (street.trim() == "") {
            errorFields.push("Street");
        }
        
        if (city.trim() == "") {
            errorFields.push("City");
        }
        
        if (state.trim() == "") {
            errorFields.push("State");
        }
        
        if (zip.trim() == "") {
            errorFields.push("Zip Code");
        }
        
        if (reqDate.trim() == "") {
            errorFields.push("Appointment Date");
        }
        
        if (errorFields.length > 0) {
            var errMsg = "";
            for (var i = 0; i < errorFields.length; i++) {
                if (errorFields.length > 1) {
                    if (i + 1 == errorFields.length) {
                        errMsg += " and " + errorFields[i];
                    } else {
                        if (i > 0) {
                            errMsg += ", " + errorFields[i];
                        } else {
                            errMsg = errorFields[i];
                        }
                    }
                } else {
                    errMsg = errorFields[i];
                }
            }
            $("#errMsg").html("Please fill " + errMsg + ".");
            return;
        } else {
            //compare date
            var firstValue = reqDate.split('-');
            var secondDate = new Date();

            var firstDate = new Date();
            firstDate.setFullYear(firstValue[0], (firstValue[1] - 1), firstValue[2]);

            if (firstDate < secondDate) {
                errMsg = "Invalid appointment date.";
                $("#errMsg").html(errMsg);
                return;
            }
        }
        //validations end

        var appointment = {
            "City_Address__c": city,
            "Contact_Name__c": userId,
            "Problem_Description__c": problem,
            "Requested_Appointment_Date__c": reqDate,
            "Requested_Appointment_Time_Hour__c": reqTime,
            "State_Address__c": state,
            "Street_Address__c": street,
            "Zip_Address__c": zip
        };

        client.create('Appointment__c', appointment, function (data) {
            console.log(data);
            if (data.contents.success) {
                Jr.Navigator.navigate('apptAck', {
                    trigger: true,
                    animation: {
                        // Do a stacking animation and slide to the left.
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
                return false;
            }
        }, function (error) {
            console.log(error);
        });
    },

    onbtnAppointmentDetailsCancelClick: function () {
        Jr.Navigator.navigate('appts', {
            trigger: true,
            animation: {
                // Do a stacking animation and slide to the left.
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
        return false;
    }
});

var AppointmentAckView = Jr.View.extend({
    render: function () {
        this.$el.load("templates/apptack.tmpl.html");
        return this;
    },

    events: {
        'click #btnAppointmentsListContinue': 'onbtnAppointmentsListContinueClick'
    },

    onbtnAppointmentsListContinueClick: function () {
        Jr.Navigator.navigate('appts', {
            trigger: true,
            animation: {
                // Do a stacking animation and slide to the left.
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
        return false;
    }
});

var ViewApptView = Jr.View.extend({
    template: $("#viewAppt-Template").html(),
    render: function () {
        var tmpl = _.template(this.template);
        this.$el.html(tmpl(this.model));
        return this;
    },

    afterRender: function () {
    },

    events: {
        'click #btnUpdateAppt': 'onbtnUpdateApptClick'
        , 'click #btnCancelUpdate': 'onbtnbtnCancelUpdateClick'
    },

    onbtnUpdateApptClick: function (evt) {
        
        $("#errMsg").html("");

        //this uses PATCH under covers
        var apptId = $(evt.target).data('apptid');
        
        var reqDate = $("#txtDateUpdate").val();
        var reqTime = $("#selectTimeUpdate").val();
        
        //compare date
        var firstValue = reqDate.split('-');
        var secondDate = new Date();

        var firstDate = new Date();
        firstDate.setFullYear(firstValue[0], (firstValue[1] - 1), firstValue[2]);

        if (firstDate < secondDate) {
            var errMsg = "Invalid appointment date.";
            $("#errMsg").html(errMsg);
            return;
        } 

        var update = {
            "Requested_Appointment_Date__c": reqDate,
            "Requested_Appointment_Time_Hour__c": reqTime
        };

        client.update('Appointment__c', apptId, update, function (data) {
            console.log(data);
            Jr.Navigator.navigate('apptAck', {
                trigger: true,
                animation: {
                    // Do a stacking animation and slide to the left.
                    type: Jr.Navigator.animations.SLIDE_STACK,
                    direction: Jr.Navigator.directions.LEFT
                }
            });
            return false;
        }, function(error) {
            console.log(error);
        });
        
    },

    onbtnbtnCancelUpdateClick: function () {
        Jr.Navigator.navigate('appts', {
            trigger: true,
            animation: {
                // Do a stacking animation and slide to the left.
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
        return false;
    }
});

var AppRouter = Jr.Router.extend({
    routes: {
        'home': 'home'
        , 'appts': 'appts'
        , 'apptDetails': 'apptDetails'
        , 'apptAck': 'apptAck'
        , 'viewAppt/:id': 'viewAppt'
    },

    home: function () {
        var homeView = new HomeView();
        this.renderView(homeView);
    },

    appts: function () {
        var that = this;
        var query = "SELECT City_Address__c,Contact_Name__c,CreatedDate,Id,Name,Problem_Description__c,Requested_Appointment_Date__c,Requested_Appointment_Time_Hour__c,State_Address__c,status__c,Street_Address__c,Zip_Address__c FROM Appointment__c WHERE IsDeleted = false AND Contact_Name__c = '" + userId + "'";

        client.query(query,
            function (response) {
                console.log(response);
                var modelData = {
                    userName: userName,
                    appts:response.contents.records
                };
                var apptsView = new AppointmentsView({ model: modelData });
                that.renderView(apptsView);
            },
            function (jqXHR) {
                console.log(jqXHR);
            });
    },

    apptDetails: function () {
        var apptDetailsView = new AppointmentDetailsView();
        this.renderView(apptDetailsView);
    },

    apptAck: function () {
        var apptAckView = new AppointmentAckView();
        this.renderView(apptAckView);
    },
    
    viewAppt: function (id) {
        var that = this;
        var query = "SELECT City_Address__c,Contact_Name__c,CreatedDate,Id,Name,Problem_Description__c,Requested_Appointment_Date__c,Requested_Appointment_Time_Hour__c,State_Address__c,status__c,Street_Address__c,Zip_Address__c FROM Appointment__c WHERE IsDeleted = false AND Id = '" + id + "'";
        client.query(query,
            function (response) {
                console.log(response);
                if (response.contents.records.length > 0) {
                    var viewApptView = new ViewApptView({ model: response.contents.records[0] });
                    that.renderView(viewApptView);
                }
            },
            function (jqXHR) {
                console.log(jqXHR);
            });
    }
});

$("#logoFooter").click(function () { //fill appt details for demo
    if (location.hash == "#apptDetails") {
        $("#txtProblem").val("I can't connect my DVR to the TV.");
        $("#txtStreet").val("333 Harrison St");
        $("#txtCity").val("San Francisco");
        $("#txtState").val("CA");
        $("#txtZip").val("94105");
    }
});
