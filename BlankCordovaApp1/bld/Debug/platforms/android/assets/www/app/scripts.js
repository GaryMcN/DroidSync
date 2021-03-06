﻿//Initializing the App 
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

droidSync.controller('mainController', function ($scope, $ionicLoading) {

    $scope.syncContacts = function (complete) {

        //Display a loading screen while sync is in execution
        $ionicLoading.show({
            template: '<p>Syncing Contacts...</p><ion-spinner class="spinner-calm" icon="crescent"/>',
            duration: 5000
        });

        var table = AzureService.getTable('contact');
        table.read().done(function (results) {
            results.forEach(function (result) {
                console.log('result is', result);
                // If the contact is flagged as deleted check if its on the device and delete it
                if (result.isdeleted == true) {
                    var options = new ContactFindOptions();
                    options.filter = result.id;
                    options.multiple = false;
                    var fields = ["*"];
                    navigator.contacts.find(fields, findSuccess, findError, options);
                    function findSuccess(contact) {
                        if (contact.length > 0) {
                            console.log("inside the delete area:", contact);
                            var contactToDelete = navigator.contacts.create();
                            //It is safe to use contact[0] as there will only ever be one returned as AzureID is unique
                            contactToDelete.id = contact[0].id;
                            contactToDelete.rawId = contact[0].id;
                            console.log('we want to delete this', contactToDelete);
                            contactToDelete.remove();
                            console.log('Contact Deleted');
                        }
                        else {
                            console.log('Contact to delete not present on device. Checking next contact');
                        }
                    }
                    function findError() {
                        console.log('Contact search failed: Deleted Contact Search');
                    }
                }
                else {
                    //create a contact object to save or update
                    var emails = [];
                    var phoneNumbers = [];
                    var name = new ContactName();
                    var contactToUpdate = navigator.contacts.create();
                    contactToUpdate.note = result.id;
                    name.givenName = result.firstname;
                    name.familyName = result.lastname;
                    phoneNumbers[0] = new ContactField('mobile', result.mobilephone, true);
                    phoneNumbers[1] = new ContactField('home', result.homephone, false);
                    emails[0] = new ContactField('work', result.email, true);
                    contactToUpdate.name = name;
                    contactToUpdate.phoneNumbers = phoneNumbers;
                    contactToUpdate.emails = emails;

                    //Search for the contact on the device
                    var options = new ContactFindOptions();
                    options.filter = result.id;
                    options.multiple = false;
                    var fields = ["*"];
                    navigator.contacts.find(fields, foundSuccess, foundError, options);

                    function foundSuccess(contact) {
                        if (contact.length > 0) {
                            //The contact has been found on the device. Pass in ids for contact, emails and phone numbers to update.
                            console.log('object to update is object is', contact);
                            console.log('contact array length is ', contact.length);

                            contactToUpdate.id = contact[0].id;
                            contactToUpdate.rawId = contact[0].rawId;
                            contactToUpdate.phoneNumbers[0].id = contact[0].phoneNumbers[0].id;
                            contactToUpdate.phoneNumbers[1].id = contact[0].phoneNumbers[1].id;
                            contactToUpdate.emails[0].id = contact[0].emails[0].id;
                            console.log('about to save this', contactToUpdate);
                            contactToUpdate.save(upSuccess, upError);
                            function upSuccess() {
                                console.log('updated a contact!');
                            }
                            function upError(ContactError) {
                                console.log('error updating a contact!');
                            }
                        }
                        else {
                            //The contact does not exist on the device. Just save it.
                            console.log('non existent contact: ', contactToUpdate);
                            contactToUpdate.save(saveSuccess, SaveError);
                            function saveSuccess() {
                                console.log('saved a contact!');
                            }
                            function SaveError() {
                                console.log('error saving a contact!');
                            }
                        }
                    }
                    function foundError() {
                        console.log('Contact search failed: Undeleted Contact Search');
                    }
                } // end else
            }); // end forEach
        }); // table.read()
    }; // scope.syncContacts()
});

droidSync.controller('managermenuController', function ($scope) {
    //Controller available for use in future work.
});

droidSync.controller('settingsController', function ($scope) {
    //Controller available for use in future work.
});

droidSync.controller('managerController', function ($scope, $state, $ionicLoading) {

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

        $ionicLoading.show({
            template: '<p>Deleting...</p><ion-spinner class="spinner-calm" icon="crescent"/>',
        });

        var table = AzureService.getTable('contact');
        var contact = navigator.contacts.create();
        contact.id = id;

        table.update({ id: azureId, isdeleted: true }).done(function (deleted) {
            contact.remove(delSuccess, delError);

            function delSuccess(delContact) {
                $ionicLoading.hide();
                alert("Contact Deleted");
                $state.go('managermenu');
            }
            function delError(contactError) {
                $ionicLoading.hide();
                alert('Error Deleting');
                $state.go('managermenu');
            }
        })
    };

    $scope.saveContact = function () {

        $ionicLoading.show({
            template: '<p>Saving...</p><ion-spinner class="spinner-calm" icon="crescent"/>',
        });

        // Get Table From Azure Mobile Services
        var table = AzureService.getTable('contact');

        // Contact Object
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
                    $ionicLoading.hide();
                    alert("Contact Saved");
                    $state.go('managermenu');
                }
                function saveError() {
                    $ionicLoading.hide();
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
                    $ionicLoading.hide();
                    alert('Update Successful');
                    $state.go('managermenu');
                }
                function upError() {
                    $ionicLoading.hide();
                    alert('Error Updating Contact');
                    $state.go('managermenu');
                }
            })
        }
    };
});