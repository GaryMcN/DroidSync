// http://go.microsoft.com/fwlink/?LinkID=290993&clcid=0x409
var DroidSyncServiceClient;
document.addEventListener("deviceready", function () {    
    DroidSyncServiceClient = new WindowsAzure.MobileServiceClient(
                    "https://droidsyncservice.azure-mobile.net/",
                    "TWbsJdVTuCCjsPdFamBdNPXkUOpnXB82");
});