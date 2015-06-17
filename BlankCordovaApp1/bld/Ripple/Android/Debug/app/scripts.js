﻿var droidSync = angular.module('droidSync', ['ionic', 'ngRoute']);

droidSync.config(function ($routeProvider) {
    $routeProvider

    .when('/', {
        templateUrl: 'app/pages/main.html',
        controller: 'mainController'
    })

    .when('/addcontact', {
        templateUrl: 'app/pages/addcontact.html',
        controller: 'managerController'
    })

    .when('/editcontact', {
        templateUrl: 'app/pages/editcontact.html',
        controller: 'managerController'
    })

    .when('/deletecontact', {
        templateUrl: 'app/pages/deletecontact.html',
        controller: 'managerController'
    })

    .when('/managermenu', {
        templateUrl: 'app/pages/managermenu.html',
        controller: 'managermenuController'
    })

    .when('/settings', {
        templateUrl: 'app/pages/settings.html',
        controller: 'settingsController'
    });
});

droidSync.controller('mainController', function ($scope) {

});

droidSync.controller('managermenuController', function ($scope) {

});

droidSync.controller('settingsController', function ($scope) {

});

droidSync.controller('managerController', function ($scope) {

    //Initialize model
    $scope.contact = {};

    // Create a new contact
    $scope.createContact = function () {
        // Contact Object
        contact = navigator.contacts.create();
        $scope.saveContact();
    };

    // Pick Contact from Device
    $scope.editContact = function () {
       contact = navigator.contacts.pickContact(function(contact){
            console.log(contact);

            //This only updates the text fields. It does not actually assign new values to the object
            $scope.$apply(function () {
                $scope.contact.firstName = contact.name.givenName;
                $scope.contact.lastName = contact.name.familyName;
                $scope.contact.mobileNo = contact.phoneNumbers[0].value;
                $scope.contact.homeNo = contact.phoneNumbers[1].value;
                $scope.contact.email = contact.emails[0].value;
                $scope.contact.id = contact.id;
            });
        })
    };

    $scope.deleteContact = function () {

        var contact = navigator.contacts.create();

        if (contact.id !== 'undefined') {
            contact.id = $scope.contact.id;
            contact.remove();
        }
    }

    $scope.findContact = function () {
        var fields = ["id"];
        navigator.contacts.find(fields, onSuccess);
        

        function onSuccess(contacts) {
            for (var i = 0; i < contacts.length; i++) {
                console.log("IDs = " + contacts[i].id);
            }
        }
    }


    $scope.saveContact = function () {

        var contact = navigator.contacts.create();

        if ($scope.contact.id !== 'undefined') {
            contact.id = $scope.contact.id;
            contact.rawId = $scope.contact.id;
        }

        // Display Name and Email
        contact.displayName = $scope.contact.firstName;
        contact.nickname = $scope.contact.lastName;

        var emails = [];
        emails[0] = new ContactField('work', $scope.contact.email, true)
        contact.emails = emails;

        // Phone Numbers
        var phoneNumbers = [];
        phoneNumbers[0] = new ContactField('mobile', $scope.contact.mobileNo, true); // preferred number
        phoneNumbers[1] = new ContactField('home', $scope.contact.homeNo, false);
        contact.phoneNumbers = phoneNumbers;

        // Names
        var name = new ContactName();
        name.givenName = $scope.contact.firstName;
        name.familyName = $scope.contact.lastName;
        contact.name = name;

        // save to device
        contact.save();
    }
});

