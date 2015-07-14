//Initializing the App 
var droidSync = angular.module('droidSync', ['ionic', 'ngRoute', 'ui.router']);

//Linking the Azure Mobile Service
var AzureService;
document.addEventListener("deviceready", function () {
    AzureService = new WindowsAzure.MobileServiceClient(
                    "https://droidsyncservice.azure-mobile.net/",
                    "pCMHFJTONrcsSrHrpZTohJYqcjzTbC48");
    console.log('azure db ready');
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

    $scope.syncContacts = function () {

        var table = AzureService.getTable('contact');
        table.read().done(function (results) {
            console.log("Results: ", results);
            for (var i = 0; i < results.length; i++) {
                
                // If the contact is flagged as deleted check if its on the device and delete it
                if (results[i].isdeleted == true) {
                    var options = new ContactFindOptions();
                    options.filter = results[i].id;
                    options.multiple = false;
                    var fields = ["*"];
                    navigator.contacts.find(fields, findSuccess, findError, options);
                    function findSuccess(contact) {
                        if (contact.length > 0) {
                            console.log("inside the delete area:", contact);
                            var contactToDelete = navigator.contacts.create();
                            contactToDelete.id = contact[0].id;
                            contactToDelete.rawId = contact[0].id;
                            console.log('we want to delete this', contactToDelete);
                            contactToDelete.remove();
                            alert('Contact Deleted');
                        }
                        else {
                            console.log('not this time');
                        }
                    }
                    function findError() {
                        console.log('find did not execute or had errors');
                    }
                }
            }
        });
    };
        
});

droidSync.controller('managermenuController', function ($scope) {

});

droidSync.controller('settingsController', function ($scope) {

});

droidSync.controller('managerController', function ($scope, $state) {

    //Initialize model
    $scope.contact = {};
    var id = null;
    var azureId = null;
    var homePhoneId = null;
    var mobilePhoneId = null;
    var emailId = null;

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
                azureId = contact.note;
                mobilePhoneId = contact.phoneNumbers[0].id;
                homePhoneId = contact.phoneNumbers[1].id;
                emailId = contact.emails[0].id;
                console.log("contact id is: ", id);
                console.log("contact azureId is: ", azureId);
            });
        })
    };

    $scope.deleteContact = function () {
        var table = AzureService.getTable('contact');
        var contact = navigator.contacts.create();
        contact.id = id;

        table.update({ id: azureId, isdeleted: true }).done(function (deleted) {
            contact.remove(delSuccess, delError);

            function delSuccess(delContact) {
                alert("Contact Deleted");
                $state.go('managermenu');
            }
            function delError(contactError) {
                alert('Error Deleting');
                $state.go('managermenu');
            }
        })
    };

    $scope.saveContact = function () {

        // Get Table From Azure Mobile Services
        var table = AzureService.getTable('contact');
        var contact = navigator.contacts.create();

        if (id !== null && id !== undefined) {
            contact.id = id;
            contact.rawId = id;
        }

        if (emailId == null || emailId == undefined){
            var emails = [];
            emails[0] = new ContactField('work', $scope.contact.email, true);
            contact.emails = emails;
        }
        else {
            var emails = [];
            emails[0] = new ContactField('work', $scope.contact.email, true);
            emails[0].id = emailId;
            contact.emails = emails;
        }
        

        // Phone Numbers
        if (mobilePhoneId == null && homePhoneId == null) {
            var phoneNumbers = [];
            phoneNumbers[0] = new ContactField('mobile', $scope.contact.mobileNo, true); // preferred number
            phoneNumbers[1] = new ContactField('home', $scope.contact.homeNo, false);
            contact.phoneNumbers = phoneNumbers;
        }
        else {
            var phoneNumbers = [];
            phoneNumbers[0] = new ContactField('mobile', $scope.contact.mobileNo, true); // preferred number
            phoneNumbers[0].id = mobilePhoneId;
            phoneNumbers[1] = new ContactField('home', $scope.contact.homeNo, false);
            phoneNumbers[1].id = homePhoneId;
            contact.phoneNumbers = phoneNumbers;
        }

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
                    $state.go('managermenu');
                }
                function saveError() {
                    alert("Error Saving Contact");
                    $state.go('managermenu');
                }
            })
        }
        else {
            var updateContact = {
                id: azureId,
                firstname: name.givenName,
                lastname: name.familyName,
                homephone: phoneNumbers[0].value,
                mobilephone: phoneNumbers[1].value,
                email: emails[0].value
            };
            table.update(updateContact).done(function (updated) {
                console.log("Updated Contact Id is: ", updated.id);

                contact.note = updated.id;
                contact.save(upSuccess, upError);

                function upSuccess() {
                    alert('Update Successful');
                    $state.go('managermenu');
                }
                function upError() {
                    alert('Error Updating Contact');
                    $state.go('managermenu');
                }
            })
        }
    };
});