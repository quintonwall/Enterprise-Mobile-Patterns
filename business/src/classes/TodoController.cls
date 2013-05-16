@RestResource(urlMapping='/Todos/*')
global class TodoController {

    @HttpGet  
    global static List<Todo__c> getTodos() {
        List<Todo__c> todos = [SELECT Name from Todo__c];
        return todos;
    }

    @HttpPost 
    global static String createNewTodo(String description) {
        Todo__c t = new Todo__c();
        t.Description__c = description;
        insert t;

        return 'Done';
   }

    @HttpDelete
    global static String deleteWidgetByTodo() {
        String Id = RestContext.request.params.get('Id');
        List<Todo__c> t = [ Select ID from Todo__c where Id= :Id];

        delete t;

        return 'Deleted TODO';
    }

    @HttpPut
    global static String updateTodo(String Id, String NewDescription) {
        Todo__c t = [ Select ID, Description__c from Todo__c where Id= :Id];

        t.Description__c = NewDescription;
        update t;

        return 'TODO Updated';
    }
}