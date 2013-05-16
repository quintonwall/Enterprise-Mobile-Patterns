Enterprise-Mobile-Patterns
==========================

Complete reference mobile application for the Enterprise Mobile Patterns on Salesforce Platform.

The app demonstrates typical use case of a consumer facing mobile app connected to cloud-based business and mobile backend, with employees.using secure enterprise mobile apps.

![reference app overview](https://github.com/quintonwall/Enterprise-Mobile-Patterns/blob/master/overview.png)

The code is divided into 3 projects that map to these apps with core context (identity, business logic and data) common to all (per the mobile platform pattern)

*Consumer*
Consumer facing application written using Twitter Bootstrap, Backbone, and Force.tk - a lightweight Javascript wrapper on the Salesforce Platform RESTful APIs. Together this technology 'stack' is referred to as a developer mobile pack. 

*Business*
The Salesforce Platform provides a comprehensive mobile backend as a service (mBaaS). The Enterprise Mobile Patterns guide describes the fundamental patterns developers should be familar with when building mobile apps using the Salesforce Platform. The reference application contains the complete code and meta data for the business implementation (workflow & triggers specifically)

*Employee*
Employee facing mobile app using the developer mobile packs and the Mobile SDK to develop a hybrid application (based on Phonegap Cordova) for iOS. 
