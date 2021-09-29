
# Simple String Templates

The simplest TypeScript / JavaScript string template implementation I could
think of. No configuration, no options. Okay, maybe some configuration. But
only very little, and all of it completely optional.

Text to be replaced is marked with `{{var}}`, the replacement for variables is
provided as a hash.

# Examples


    let template = new Template('Hello {{who}}!');
    console.log(template.render({ who: 'World!'}));

Prints the text "Hello World!!" (without the quotes).

Templates can have default values for replacement variables:

    let template = new Template('Hello {{who}}!', {  who: 'world' });
    console.log(template.render(null));

Prints the text `Hello world!`. The argument after the template string provides
default values for the replacement variables.

Without the default values, the replacement variable would be echoed, including
the surrounding `{{}}`.

    let template = new Template('Hello {{who}}!');
    console.log(template.render(null));

Prints the text `Hello {{who}}!`.

Default values can be changed:

    let template = new Template('Hello {{who}}!', {  who: 'world' });
    console.log(template.render(null));
    template.setDefaults({ who: 'universe' });
    console.log(template.render(null));

Prints two lines:

    Hello world!
    Hello universe!


Templates provide the names used in placeholders:

    let template = new Template('Hello {{who}}!');
    console.log(template.getNames());

Will print

    [ 'who' ]

# Tests

The current unit tests cover 100% of the code (lines and branches).
