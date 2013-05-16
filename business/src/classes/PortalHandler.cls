global class PortalHandler implements Auth.RegistrationHandler{
    global User createUser(Id portalId, Auth.UserData data){
        Account a = [SELECT Id FROM account WHERE name='CloudCable Customer Mobile App'];
        Contact c = new Contact();
        c.accountId = a.Id;
        c.email = data.email;
        c.firstName = data.firstName;
        c.lastName = data.lastName;
        c.Facebook_ID__c = data.username;
        insert(c);
        
        //send devzone t-shirt giveaway email
        //note: the email will go to the email on the user's facebook account
		EmailTemplate et = [Select id from EmailTemplate where name='DevZone T-shirt'];
		Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
		mail.setTargetObjectId(c.Id);
		mail.setSenderDisplayName('Salesforce Platform DevZone');
		mail.setTemplateId(et.id);
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail }); 
	    
        User u = new User();
        Profile p = [SELECT Id FROM profile WHERE name='API Portal User'];
        
        // Use incoming email for username, since we're creating a portal user
        
        u.username = data.email;
        u.email = data.email;
        u.lastName = data.lastName;
        u.firstName = data.firstName;
        u.alias = (data.username != null) ? data.username : data.identifier;
        
        if (u.alias.length() > 8) {
            u.alias = u.alias.substring(0, 8);
        }
        
        u.languagelocalekey = UserInfo.getLocale();
        u.localesidkey = UserInfo.getLocale();
        u.emailEncodingKey = 'UTF-8';
        u.timeZoneSidKey = 'America/Los_Angeles';
        u.profileId = p.Id;
        u.contactId = c.Id;
        
        System.debug('Returning new user record for '+data.username);
        
        return u;
    }

    global void updateUser(Id userId, Id portalId, Auth.UserData data){
        User u = new User(id=userId);
        u.email = data.email;
        u.lastName = data.lastName;
        u.firstName = data.firstName;
 
        String contactId = [SELECT contactId FROM user WHERE Id= :userId].contactId;
        
        Contact c = new Contact(Id=contactId);
        c.Facebook_ID__c = data.username;
        
        System.debug('Updating user record for '+data.username);        
        System.debug('Updating contact ID is '+contactId);
        
        update(u);
        update(c);
        
    }

}