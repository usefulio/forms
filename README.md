Easy to use reactive forms with validation
===============

Write your forms using simple html:

      <form>
        <input name="name" value={{value "name"}}>
        <span class="error">{{error "name"}}</span>
      </form>

Then just use the built in helpers for state and validation:

- `{{error 'somePropertyName'}}` returns any errors associated with the property 'somePropertyName'
- `{{value 'profile.emails[0].address}}` returns a property value, can handle deeply nested properties.