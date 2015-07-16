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
                            //It is safe to use contact[0] as there will only ever be one returned as AzureID is unique
                            contactToDelete.id = contact[0].id;
                            contactToDelete.rawId = contact[0].id;
                            console.log('we want to delete this', contactToDelete);
                            contactToDelete.remove();
                            alert('Contact Deleted');
                        }
                        else {
                            console.log('Contact to delete not present on device. Checking next contact');
                        }
                    }
                    function findError() {
                        alert('Contact search failed: Deleted Contact Search');
                    }
                }
                else {

                    //create a contact object to save or update
                    var emails = [];
                    var phoneNumbers = [];
                    var name = new ContactName();
                    var contactToUpdate = navigator.contacts.create();
                    contactToUpdate.note = results[i].id;
                    name.givenName = results[i].firstname;
                    name.familyName = results[i].lastname;
                    phoneNumbers[0] = new ContactField('mobile', results[i].mobilephone, true);
                    phoneNumbers[1] = new ContactField('home', results[i].homephone, false);
                    emails[0] = new ContactField('work', results[i].email, true);
                    contactToUpdate.name = name;
                    contactToUpdate.phoneNumbers = phoneNumbers;
                    contactToUpdate.emails = emails;

                    //Search for the contact on the device
                    var options = new ContactFindOptions();
                    options.filter = results[i].id;
                    options.multiple = false;
                    var fields = ["*"];
                    navigator.contacts.find(fields, foundSuccess, foundError, options);

                    function foundSuccess(contact) {
                        if (contact.length > 0) {
                            //The contact has been found on the device. Pass in ids for contact, emails and phone numbers to update.
                            //console.log('Contact found its device id is', contact[0].id);
                            //console.log('its phone number id for zero is', contact[0].phoneNumbers[0].id);
                            //console.log('contactToUpdate = ', contactToUpdate);
                            //console.log('contactToUpdate PhoneNumber zero = ', contactToUpdate.phoneNumbers[0].value);
                            //console.log('contactToUpdate PhoneNumber id = ', contactToUpdate.phoneNumbers[0].id);
                            //console.log('p1:p2:e1', contactToUpdate.phoneNumbers[0].id, contactToUpdate.phoneNumbers[1].id, contactToUpdate.emails[0].id);
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
                                console.log('error updating a contact!', ContactError.code);
                            }
                        }
                        //else {
                        //    //The contact does not exist on the device. Just save it.
                        //    console.log('non existent contact: ', contactToUpdate);
                        //    contactToUpdate.save(saveSuccess, SaveError);
                        //    function saveSuccess() {
                        //        console.log('saved a contact!');
                        //    }
                        //    function SaveError() {
                        //        console.log('error saving a contact!');
                        //    }
                            
                        //}
                    }
                    function foundError() {
                        alert('Contact search failed: Undeleted Contact Search');
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