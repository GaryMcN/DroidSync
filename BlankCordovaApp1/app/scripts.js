﻿//Initializing the App 
var droidSync = angular.module('droidSync', ['ionic', 'ngRoute', 'ui.router']);

//Linking the Azure Mobile Service
var AzureService;
document.addEventListener("deviceready", function () {
    AzureService = new WindowsAzure.MobileServiceClient(
                    "https://droidsyncservice.azure-mobile.net/",
                    "pCMHFJTONrcsSrHrpZTohJYqcjzTbC48");
});

droidSync.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider

    .state('managermenu', {
        url: '/managermenu',
        templateUrl: 'app/pages/managermenu.html',
        controller: 'managermenuController'
    })

    .state('main', {
        url: '/',
        templateUrl: 'app/pages/main.html',
        controller: 'mainController'
    })

    .state('settings', {
        url: '/settings',
        templateUrl: 'app/pages/settings.html',
        controller: 'settingsController'
    })

    .state('addcontact', {
        url: '/addcontact',
        templateUrl: 'app/pages/addcontact.html',
        controller: 'managerController'
    })

    .state('editcontact', {
        url: '/editcontact',
        templateUrl: 'app/pages/editcontact.html',
        controller: 'managerController'
    })

    .state('deletecontact', {
        url: '/editcontact',
        templateUrl: 'app/pages/deletecontact.html',
        controller: 'managerController'
    })
});

droidSync.controller('mainController', function ($scope) {

    $scope.contacts = [{}];

    $scope.syncContacts = function () {
        
        var table = AzureService.getTable('contact');
        //use a var = table.read maybe?
        table.read().done(function (results) {
            for (var i = 0; i < results.length; i++) {
                
                var id = results[i].id;
                var firstname = results[i].firstname;
                var lastname = results[i].lastname;
                var homephone = results[i].homephone;
                var mobile = results[i].mobilephone;
                var email = results[i].email;

                var contact = navigator.contacts.create();

                //contact.id = id;
                //contact.rawId = id;

                //find by name

                // Display Name and Email
                contact.displayName = firstname;
                contact.nickname = lastname;

                var emails = [];
                emails[0] = new ContactField('work', email, true)
                contact.emails = emails;

                // Phone Numbers
                var phoneNumbers = [];
                phoneNumbers[0] = new ContactField('mobile', mobile, true); // preferred number
                phoneNumbers[1] = new ContactField('home', homephone, false);
                contact.phoneNumbers = phoneNumbers;

                // Names
                var name = new ContactName();
                name.givenName = firstname;
                name.familyName = lastname;
                contact.name = name;

                contact.save();
                //function onSuccess() {
                //    alert('This should not be firing');
                //}
                //function onError() {
                //    alert('Error: ' + error.code);
                //}
            }
        })
    }
        
});

droidSync.controller('managermenuController', function ($scope) {

});

droidSync.controller('settingsController', function ($scope) {

});

droidSync.controller('managerController', function ($scope, $state) {

    //Initialize model
    $scope.contact = {};
    var id = null;

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
                id = contact.id;
                console.log("contact id is: ", id);
            });
        })
    };

    $scope.deleteContact = function () {
        var table = AzureService.getTable('contact');
        var contact = navigator.contacts.create();
        contact.id = id;
        contact.remove(delSuccess, delError);

        function delSuccess(delContact) {
            table.del({ id: id });
            alert("Contact Deleted");
            $state.go('managermenu');
        }
        function delError(contactError) {
            alert('Error Deleting');
            $state.go('managermenu');
        }
    }

    $scope.saveContact = function () {

        // Get Table From Azure Mobile Services
        var table = AzureService.getTable('contact');

        // Check for existance of contact object
        if (contact == null || contact == undefined)
        {
            var contact = navigator.contacts.create();
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

        //If there is no id, it is a new contact, otherwise it is an update
        if (id == null || id == undefined) {
            var newContact = {
                firstname: name.givenName,
                lastname: name.familyName,
                homephone: phoneNumbers[0].value,
                mobilephone: phoneNumbers[1].value,
                email: emails[0].value
            };
            table.insert(newContact).done(function (inserted) {
                console.log("Id is: ", inserted.id);
                contact.note = inserted.id;
                contact.save(saveSuccess, saveError);

                function saveSuccess() {
                    alert("Contact Saved");
                }
                function saveError() {
                    alert("Error Saving Contact");
                }
            });

            
        }
        else {
            contact.id = id;
            contact.rawId = id;
            contact.save(upSuccess, upError);
        }


        // Error Handling

        // Add Contact
        function saveSuccess(newContact) {
            alert("Contact Saved.");
            $state.go('managermenu');
        }
        function saveError(contactError) {
            alert('Error Saving');
            $state.go('managermenu');
        }

        // Update Contact
        function upSuccess(upContact) {
            id = upContact.id;
            table.update({ /*id: id,*/
                firstname: name.givenName,
                lastname: name.familyName,
                homephone: phoneNumbers[0].value,
                mobilephone: phoneNumbers[1].value,
                email: emails[0].value
            });
            alert("Contact Updated");
            $state.go('managermenu');
        }
        function upError(contactError) {
            alert('Error Saving');
            $state.go('managermenu');
        }
    }
});