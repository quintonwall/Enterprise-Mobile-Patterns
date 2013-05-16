trigger geocodeServiceAddress on Appointment__c (after insert) {


 for(Appointment__c cs : Trigger.New)  
 {
     GeocodingHelper.forwardGeocodeAddress(cs.Id, cs.Street_Address__c, cs.City_Address__c, cs.State_Address__c, cs.Zip_Address__c);
 }
}