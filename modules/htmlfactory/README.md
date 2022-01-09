
# HTML Dom Element factory

The simplest little factory for HTML elements I could think of.

Hierarchies of dom elements are created from plain object literals.

    document.body.appendChild(HTML.div('look ma, no createElement'));


# Examples


    document.body.appendChild(HTML.p('Hello World!!'));

Display the text "Hello World!!" (without the quotes) in a p.


Set attributes on your DOM nodes:

    document.body.appendChild(
        HTML.div({class: 'important'}, 'Hello World!!')
    );


# Tests

The current unit tests cover 100% of the code (lines and branches).
